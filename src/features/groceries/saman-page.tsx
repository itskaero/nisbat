"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardList,
  Download,
  ListChecks,
  Minus,
  PackageSearch,
  Plus,
  Search,
  Share2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import {
  Badge,
  Button,
  ChipRow,
  EmptyState,
  IconButton,
  Input,
  Panel,
  Segmented,
  Select,
  SourceNote,
  cn,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { GROCERY_CATALOG, GROCERY_CATEGORIES, categoryName } from "@/data/grocery-catalog";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, settingsStore } from "@/lib/storage/stores";
import type { GroceryCategoryId, ShoppingItem } from "@/types/groceries";
import {
  clearAll,
  clearPurchased,
  estimate,
  formatPKR,
  formatQty,
  lineTotal,
  moveItem,
  removeGroceryItem,
  restoreGroceryItem,
  shoppingListText,
  togglePurchased,
  updateGroceryItem,
} from "./actions";
import { useGroceryDialog } from "./add-item-dialog";
import { CATEGORY_ART, ProductThumb, allProductImages } from "./product-thumb";

type CatFilter = GroceryCategoryId | "all";

export function SamanPage() {
  const items = usePersisted(groceryStore);
  const hydrated = useHydrated();
  const { openAddItem } = useGroceryDialog();
  const [mobileTab, setMobileTab] = useState<"catalog" | "list">("catalog");
  const pending = items.filter((i) => !i.purchased).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight md:text-3xl">
            <ShoppingCart className="size-7 text-emerald" aria-hidden />
            Saman <span className="font-urdu text-xl text-ink-2" lang="ur">سامان</span>
          </h1>
          <p className="mt-1 text-sm text-ink-2">Your household grocery list, with a starter catalog of Pakistani staples.</p>
        </div>
        <Button variant="primary" onClick={() => openAddItem()}>
          <Plus className="size-4" aria-hidden /> Add Item
        </Button>
      </div>

      <Segmented
        className="lg:hidden"
        label="Saman view"
        value={mobileTab}
        onChange={setMobileTab}
        options={[
          { value: "catalog", label: "Catalog" },
          { value: "list", label: hydrated ? `My list (${pending})` : "My list" },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className={cn(mobileTab !== "catalog" && "hidden lg:block")}>
          <Catalog />
        </div>
        <div className={cn(mobileTab !== "list" && "hidden lg:block")}>
          <ShoppingList />
        </div>
      </div>
    </div>
  );
}

function Catalog() {
  const { openAddItem } = useGroceryDialog();
  const settings = usePersisted(settingsStore);
  const items = usePersisted(groceryStore);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatFilter>("all");
  const [creditsOpen, setCreditsOpen] = useState(false);

  const onList = useMemo(() => new Set(items.filter((i) => !i.purchased && i.productId).map((i) => i.productId)), [items]);

  const products = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GROCERY_CATALOG.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (!needle || p.name.toLowerCase().includes(needle) || p.nameUr?.includes(q.trim()) || p.id.includes(needle)),
    );
  }, [q, cat]);

  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="catalog-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h2 id="catalog-title" className="sr-only">
          Grocery catalog
        </h2>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search grocery items… (English or اردو)"
            aria-label="Search grocery catalog"
            className="ps-10"
          />
        </div>
      </div>
      <div role="radiogroup" aria-label="Filter by category" className="no-scrollbar -mx-1 mt-4 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {[{ id: "all" as CatFilter, name: "All", nameUr: "سب" }, ...GROCERY_CATEGORIES.filter((c) => c.id !== "other")].map((c) => {
          const active = cat === c.id;
          const art = c.id === "all" ? { icon: ShoppingCart, from: "#1b3a30", to: "#25503f", fg: "#8fe3b0" } : CATEGORY_ART[c.id as GroceryCategoryId];
          const Icon = art.icon;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCat(c.id as CatFilter)}
              className={cn(
                "flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2 pb-2.5 text-center transition-colors",
                active ? "border-emerald/50 bg-emerald/10" : "border-white/8 bg-white/[0.03] hover:border-white/20",
              )}
            >
              <span className="grid size-11 place-items-center rounded-xl" style={{ background: `radial-gradient(circle at 30% 25%, ${art.to}, ${art.from})` }}>
                <Icon className="size-5" style={{ color: art.fg }} aria-hidden />
              </span>
              <span className={cn("line-clamp-2 text-[11px] leading-tight", active ? "text-emerald" : "text-ink-2")}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {settings.showSamplePrices && (
        <p className="mt-3 rounded-xl border border-gold/20 bg-gold/8 px-3 py-2 text-xs text-gold/90">
          Prices marked <em>est.</em> are rough sample estimates for illustration, not live market rates. You can set your own price when adding.
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-5" />}
          title={`No catalog items match “${q}”`}
          description="You can still add it as a custom item."
          action={
            <Button variant="primary" size="sm" onClick={() => openAddItem()}>
              <Plus className="size-4" /> Add custom item
            </Button>
          }
        />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((p) => (
            <li key={p.id}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] transition-[border,background,transform] duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/[0.06]">
                <div className="relative overflow-hidden">
                  <ProductThumb productId={p.id} category={p.category} name={p.name} className="transition-transform duration-500 group-hover:scale-[1.04]" />
                  {onList.has(p.id) && (
                    <Badge tone="emerald" className="absolute start-2 top-2 bg-[#0b1220]/80">
                      <Check className="size-3" /> On list
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-3 pe-12">
                  <h3 className="text-sm font-medium leading-snug text-ink">{p.name}</h3>
                  {p.nameUr && (
                    <p lang="ur" dir="rtl" className="text-start font-naskh text-xs text-ink-3">
                      {p.nameUr}
                    </p>
                  )}
                  <p className="mt-auto pt-1 text-xs text-ink-2">
                    {settings.showSamplePrices && p.sampleUnitPrice != null ? (
                      <>
                        {formatPKR(p.sampleUnitPrice)}/{p.unit} <span className="text-gold/80">est.</span>
                      </>
                    ) : (
                      <>per {p.pack ?? p.unit}</>
                    )}
                  </p>
                </div>
                <IconButton
                  label={`Add ${p.name}`}
                  tone="accent"
                  size="sm"
                  className="absolute bottom-3 end-3 !rounded-full shadow-lg"
                  onClick={() => openAddItem(p.id)}
                >
                  <Plus className="size-4" />
                </IconButton>
              </article>
            </li>
          ))}
        </ul>
      )}
      <SourceNote className="mt-4">
        Starter catalog of common Pakistani household items — not an exhaustive market list. Product photos are openly licensed from
        Wikimedia Commons;{" "}
        <button type="button" className="underline underline-offset-2 hover:text-ink-2" onClick={() => setCreditsOpen(true)}>
          view image credits
        </button>
        . Items without a verified photo use a category illustration.
      </SourceNote>
      <Dialog open={creditsOpen} onClose={() => setCreditsOpen(false)} title="Image credits" size="lg">
        <ul className="space-y-2 text-xs text-ink-2">
          {allProductImages().map(([id, img]) => (
            <li key={id} className="flex flex-wrap gap-x-2">
              <span className="font-medium text-ink">{GROCERY_CATALOG.find((p) => p.id === id)?.name ?? id}:</span>
              <a className="underline underline-offset-2" href={img.sourceUrl} target="_blank" rel="noreferrer">
                {img.title.replace(/_/g, " ")}
              </a>
              <span>by {img.author}</span>
              <span>
                ({img.licenseUrl ? (
                  <a className="underline underline-offset-2" href={img.licenseUrl} target="_blank" rel="noreferrer">
                    {img.license}
                  </a>
                ) : (
                  img.license
                )}
                ), cropped and resized
              </span>
            </li>
          ))}
        </ul>
      </Dialog>
    </Panel>
  );
}

