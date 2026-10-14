import { Check, Minus, Plus, Share2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { GROCERY_CATALOG, categoryName } from "@/data/grocery-catalog";
import { SPI_MAP } from "@/data/spi-map";
import {
  addGroceryItem,
  clearPurchased,
  estimate,
  estimateBreakdown,
  findDuplicate,
  formatPKR,
  formatQty,
  mergeGroceryItem,
  removeGroceryItem,
  shoppingListText,
  togglePurchased,
  updateGroceryItem,
} from "@/features/groceries/actions";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore } from "@/lib/storage/stores";
import { GROCERY_UNITS, type CatalogProduct, type GroceryUnit, type ShoppingItem } from "@/types/groceries";
import { Btn, Field, Page, Sheet, Source, cx, inputCls } from "../components/ui";
import { usePbs } from "../lib/data";
import { share, tap } from "../lib/native";
import { toast } from "../lib/toast";

export function SamanScreen() {
  const items = usePersisted(groceryStore);
  const [adding, setAdding] = useState(false);
  const pending = items.filter((i) => !i.purchased).sort((a, b) => a.order - b.order);
  const bought = items.filter((i) => i.purchased);
  const est = estimate(pending);
  const groups = new Map<string, ShoppingItem[]>();
  for (const i of pending) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);

  return (
    <Page
      title="Saman"
      ur="سامان"
      right={
        <button type="button" aria-label="Share list" className="press grid size-10 place-items-center rounded-full bg-white/[0.06]" onClick={() => share("Saman list", shoppingListText(items, categoryName))}>
          <Share2 size={18} />
        </button>
      }
    >
      <div className="glass flex items-end justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-3">To buy</p>
          <p className="text-2xl font-semibold">{pending.length} items</p>
          <p className="text-xs text-ink-3">{estimateBreakdown(est.by) || "No prices yet"}</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">{est.priced ? formatPKR(est.total) : "—"}</p>
      </div>

      {pending.length === 0 && <p className="glass mt-3 p-4 text-ink-2">The list is empty. Tap + to add items; everyone at home sees them.</p>}
      {[...groups.entries()].map(([cat, list]) => (
        <section key={cat} className="mt-4">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-3">{categoryName(cat)}</h2>
          <ul className="space-y-2">
            {list.map((it) => (
              <Row key={it.id} item={it} />
            ))}
          </ul>
        </section>
      ))}

      {bought.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-3">Bought · {bought.length}</h2>
            <button type="button" className="text-xs text-coral" onClick={() => (clearPurchased(), toast("Cleared bought items", "info"))}>
              Clear
            </button>
          </div>
          <ul className="space-y-2 opacity-70">
            {bought.slice(0, 20).map((it) => (
              <Row key={it.id} item={it} />
            ))}
          </ul>
        </section>
      )}
      <Source>PBS = this week&apos;s official average price in your city (Pakistan Bureau of Statistics). Swipe an item left to remove it.</Source>

      <button type="button" aria-label="Add item" className="press fixed bottom-[calc(var(--safe-bottom)+5.2rem)] start-4 z-30 grid size-14 place-items-center rounded-full bg-gold text-[#2a1a05] shadow-lg" onClick={() => setAdding(true)}>
        <Plus size={26} />
      </button>
      <AddSheet open={adding} onClose={() => setAdding(false)} />
    </Page>
  );
}

