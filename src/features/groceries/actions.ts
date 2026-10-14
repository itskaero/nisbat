"use client";

import { uid } from "@/lib/storage/persisted-store";
import { groceryStore, logActivity } from "@/lib/storage/stores";
import type { GroceryCategoryId, GroceryUnit, PriceSource, ShoppingItem } from "@/types/groceries";

export interface NewItemInput {
  productId?: string;
  name: string;
  category: GroceryCategoryId;
  quantity: number;
  unit: GroceryUnit;
  unitPrice?: number;
  priceIsSample?: boolean;
  priceSource?: PriceSource;
  priceNote?: string;
  notes?: string;
}

export function findDuplicate(items: ShoppingItem[], input: Pick<NewItemInput, "name" | "productId" | "unit">) {
  const name = input.name.trim().toLowerCase();
  return items.find(
    (i) =>
      !i.purchased &&
      i.unit === input.unit &&
      ((input.productId && i.productId === input.productId) || i.name.trim().toLowerCase() === name),
  );
}

export function addGroceryItem(input: NewItemInput): ShoppingItem {
  const now = new Date().toISOString();
  const item: ShoppingItem = {
    id: uid("g"),
    ...input,
    name: input.name.trim(),
    notes: input.notes?.trim() || undefined,
    purchased: false,
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
  };
  groceryStore.set((prev) => [...prev, item]);
  logActivity("grocery-added", `Added ${item.name} to Saman`, "/saman");
  return item;
}

/** Merge a new entry into an existing one by adding quantities. */
export function mergeGroceryItem(existingId: string, input: NewItemInput) {
  groceryStore.set((prev) =>
    prev.map((i) =>
      i.id === existingId
        ? {
            ...i,
            quantity: Math.round((i.quantity + input.quantity) * 1000) / 1000,
            unitPrice: input.unitPrice ?? i.unitPrice,
            priceIsSample: input.unitPrice != null ? input.priceIsSample : i.priceIsSample,
            priceSource: input.unitPrice != null ? input.priceSource : i.priceSource,
            priceNote: input.unitPrice != null ? input.priceNote : i.priceNote,
            notes: [i.notes, input.notes?.trim()].filter(Boolean).join(" · ") || undefined,
            updatedAt: new Date().toISOString(),
          }
        : i,
    ),
  );
  logActivity("grocery-added", `Updated ${input.name} quantity in Saman`, "/saman");
}

export function updateGroceryItem(id: string, patch: Partial<ShoppingItem>) {
  groceryStore.set((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)));
}

export function togglePurchased(id: string) {
  const item = groceryStore.get().find((i) => i.id === id);
  if (!item) return;
  updateGroceryItem(id, { purchased: !item.purchased });
  if (!item.purchased) logActivity("grocery-purchased", `Bought ${item.name}`, "/saman");
}

export function removeGroceryItem(id: string): ShoppingItem | undefined {
  const item = groceryStore.get().find((i) => i.id === id);
  groceryStore.set((prev) => prev.filter((i) => i.id !== id));
  return item;
}

export function restoreGroceryItem(item: ShoppingItem) {
  groceryStore.set((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
}

export function clearPurchased() {
  groceryStore.set((prev) => prev.filter((i) => !i.purchased));
}

export function clearAll() {
  groceryStore.set([]);
}

export function moveItem(id: string, direction: -1 | 1, visibleIds: string[]) {
  const idx = visibleIds.indexOf(id);
  const swapId = visibleIds[idx + direction];
  if (idx < 0 || !swapId) return;
  groceryStore.set((prev) => {
    const a = prev.find((i) => i.id === id);
    const b = prev.find((i) => i.id === swapId);
    if (!a || !b) return prev;
    return prev.map((i) => (i.id === a.id ? { ...i, order: b.order } : i.id === b.id ? { ...i, order: a.order } : i));
  });
}

export function lineTotal(item: ShoppingItem): number | undefined {
  if (item.unitPrice == null || !Number.isFinite(item.unitPrice)) return undefined;
  return item.unitPrice * item.quantity;
}

export const priceSourceOf = (i: Pick<ShoppingItem, "priceSource" | "priceIsSample">): PriceSource =>
  i.priceSource ?? (i.priceIsSample ? "sample" : "user");

export function estimate(items: ShoppingItem[]) {
  let total = 0;
  let priced = 0;
  const by: Record<PriceSource, number> = { pbs: 0, sample: 0, user: 0 };
  for (const i of items) {
    const t = lineTotal(i);
    if (t == null) continue;
    total += t;
    priced++;
    by[priceSourceOf(i)]++;
  }
  return { total, priced, unpriced: items.length - priced, sample: by.sample > 0, by };
}

/** "5 at PBS prices · 2 sample · 1 your own" */
export function estimateBreakdown(by: Record<PriceSource, number>) {
  return [by.pbs && `${by.pbs} at PBS prices`, by.sample && `${by.sample} sample`, by.user && `${by.user} your own`].filter(Boolean).join(" · ");
}

export const formatPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n).replace("PKR", "Rs");

export function formatQty(q: number, unit: string) {
  const n = Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${n} ${unit}`;
}

export function shoppingListText(items: ShoppingItem[], categoryName: (id: string) => string): string {
  const groups = new Map<string, ShoppingItem[]>();
  for (const i of items) {
    const k = categoryName(i.category);
    groups.set(k, [...(groups.get(k) ?? []), i]);
  }
  const lines = ["🛒 Saman list — Nisbat Home", ""];
  for (const [cat, list] of groups) {
    lines.push(`*${cat}*`);
    for (const i of list) lines.push(`${i.purchased ? "☑" : "☐"} ${i.name} — ${formatQty(i.quantity, i.unit)}${i.notes ? ` (${i.notes})` : ""}`);
    lines.push("");
  }
  const est = estimate(items.filter((i) => !i.purchased));
  if (est.priced) lines.push(`Estimated: ${formatPKR(est.total)}${est.unpriced ? ` (+${est.unpriced} unpriced)` : ""}${est.sample ? " — includes sample estimates" : ""}`);
  return lines.join("\n").trim();
}
