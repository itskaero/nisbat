"use client";

import { ArrowLeftRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Panel, Skeleton, SourceNote } from "@/components/ui/primitives";
import { ThisWeekPrices } from "@/features/prices/price-ui";
import { useFx } from "./bazaar-page";

/** Home row: key exchange rates next to this week's PBS prices. */
export function BazaarHome() {
  return (
    <section aria-label="Bazaar" className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <FxCard />
      <ThisWeekPrices compact />
    </section>
  );
}

function FxCard() {
  const { data, error } = useFx();
  if (error) return null;
  const pick = ["USD", "SAR", "AED", "GBP"].map((c) => data?.currencies.find((x) => x.code === c)).filter((c) => !!c);
  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="fx-home-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="fx-home-title" className="flex items-center gap-2 text-sm font-semibold">
          <ArrowLeftRight className="size-4 text-cyan" aria-hidden /> Exchange rates
        </h2>
        <Link href="/bazaar" className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink">
          Converter <ArrowRight className="size-3" />
        </Link>
      </div>
      {!data ? (
        <Skeleton className="mt-3 h-24" />
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {pick.map((c) => {
            const v = c.code === "USD" && data.usdDaily ? data.usdDaily.value : (c.reference ?? c.officialMonthly?.value);
            return (
              <li key={c.code} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <p className="text-[11px] text-ink-3">
                  1 {c.code} <span className="font-urdu" lang="ur">{c.nameUr}</span>
                </p>
                <p className="text-sm font-semibold tabular-nums text-ink">{v ? `Rs ${v.toFixed(2)}` : "—"}</p>
              </li>
            );
          })}
        </ul>
      )}
      {data && (
        <SourceNote className="mt-3">
          {data.usdDaily ? "USD: SBP M2M rate. Others: daily" : "Daily"} reference rates (open data), not the State Bank&apos;s rate. Banks and
          exchange companies quote their own.
        </SourceNote>
      )}
    </Panel>
  );
}
