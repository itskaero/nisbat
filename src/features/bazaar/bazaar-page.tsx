"use client";

import { ArrowLeftRight, Banknote, ExternalLink, Landmark, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, EmptyState, Field, Input, Panel, Select, Skeleton, SourceNote, cn } from "@/components/ui/primitives";
import { NATIONAL, SPI_CITIES } from "@/data/spi-cities";
import { formatPKR } from "@/features/groceries/actions";
import { PriceChange } from "@/features/prices/price-ui";
import { fmtWeek, pctChange, usePbsPrices, usePriceCity } from "@/features/prices/use-pbs-prices";
import { useFetch } from "@/lib/hooks";
import type { FxResponse } from "@/lib/server/fx";

const rs = (n: number, digits = 2) => `Rs ${n.toLocaleString("en-PK", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
const fmtMonth = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export function BazaarPage() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div>
        <h1 className="flex flex-wrap items-center gap-x-3 text-2xl font-semibold tracking-tight md:text-3xl">
          <Banknote className="size-7 text-emerald" aria-hidden /> Bazaar{" "}
          <span className="font-urdu text-xl text-ink-2" lang="ur">بازار</span>
        </h1>
        <p className="mt-1 text-sm text-ink-2">Exchange rates for money from abroad, and this week&apos;s official prices of essentials.</p>
      </div>
      <Currencies />
      <Essentials />
    </div>
  );
}

/* Exchange rates ---------------------------------------------------------- */

export function useFx() {
  return useFetch<FxResponse>("/api/fx");
}

function Currencies() {
  const { data, error, reload } = useFx();
  const [amount, setAmount] = useState("100");
  const [code, setCode] = useState("SAR");

  if (error) {
    return (
      <Panel className="p-5">
        <EmptyState tone="error" title="Exchange rates are unavailable right now" description={error} action={<Button size="sm" onClick={reload}><RefreshCw className="size-4" /> Try again</Button>} />
      </Panel>
    );
  }
  const main = data?.currencies.filter((c) => ["USD", "SAR", "AED", "GBP", "EUR"].includes(c.code)) ?? [];
  const more = data?.currencies.filter((c) => !main.includes(c)) ?? [];
  const chosen = data?.currencies.find((c) => c.code === code);
  const officialToday = code === "USD" ? data?.usdDaily?.value : undefined;
  const rate = officialToday ?? chosen?.reference ?? chosen?.officialMonthly?.value ?? null;
  const qty = Number(amount);

  return (
    <section aria-labelledby="fx-title" className="space-y-3">
      <h2 id="fx-title" className="flex items-center gap-2 text-sm font-semibold">
        <ArrowLeftRight className="size-4 text-cyan" aria-hidden /> Exchange rates
        <span className="font-normal text-ink-3">· rupees for one unit</span>
      </h2>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {!data ? (
            <Skeleton className="h-40" />
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
              {main.map((c) => {
                const off = c.officialMonthly;
                const big = c.code === "USD" && data.usdDaily ? data.usdDaily.value : (c.reference ?? off?.value);
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => setCode(c.code)}
                      aria-pressed={code === c.code}
                      className={cn(
                        "glass h-full w-full !rounded-2xl p-4 text-start transition-colors",
                        code === c.code ? "!border-emerald/50" : "hover:!border-white/25",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{c.code}</span>
                        <span className="font-urdu text-sm text-ink-3" lang="ur">{c.nameUr}</span>
                      </span>
                      <span className="mt-1 block text-[11px] text-ink-3">{c.name}</span>
                      <span className="mt-2 block text-2xl font-semibold tabular-nums text-ink">{big ? rs(big) : "—"}</span>
                      <span className="mt-1 block text-[11px] leading-snug text-ink-3">
                        {c.code === "USD" && data.usdDaily ? `SBP M2M rate, ${fmtWeek(data.usdDaily.date)}` : `Reference rate, ${data.reference.date ?? "—"}`}
                      </span>
                      {off && (
                        <span className="mt-2 flex flex-wrap items-center gap-x-1.5 border-t border-white/8 pt-2 text-[11px] text-ink-2">
                          SBP avg {fmtMonth(off.month)}: <span className="tabular-nums">{rs(off.value)}</span>
                          <PriceChange change={pctChange(off.value, off.prev)} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {data && more.length > 0 && (
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
              {more.map((c) => (
                <button key={c.code} type="button" onClick={() => setCode(c.code)} className={cn("tabular-nums hover:text-ink", code === c.code && "text-emerald")}>
                  {c.code} {c.reference ? rs(c.reference) : "—"}
                </button>
              ))}
            </p>
          )}
        </div>

        <Panel className="p-4 sm:p-5 xl:self-start" aria-labelledby="convert-title">
          <h3 id="convert-title" className="text-sm font-semibold">Convert to rupees</h3>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
            <Field label="Amount" htmlFor="fx-amount">
              <Input id="fx-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 12))} />
            </Field>
            <Field label="Currency" htmlFor="fx-code">
              <Select id="fx-code" value={code} onChange={(e) => setCode(e.target.value)}>
                {(data?.currencies ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="mt-4 text-3xl font-semibold tabular-nums text-ink" aria-live="polite">
            {rate && Number.isFinite(qty) && qty > 0 ? formatPKR(qty * rate) : "—"}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            {rate ? `at ${rs(rate)} per ${code} · ${officialToday ? "SBP M2M rate" : "reference rate"}` : ""}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            Banks, exchange companies and remittance services quote their own buying rates, usually a little lower. Check their rate before you
            send or receive money.
          </p>
        </Panel>
      </div>
      {data && (
        <SourceNote>
          {data.official.status === "ok" ? (
            <>
              <Badge tone="emerald" className="me-1">Official</Badge> SBP rates from {data.official.source}.{" "}
            </>
          ) : data.official.status === "no-key" ? (
            <>Official SBP rates appear here once a free PakDataHub API key is added on the Nisbat server (PAKDATAHUB_API_KEY). </>
          ) : (
            <>Official SBP rates are paused: {data.official.message} </>
          )}
          Reference rates are daily mid-market rates from {data.reference.source}. They are <strong>not</strong> the State Bank&apos;s rate.
        </SourceNote>
      )}
    </section>
  );
}

/* Essentials (PBS SPI) ---------------------------------------------------- */

function Essentials() {
  const home = usePriceCity();
  const [city, setCity] = useState<string | null>(null);
  const [compare, setCompare] = useState<string>(NATIONAL.slug);
  const [q, setQ] = useState("");
  const active = city ?? home;
  const main = usePbsPrices(active);
  const other = usePbsPrices(compare);
  const otherByNo = useMemo(() => new Map(other.data?.items.map((i) => [i.no, i])), [other.data]);
  const rows = (main.data?.items ?? []).filter((i) => !q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()));

  const citySelect = (id: string, value: string, onChange: (v: string) => void, label: string) => (
    <Field label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {SPI_CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
        <option value={NATIONAL.slug}>{NATIONAL.name}</option>
      </Select>
    </Field>
  );

  return (
    <Panel className="glass-reading p-4 sm:p-5" aria-labelledby="ess-title">
      <h2 id="ess-title" className="flex items-center gap-2 text-sm font-semibold">
        <Landmark className="size-4 text-emerald" aria-hidden /> Essentials this week
        {main.data && <span className="font-normal text-ink-3">· week ending {fmtWeek(main.data.week)}</span>}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <div className="relative col-span-2 self-end md:col-span-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items…" aria-label="Search essentials" className="ps-10" />
        </div>
        {citySelect("ess-city", active, setCity, "City")}
        {citySelect("ess-compare", compare, setCompare, "Compare with")}
      </div>
      {main.error ? (
        <EmptyState tone="error" title="PBS prices couldn't be loaded" description={main.error} action={<Button size="sm" onClick={main.reload}><RefreshCw className="size-4" /> Try again</Button>} />
      ) : !main.data ? (
        <Skeleton className="mt-4 h-96" />
      ) : (
        <div className="relative mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">
              Average retail prices in {main.data.cityName}, compared with {other.data?.cityName ?? "another city"}
            </caption>
            <thead>
              <tr className="border-b border-white/10 text-start text-[11px] uppercase tracking-wider text-ink-3">
                <th scope="col" className="py-2 pe-3 text-start font-medium">Item</th>
                <th scope="col" className="py-2 pe-3 text-end font-medium">{main.data.cityName}</th>
                <th scope="col" className="py-2 pe-3 text-end font-medium">Range</th>
                <th scope="col" className="py-2 pe-3 text-end font-medium">vs last week</th>
                <th scope="col" className="py-2 text-end font-medium">{other.data?.cityName ?? "…"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => {
                const o = otherByNo.get(it.no);
                return (
                  <tr key={it.no} className="border-b border-white/5 last:border-0">
                    <th scope="row" className="py-2 pe-3 text-start font-normal">
                      <span className="text-ink">{it.name}</span> <span className="text-[11px] text-ink-3">· {it.unit}</span>
                    </th>
                    <td className="py-2 pe-3 text-end font-semibold tabular-nums text-ink">{it.avg != null ? rs(it.avg) : <span className="text-ink-3">n/a</span>}</td>
                    <td className="py-2 pe-3 text-end text-xs tabular-nums text-ink-3">
                      {it.min != null && it.max != null && it.min !== it.max ? `${Math.round(it.min).toLocaleString()}–${Math.round(it.max).toLocaleString()}` : ""}
                    </td>
                    <td className="py-2 pe-3 text-end text-xs">
                      <PriceChange change={pctChange(it.avg, it.prevAvg)} />
                    </td>
                    <td className="py-2 text-end tabular-nums text-ink-2">{o?.avg != null ? rs(o.avg) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {main.data && (
        <SourceNote className="mt-3">
          Pakistan Bureau of Statistics, weekly Sensitive Price Indicator (SPI), Appendix-A: average, lowest and highest retail prices recorded in each
          city. &ldquo;n/a&rdquo; means PBS reported no price there this week.{" "}
          <a href={main.data.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-ink-2">
            PBS release <ExternalLink className="size-3" />
          </a>{" "}
          ·{" "}
          <a href={main.data.fileUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink-2">
            original spreadsheet
          </a>
        </SourceNote>
      )}
    </Panel>
  );
}
