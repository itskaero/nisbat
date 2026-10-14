import { Check } from "lucide-react";
import { categoryName } from "@/data/grocery-catalog";
import { estimate, estimateBreakdown, formatPKR, formatQty, togglePurchased } from "@/features/groceries/actions";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore } from "@/lib/storage/stores";
import type { ShoppingItem } from "@/types/groceries";
import { Card, ScreenHeader, Source, cx } from "../components/ui";

/** The family's shopping list; OK ticks an item off (synced to every phone). */
export function SamanScreen() {
  const items = usePersisted(groceryStore);
  const pending = items.filter((i) => !i.purchased).sort((a, b) => a.order - b.order);
  const bought = items.filter((i) => i.purchased);
  const est = estimate(pending);
  const groups = new Map<string, ShoppingItem[]>();
  for (const i of pending) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);

  return (
    <>
      <ScreenHeader
        title="Saman"
        ur="سامان"
        sub={`${pending.length} to buy${bought.length ? ` · ${bought.length} bought` : ""}`}
        right={
          est.priced > 0 && (
            <div class="text-end">
              <p class="text-3xl font-semibold tabular-nums">{formatPKR(est.total)}</p>
              <p class="text-base text-ink-3">{estimateBreakdown(est.by)}</p>
            </div>
          )
        }
      />
      {pending.length === 0 ? (
        <Card>
          <p class="text-2xl">The list is empty.</p>
          <p class="mt-1 text-lg text-ink-2">Add items from the phone app or the website; they appear here straight away.</p>
        </Card>
      ) : (
        <div class="columns-2 gap-6">
          {[...groups.entries()].map(([cat, list], gi) => (
            <Card key={cat} title={categoryName(cat)} class="mb-6 break-inside-avoid">
              <ul class="space-y-2">
                {list.map((it, i) => (
                  <li key={it.id}>
                    <Row item={it} autofocus={gi === 0 && i === 0} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {bought.length > 0 && (
        <Card title="Bought" class="mt-2">
          <ul class="grid grid-cols-2 gap-2">
            {bought.slice(0, 12).map((it) => (
              <li key={it.id}>
                <Row item={it} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Source>Prices: PBS weekly averages where available, otherwise sample or your own. OK marks an item bought or not bought.</Source>
    </>
  );
}

function Row({ item, autofocus }: { item: ShoppingItem; autofocus?: boolean }) {
  return (
    <button
      type="button"
      data-autofocus={autofocus ? "" : undefined}
      class={cx("flex w-full items-center gap-4 rounded-2xl bg-white/[0.04] px-4 py-3 text-start", item.purchased && "opacity-60")}
      onClick={() => togglePurchased(item.id)}
    >
      <span class={cx("grid size-8 shrink-0 place-items-center rounded-full border-2", item.purchased ? "border-emerald bg-emerald text-[#06231a]" : "border-white/30")}>
        {item.purchased && <Check size={18} strokeWidth={3} />}
      </span>
      <span class={cx("min-w-0 flex-1 truncate text-xl", item.purchased && "line-through")}>{item.name}</span>
      <span class="text-lg tabular-nums text-ink-2">{formatQty(item.quantity, item.unit)}</span>
    </button>
  );
}
