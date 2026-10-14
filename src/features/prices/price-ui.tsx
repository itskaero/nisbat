"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink, Landmark } from "lucide-react";
import Link from "next/link";
import { Panel, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { SPI_HEADLINE } from "@/data/spi-map";
import { formatPKR } from "@/features/groceries/actions";
import { fmtWeek, pctChange, usePbsPrices, type PbsItem } from "./use-pbs-prices";

/** Week-over-week change: rising prices in coral, falling in green. */
export function PriceChange({ change, className }: { change: number | null; className?: string }) {
  if (change == null) return null;
  const flat = Math.abs(change) < 0.5;
  const Icon = flat ? ArrowRight : change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 tabular-nums", flat ? "text-ink-3" : change > 0 ? "text-coral" : "text-emerald", className)}
      title="Change in the average price since last week"
    >
      <Icon className="size-3.5" aria-hidden />
      {flat ? "same" : `${Math.abs(change).toFixed(change > -10 && change < 10 ? 1 : 0)}%`}
      <span className="sr-only">{flat ? " unchanged from last week" : change > 0 ? " higher than last week" : " lower than last week"}</span>
    </span>
  );
}

/** Short display name for a PBS SPI item ("Wheat Flour Bag" → "Atta (20 kg bag)"). */
const SHORT: Record<number, string> = {
  1: "Atta · 20 kg bag",
  2: "Basmati (broken)",
  7: "Chicken (live)",
  8: "Milk · litre",
  11: "Eggs · dozen",
  13: "Cooking oil · 5 L",
  17: "Masoor daal",
  21: "Potatoes",
  22: "Onions",
  23: "Tomatoes",
  24: "Sugar",
  47: "Petrol · litre",
  49: "LPG · 11.67 kg",
};
export const spiLabel = (it: PbsItem) => SHORT[it.no] ?? it.name;
export function spiUnit(it: PbsItem) {
  if (SHORT[it.no]?.includes("·")) return "";
  const u = it.unit.trim();
  if (/^1 /.test(u)) return `/${u.slice(2).toLowerCase()}`;
  if (/^per /i.test(u)) return `/${u.slice(4).toLowerCase()}`;
  return ` · ${u.toLowerCase()}`;
}

/** Headline essentials for the household's city this week. */
export function ThisWeekPrices({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { data, error } = usePbsPrices();
  if (error) {
    return compact ? null : (
      <Panel className={cn("p-4 text-sm text-ink-2", className)}>Official PBS prices couldn&apos;t be loaded right now ({error}).</Panel>
    );
  }
  const byNo = new Map(data?.items.map((i) => [i.no, i]));
  const rows = SPI_HEADLINE.map((n) => byNo.get(n)).filter((i): i is PbsItem => !!i?.avg).slice(0, compact ? 4 : 12);
  return (
    <Panel className={cn("p-4 sm:p-5", className)} aria-labelledby="pbs-week-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pbs-week-title" className="flex items-center gap-2 text-sm font-semibold">
          <Landmark className="size-4 text-emerald" aria-hidden /> This week&apos;s prices
          {data && <span className="font-normal text-ink-3">· {data.cityName}</span>}
        </h2>
        <Link href="/bazaar" className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink">
          All 51 items <ArrowRight className="size-3" />
        </Link>
      </div>
      {!data ? (
        <Skeleton className="mt-3 h-24" />
      ) : (
        <ul className={cn("mt-3 grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4")}>
          {rows.map((it) => (
            <li key={it.no} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <p className="truncate text-[11px] text-ink-3">{spiLabel(it)}</p>
              <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatPKR(it.avg!)}
                  <span className="text-[11px] font-normal text-ink-3">{spiUnit(it)}</span>
                </span>
                <PriceChange change={pctChange(it.avg, it.prevAvg)} className="text-[11px]" />
              </p>
            </li>
          ))}
        </ul>
      )}
      {data && (
        <SourceNote className="mt-3">
          Average retail prices from the Pakistan Bureau of Statistics&apos; weekly Sensitive Price Indicator, week ending {fmtWeek(data.week)}
          {data.prevWeek ? `, compared with ${fmtWeek(data.prevWeek)}` : ""}.{" "}
          <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-ink-2">
            PBS release <ExternalLink className="size-3" />
          </a>
          {data.stale ? " · couldn't check for a newer week just now" : ""}
        </SourceNote>
      )}
    </Panel>
  );
}