type SortMode = "custom" | "category";

function ShoppingList() {
  const items = usePersisted(groceryStore);
  const hydrated = useHydrated();
  const { toast } = useToast();
  const { openAddItem } = useGroceryDialog();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatFilter>("all");
  const [sort, setSort] = useState<SortMode>("category");
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter((i) => (cat === "all" || i.category === cat) && (!needle || i.name.toLowerCase().includes(needle)));
    const catIndex = (id: string) => GROCERY_CATEGORIES.findIndex((c) => c.id === id);
    return [...list].sort((a, b) => {
      if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
      if (sort === "category") return catIndex(a.category) - catIndex(b.category) || a.order - b.order;
      return a.order - b.order;
    });
  }, [items, q, cat, sort]);

  const groups = useMemo(() => {
    if (sort !== "category") return [{ key: "all", label: "", items: visible }];
    const map = new Map<string, ShoppingItem[]>();
    for (const i of visible) {
      const key = i.purchased ? "__purchased" : i.category;
      map.set(key, [...(map.get(key) ?? []), i]);
    }
    return [...map.entries()].map(([key, list]) => ({ key, label: key === "__purchased" ? "Purchased" : categoryName(key), items: list }));
  }, [visible, sort]);

  const pending = items.filter((i) => !i.purchased);
  const est = estimate(pending);
  const purchasedCount = items.length - pending.length;
  const categoriesInList = GROCERY_CATEGORIES.filter((c) => items.some((i) => i.category === c.id));

  const share = async () => {
    const text = shoppingListText(items, categoryName);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Saman list", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast("Shopping list copied to clipboard");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Couldn't share the list", { tone: "error" });
    }
  };

  const download = () => {
    const blob = new Blob([shoppingListText(items, categoryName)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saman-list-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = (id: string) => {
    const removed = removeGroceryItem(id);
    if (removed) toast(`Removed ${removed.name}`, { tone: "info", action: { label: "Undo", onClick: () => restoreGroceryItem(removed) } });
  };

  return (
    <Panel className="flex flex-col p-4 sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]" aria-labelledby="list-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="list-title" className="flex items-center gap-2 text-base font-semibold">
          <ListChecks className="size-5 text-emerald" aria-hidden /> My list
        </h2>
        <span className="text-xs text-ink-2">
          {hydrated ? `${pending.length} to buy · ${purchasedCount} bought` : " "}
        </span>
      </div>

      {hydrated && items.length > 0 && (
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your list" aria-label="Search your list" className="h-9" />
          <Select aria-label="Sort list" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="h-9 w-[150px] text-xs">
            <option value="category">Group by category</option>
            <option value="custom">Custom order</option>
          </Select>
          {categoriesInList.length > 1 && (
            <ChipRow
              className="col-span-2"
              label="Filter list by category"
              value={cat}
              onChange={setCat}
              options={[
                { value: "all" as CatFilter, label: "All", count: items.length },
                ...categoriesInList.map((c) => ({ value: c.id as CatFilter, label: c.name, count: items.filter((i) => i.category === c.id).length })),
              ]}
            />
          )}
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pe-1">
        {!hydrated ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-5" />}
            title="Your list is empty"
            description="Tap + on any catalog item, or add something custom."
            action={
              <Button variant="primary" size="sm" onClick={() => openAddItem()}>
                <Plus className="size-4" /> Add Item
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={<Search className="size-5" />} title="No items match" description="Try a different search or category." />
        ) : (
          groups.map((g) => (
            <section key={g.key} aria-label={g.label || "Items"} className="mb-3">
              {g.label && <h3 className="mb-1.5 mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{g.label}</h3>}
              <ul className="space-y-1.5">
                {g.items.map((item) => (
                  <ListRow
                    key={item.id}
                    item={item}
                    canReorder={sort === "custom" && !item.purchased}
                    onMove={(dir) => moveItem(item.id, dir, visible.filter((i) => !i.purchased).map((i) => i.id))}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {hydrated && items.length > 0 && (
        <div className="mt-3 space-y-3 border-t border-white/8 pt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-ink-2">Estimated total (to buy)</p>
              <p className="text-[11px] text-ink-3">
                {est.priced} priced{est.unpriced ? ` · ${est.unpriced} without price (not counted)` : ""}
                {est.sample ? " · includes sample estimates" : ""}
              </p>
            </div>
            <p className="text-xl font-semibold text-ink">{est.priced ? formatPKR(est.total) : "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={share}>
              <Share2 className="size-4" /> Share
            </Button>
            <Button size="sm" variant="secondary" onClick={download}>
              <Download className="size-4" /> Export .txt
            </Button>
            <Button size="sm" variant="ghost" onClick={clearPurchased} disabled={!purchasedCount}>
              Clear bought
            </Button>
            <Button size="sm" variant="danger" className="ms-auto" onClick={() => setConfirmClear(true)}>
              <Trash2 className="size-4" /> Clear list
            </Button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          toast("Shopping list cleared", { tone: "info" });
        }}
        title="Clear the whole list?"
        description={`This removes all ${items.length} items from your Saman list on this device. This can't be undone.`}
        confirmLabel="Clear list"
      />
    </Panel>
  );
}

function ListRow({
  item,
  canReorder,
  onMove,
  onRemove,
}: {
  item: ShoppingItem;
  canReorder: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const total = lineTotal(item);
  const step = ["kg", "litre", "pao", "dozen"].includes(item.unit) ? 0.5 : 1;
  const setQty = (q: number) => updateGroceryItem(item.id, { quantity: Math.max(step, Math.round(q * 100) / 100) });
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.03] p-2 transition-opacity",
        item.purchased && "opacity-55",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.purchased}
        aria-label={`Mark ${item.name} as ${item.purchased ? "not purchased" : "purchased"}`}
        onClick={() => togglePurchased(item.id)}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
          item.purchased ? "border-emerald bg-emerald text-[#06231a]" : "border-white/25 hover:border-emerald",
        )}
      >
        {item.purchased && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <span className="size-10 shrink-0 overflow-hidden rounded-lg">
        <ProductThumb productId={item.productId} category={item.category} name={item.name} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm text-ink", item.purchased && "line-through")}>{item.name}</p>
        <p className="truncate text-[11px] text-ink-3">
          {total != null ? (
            <>
              {formatPKR(total)}
              {item.priceIsSample && <span className="text-gold/80"> est.</span>}
            </>
          ) : (
            "No price"
          )}
          {item.notes ? ` · ${item.notes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-0.5" aria-label={`Quantity ${formatQty(item.quantity, item.unit)}`}>
        <IconButton label={`Decrease ${item.name}`} size="sm" className="size-7" onClick={() => setQty(item.quantity - step)} disabled={item.quantity <= step}>
          <Minus className="size-3.5" />
        </IconButton>
        <span className="min-w-[52px] text-center text-xs tabular-nums text-ink">{formatQty(item.quantity, item.unit)}</span>
        <IconButton label={`Increase ${item.name}`} size="sm" className="size-7" onClick={() => setQty(item.quantity + step)}>
          <Plus className="size-3.5" />
        </IconButton>
      </div>
      {canReorder && (
        <div className="flex flex-col">
          <button type="button" aria-label={`Move ${item.name} up`} className="rounded p-0.5 text-ink-3 hover:text-ink" onClick={() => onMove(-1)}>
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" aria-label={`Move ${item.name} down`} className="rounded p-0.5 text-ink-3 hover:text-ink" onClick={() => onMove(1)}>
            <ArrowDown className="size-3.5" />
          </button>
        </div>
      )}
      <IconButton label={`Remove ${item.name}`} size="sm" className="size-7 hover:!text-coral" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </IconButton>
    </li>
  );
}
