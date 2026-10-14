"use client";

import { Info, Minus, Plus } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Field, IconButton, Input, Select, Textarea, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CATALOG_BY_ID, GROCERY_CATALOG, GROCERY_CATEGORIES } from "@/data/grocery-catalog";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, settingsStore } from "@/lib/storage/stores";
import { usePbsPrices, type ProductPrice } from "@/features/prices/use-pbs-prices";
import { GROCERY_UNITS, type CatalogProduct, type GroceryCategoryId, type GroceryUnit, type PriceSource } from "@/types/groceries";
import { addGroceryItem, findDuplicate, formatPKR, formatQty, mergeGroceryItem, type NewItemInput } from "./actions";
import { ProductThumb } from "./product-thumb";

interface Ctx {
  openAddItem: (productId?: string, name?: string) => void;
}
const GroceryDialogContext = createContext<Ctx | null>(null);

export function useGroceryDialog() {
  const ctx = useContext(GroceryDialogContext);
  if (!ctx) throw new Error("useGroceryDialog must be used within GroceryDialogProvider");
  return ctx;
}

export function GroceryDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; productId?: string; name?: string; key: number }>({ open: false, key: 0 });
  const openAddItem = useCallback((productId?: string, name?: string) => setState((s) => ({ open: true, productId, name, key: s.key + 1 })), []);
  const value = useMemo(() => ({ openAddItem }), [openAddItem]);
  return (
    <GroceryDialogContext.Provider value={value}>
      {children}
      <AddItemDialog
        key={state.key}
        open={state.open}
        initialProductId={state.productId}
        initialName={state.name}
        onClose={() => setState((s) => ({ ...s, open: false }))}
      />
    </GroceryDialogContext.Provider>
  );
}

interface FormState {
  productId?: string;
  name: string;
  category: GroceryCategoryId;
  quantity: string;
  unit: GroceryUnit;
  price: string;
  /** Where a prefilled price came from; null once the family types their own. */
  priceSource: Exclude<PriceSource, "user"> | null;
  priceNote?: string;
  notes: string;
}

function prefill(p: CatalogProduct | undefined, showSample: boolean, official: ProductPrice | null): Pick<FormState, "price" | "priceSource" | "priceNote"> {
  if (official) return { price: String(official.price), priceSource: "pbs", priceNote: official.label };
  if (showSample && p?.sampleUnitPrice != null) return { price: String(p.sampleUnitPrice), priceSource: "sample" };
  return { price: "", priceSource: null };
}

function fromProduct(p: CatalogProduct | undefined, showSample: boolean, official: ProductPrice | null = null): FormState {
  return {
    productId: p?.id,
    name: p?.name ?? "",
    category: p?.category ?? "vegetables",
    quantity: "1",
    unit: p?.unit ?? "kg",
    ...prefill(p, showSample, official),
    notes: "",
  };
}