function Row({ item }: { item: ShoppingItem }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const step = ["kg", "litre", "dozen"].includes(item.unit) ? 0.5 : 1;
  const remove = () => {
    const removed = removeGroceryItem(item.id);
    void tap("medium");
    if (removed) toast(`Removed ${removed.name}`, "info");
  };
  return (
    <li className="relative overflow-hidden rounded-[20px]">
      <div className="absolute inset-0 flex items-center justify-end bg-coral/80 pe-5 text-[#2a0d06]">
        <Trash2 size={20} />
      </div>
      <div
        className="glass glass-strong relative flex items-center gap-3 p-3"
        style={{ transform: `translateX(${dx}px)`, transition: start.current == null ? "transform 200ms var(--ease)" : "none", touchAction: "pan-y" }}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerMove={(e) => start.current != null && setDx(Math.min(0, e.clientX - start.current))}
        onPointerUp={() => {
          start.current = null;
          if (dx < -110) remove();
          setDx(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
      >
        <button
          type="button"
          aria-label={item.purchased ? "Mark not bought" : "Mark bought"}
          className={cx("press grid size-8 shrink-0 place-items-center rounded-full border-2", item.purchased ? "border-emerald bg-emerald text-[#06231a]" : "border-white/30")}
          onClick={() => {
            void tap(item.purchased ? "light" : "medium");
            togglePurchased(item.id);
          }}
        >
          {item.purchased && <Check size={16} strokeWidth={3} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cx("truncate font-medium", item.purchased && "line-through")}>{item.name}</p>
          <p className="truncate text-xs text-ink-3">
            {item.unitPrice != null ? `${formatPKR(item.unitPrice * item.quantity)}` : "No price"}
            {item.priceSource === "pbs" && <span className="text-emerald"> PBS</span>}
            {(item.priceSource === "sample" || item.priceIsSample) && <span className="text-gold"> est.</span>}
            {item.notes ? ` · ${item.notes}` : ""}
          </p>
        </div>
        {!item.purchased && (
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Less" className="press grid size-8 place-items-center rounded-full bg-white/[0.06]" disabled={item.quantity <= step} onClick={() => updateGroceryItem(item.id, { quantity: Math.max(step, item.quantity - step) })}>
              <Minus size={14} />
            </button>
            <span className="w-16 text-center text-sm tabular-nums">{formatQty(item.quantity, item.unit)}</span>
            <button type="button" aria-label="More" className="press grid size-8 place-items-center rounded-full bg-white/[0.06]" onClick={() => updateGroceryItem(item.id, { quantity: item.quantity + step })}>
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pbs = usePbs();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<CatalogProduct | null>(null);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<GroceryUnit>("kg");
  const [price, setPrice] = useState("");
  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return GROCERY_CATALOG.slice(0, 12);
    return GROCERY_CATALOG.filter((p) => p.name.toLowerCase().includes(n) || p.nameUr?.includes(q.trim()) || p.id.includes(n)).slice(0, 20);
  }, [q]);
  const pbsPrice = (p: CatalogProduct) => {
    const link = SPI_MAP[p.id];
    const it = link && pbs.data?.items.find((i) => i.no === link.no);
    return it?.avg ? Math.round(it.avg * link.factor * 100) / 100 : null;
  };
  const choose = (p: CatalogProduct) => {
    void tap();
    setPicked(p);
    setUnit(p.unit);
    const official = pbsPrice(p);
    setPrice(official != null ? String(official) : "");
  };
  const reset = () => {
    setQ("");
    setPicked(null);
    setQty("1");
    setPrice("");
  };
  const save = () => {
    const name = (picked?.name ?? q).trim();
    const quantity = Number(qty);
    if (!name || !(quantity > 0)) return;
    const official = picked ? pbsPrice(picked) : null;
    const unitPrice = price.trim() ? Number(price) : undefined;
    const fromPbs = official != null && unitPrice === official && unit === picked?.unit;
    const input = {
      productId: picked?.id,
      name,
      category: picked?.category ?? ("other" as const),
      quantity,
      unit,
      unitPrice,
      priceSource: unitPrice == null ? undefined : fromPbs ? ("pbs" as const) : ("user" as const),
      priceNote: fromPbs && pbs.data ? `PBS avg · ${pbs.data.cityName} · week ending ${pbs.data.week}` : undefined,
    };
    const dup = findDuplicate(groceryStore.get(), input);
    if (dup) mergeGroceryItem(dup.id, input);
    else addGroceryItem(input);
    void tap("medium");
    toast(dup ? `Added more ${name}` : `Added ${name}`);
    reset();
  };
  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add to Saman"
    >
      {!picked ? (
        <>
          <input autoFocus className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items (English or اردو)" />
          <ul className="mt-3 max-h-[46vh] space-y-1 overflow-y-auto">
            {matches.map((p) => {
              const official = pbsPrice(p);
              return (
                <li key={p.id}>
                  <button type="button" className="press flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start hover:bg-white/[0.05]" onClick={() => choose(p)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{p.name}</span>
                      {p.nameUr && (
                        <span lang="ur" className="block truncate text-xs text-ink-3">
                          {p.nameUr}
                        </span>
                      )}
                    </span>
                    {official != null && (
                      <span className="text-xs tabular-nums text-emerald">
                        Rs {official}/{p.unit} PBS
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {q.trim() && (
              <li>
                <button type="button" className="press w-full rounded-2xl px-3 py-2.5 text-start text-emerald" onClick={() => setPicked({ id: "", name: q.trim(), category: "other", unit: "piece" } as CatalogProduct)}>
                  Add &ldquo;{q.trim()}&rdquo; as a new item
                </button>
              </li>
            )}
          </ul>
        </>
      ) : (
        <div className="space-y-3 pb-4">
          <p className="text-lg font-medium">{picked.name}</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantity">
              <input className={inputCls} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))} />
            </Field>
            <Field label="Unit">
              <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as GroceryUnit)}>
                {GROCERY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Price per unit (Rs, optional)" hint={picked.id && pbsPrice(picked) != null && price === String(pbsPrice(picked)) ? `This week's PBS average in ${pbs.data?.cityName}. Change it if your shop differs.` : undefined}>
            <input className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
          </Field>
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => setPicked(null)}>
              Back
            </Btn>
            <Btn tone="primary" className="flex-1" onClick={save}>
              Add to list
            </Btn>
          </div>
        </div>
      )}
    </Sheet>
  );
}