function AddItemDialog({
  open,
  onClose,
  initialProductId,
  initialName,
}: {
  open: boolean;
  onClose: () => void;
  initialProductId?: string;
  initialName?: string;
}) {
  const settings = usePersisted(settingsStore);
  const items = usePersisted(groceryStore);
  const { toast } = useToast();
  const nameRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const { data: pbsData, forProduct } = usePbsPrices(undefined, open);
  const [form, setForm] = useState<FormState>(() => {
    const base = fromProduct(CATALOG_BY_ID.get(initialProductId ?? ""), settings.showSamplePrices);
    return initialName && !initialProductId ? { ...base, name: initialName } : base;
  });
  // PBS prices may arrive after the dialog opens: upgrade an untouched sample/empty prefill.
  useEffect(() => {
    if (!pbsData) return;
    setForm((f) => {
      const p = CATALOG_BY_ID.get(f.productId ?? "");
      const official = forProduct(f.productId);
      if (!p || !official || f.priceSource === "pbs" || (f.priceSource === null && f.price) || f.unit !== p.unit) return f;
      return { ...f, ...prefill(p, settings.showSamplePrices, official) };
    });
  }, [pbsData, forProduct, settings.showSamplePrices]);
  const [errors, setErrors] = useState<Partial<Record<"name" | "quantity" | "price", string>>>({});
  const [dupPrompt, setDupPrompt] = useState<{ existingId: string; input: NewItemInput; addAnother: boolean } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const q = form.name.trim().toLowerCase();
    if (q.length < 1 || form.productId) return [];
    return GROCERY_CATALOG.filter((p) => p.name.toLowerCase().includes(q) || p.nameUr?.includes(q)).slice(0, 6);
  }, [form.name, form.productId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pickProduct = (p: CatalogProduct) => {
    setForm((f) => ({ ...fromProduct(p, settings.showSamplePrices, forProduct(p.id)), quantity: f.quantity, notes: f.notes }));
    setShowSuggestions(false);
    setErrors({});
  };

  const validate = (): NewItemInput | null => {
    const e: typeof errors = {};
    const name = form.name.trim();
    const qty = Number(form.quantity);
    if (!name) e.name = "Enter an item name.";
    else if (name.length > 80) e.name = "Keep the name under 80 characters.";
    if (!form.quantity.trim() || !Number.isFinite(qty) || qty <= 0) e.quantity = "Quantity must be more than 0.";
    else if (qty > 10000) e.quantity = "That quantity looks too large.";
    let price: number | undefined;
    if (form.price.trim()) {
      price = Number(form.price);
      if (!Number.isFinite(price) || price < 0) e.price = "Enter a valid price, or leave it empty.";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      // Keep values; move focus to the first invalid field.
      const first = e.name ? "name" : e.quantity ? "qty" : "price";
      requestAnimationFrame(() => document.getElementById(`${formId}-${first}`)?.focus());
      return null;
    }
    return {
      productId: form.productId,
      name,
      category: form.category,
      quantity: qty,
      unit: form.unit,
      unitPrice: price,
      priceIsSample: price != null ? form.priceSource === "sample" : undefined,
      priceSource: price != null ? (form.priceSource ?? "user") : undefined,
      priceNote: price != null && form.priceSource === "pbs" ? form.priceNote : undefined,
      notes: form.notes.trim() || undefined,
    };
  };

  const finish = (message: string, addAnother: boolean) => {
    toast(message);
    setDupPrompt(null);
    if (addAnother) {
      setForm(fromProduct(undefined, settings.showSamplePrices));
      setErrors({});
      requestAnimationFrame(() => nameRef.current?.focus());
    } else {
      onClose();
    }
  };

  const submit = (addAnother: boolean) => {
    const input = validate();
    if (!input) return;
    const dup = findDuplicate(items, input);
    if (dup) {
      setDupPrompt({ existingId: dup.id, input, addAnother });
      return;
    }
    addGroceryItem(input);
    finish(`Added ${input.name} to your list`, addAnother);
  };

  const product = form.productId ? CATALOG_BY_ID.get(form.productId) : undefined;
  const dupItem = dupPrompt ? items.find((i) => i.id === dupPrompt.existingId) : undefined;
  const qtyNum = Number(form.quantity) || 0;
  const priceNum = Number(form.price);
  const lineTotal = form.price.trim() && Number.isFinite(priceNum) ? priceNum * qtyNum : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Item"
      description="Add something to your Saman list. Pick from the catalog or type your own."
      initialFocusRef={nameRef}
      size="md"
      footer={
        dupPrompt ? null : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => submit(true)}>
              Add &amp; another
            </Button>
            <Button variant="primary" type="submit" form={formId}>
              Add to list
            </Button>
          </>
        )
      }
    >
      {dupPrompt && dupItem ? (
        <div role="alertdialog" aria-labelledby={`${formId}-dup`} className="space-y-4">
          <div className="glass-soft flex items-start gap-3 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-cyan" aria-hidden />
            <div>
              <p id={`${formId}-dup`} className="text-sm font-medium text-ink">
                {dupItem.name} is already on your list ({formatQty(dupItem.quantity, dupItem.unit)}).
              </p>
              <p className="mt-1 text-xs text-ink-2">
                Merge to make it {formatQty(dupItem.quantity + dupPrompt.input.quantity, dupItem.unit)}, or keep a separate entry.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setDupPrompt(null)}>
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                addGroceryItem(dupPrompt.input);
                finish(`Added ${dupPrompt.input.name} as a separate item`, dupPrompt.addAnother);
              }}
            >
              Add separately
            </Button>
            <Button
              variant="primary"
              autoFocus
              onClick={() => {
                mergeGroceryItem(dupPrompt.existingId, dupPrompt.input);
                finish(`Updated ${dupPrompt.input.name} quantity`, dupPrompt.addAnother);
              }}
            >
              Merge quantities
            </Button>
          </div>
        </div>
      ) : (
        <form
          id={formId}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          className="grid gap-4"
        >
          <div className="flex gap-4">
            <div className="w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:w-24">
              <ProductThumb productId={form.productId} category={form.category} name={form.name || "New item"} />
            </div>
            <div className="relative min-w-0 flex-1">
              <Field label="Item name" htmlFor={`${formId}-name`} error={errors.name} hint={product?.nameUr ? <span className="font-urdu text-sm" lang="ur" dir="rtl">{product.nameUr}</span> : "Type to search the catalog"}>
                <Input
                  ref={nameRef}
                  id={`${formId}-name`}
                  value={form.name}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls={`${formId}-suggest`}
                  aria-autocomplete="list"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? `${formId}-name-error` : undefined}
                  placeholder="e.g. Tomato"
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value, productId: undefined }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && suggestions.length) {
                      e.preventDefault();
                      document.getElementById(`${formId}-opt-0`)?.focus();
                    }
                  }}
                />
              </Field>
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  id={`${formId}-suggest`}
                  role="listbox"
                  aria-label="Catalog suggestions"
                  className="absolute inset-x-0 top-[74px] z-10 overflow-hidden rounded-xl border border-white/12 bg-[#111b2a] shadow-2xl"
                >
                  {suggestions.map((p, i) => (
                    <li key={p.id} role="presentation">
                      <button
                        id={`${formId}-opt-${i}`}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-white/8 focus:bg-white/10 focus:outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickProduct(p)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            document.getElementById(`${formId}-opt-${i + 1}`)?.focus();
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            (i === 0 ? nameRef.current : document.getElementById(`${formId}-opt-${i - 1}`))?.focus();
                          }
                        }}
                      >
                        <span className="size-8 shrink-0 overflow-hidden rounded-lg">
                          <ProductThumb productId={p.id} category={p.category} name={p.name} />
                        </span>
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-ink-3">{p.unit}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor={`${formId}-cat`}>
              <Select id={`${formId}-cat`} value={form.category} onChange={(e) => set("category", e.target.value as GroceryCategoryId)}>
                {GROCERY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field label="Quantity" htmlFor={`${formId}-qty`} error={errors.quantity}>
                <div className="flex items-center gap-1">
                  <IconButton
                    label="Decrease quantity"
                    size="sm"
                    className="border-white/10 bg-white/5"
                    onClick={() => set("quantity", String(Math.max(0.25, Math.round(((Number(form.quantity) || 1) - 1) * 100) / 100)))}
                  >
                    <Minus className="size-4" />
                  </IconButton>
                  <Input
                    id={`${formId}-qty`}
                    inputMode="decimal"
                    className="text-center"
                    value={form.quantity}
                    aria-invalid={!!errors.quantity}
                    aria-describedby={errors.quantity ? `${formId}-qty-error` : undefined}
                    onChange={(e) => set("quantity", e.target.value.replace(/[^\d.]/g, ""))}
                  />
                  <IconButton
                    label="Increase quantity"
                    size="sm"
                    className="border-white/10 bg-white/5"
                    onClick={() => set("quantity", String(Math.round(((Number(form.quantity) || 0) + 1) * 100) / 100))}
                  >
                    <Plus className="size-4" />
                  </IconButton>
                </div>
              </Field>
              <Field label="Unit" htmlFor={`${formId}-unit`}>
                <Select id={`${formId}-unit`} value={form.unit} onChange={(e) => {
                    const unit = e.target.value as GroceryUnit;
                    // A prefilled price is per the catalog unit; drop it if the unit changes.
                    setForm((f) => (f.priceSource ? { ...f, unit, price: "", priceSource: null, priceNote: undefined } : { ...f, unit }));
                  }}>
                  {GROCERY_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <Field
            label="Estimated price per unit (PKR, optional)"
            htmlFor={`${formId}-price`}
            error={errors.price}
            hint={
              form.priceSource === "pbs" && form.price
                ? `${form.priceNote} (official average retail price). Edit if your shop charges differently.`
                : form.priceSource === "sample" && form.price
                  ? "Pre-filled with a rough sample estimate — not a live market price. Edit to your local price."
                  : "Leave empty if you don't know it; totals only include priced items."
            }
          >
            <div className="relative">
              <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3">Rs</span>
              <Input
                id={`${formId}-price`}
                inputMode="decimal"
                className="ps-10"
                value={form.price}
                placeholder="0"
                aria-invalid={!!errors.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d.]/g, ""), priceSource: null, priceNote: undefined }))}
              />
            </div>
          </Field>

          <Field label="Notes (optional)" htmlFor={`${formId}-notes`}>
            <Textarea
              id={`${formId}-notes`}
              className="min-h-16"
              maxLength={300}
              value={form.notes}
              placeholder="Brand, size, ripeness…"
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          <div
            className={cn(
              "flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm",
              lineTotal == null && "text-ink-3",
            )}
          >
            <span>Line estimate</span>
            <span className="font-semibold text-ink">
              {lineTotal != null ? formatPKR(lineTotal) : "—"}
              {lineTotal != null && form.priceSource === "sample" && <span className="ms-1 text-xs font-normal text-gold">sample</span>}
              {lineTotal != null && form.priceSource === "pbs" && <span className="ms-1 text-xs font-normal text-emerald">PBS</span>}
            </span>
          </div>
        </form>
      )}
    </Dialog>
  );
}
