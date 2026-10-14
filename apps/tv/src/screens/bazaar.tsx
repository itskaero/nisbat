import { useState } from "preact/hooks";
import { NATIONAL, SPI_CITIES } from "@/data/spi-cities";
import { SPI_HEADLINE } from "@/data/spi-map";
import { Card, Chips, Problem, ScreenHeader, Skeleton, Source, cx } from "../components/ui";
import { useFx, usePbs } from "../lib/data";

const rs = (n: number) => `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
const pct = (now: number | null, prev: number | null) => (now && prev ? ((now - prev) / prev) * 100 : null);

function Change({ v }: { v: number | null }) {
  if (v == null) return null;
  if (Math.abs(v) < 0.5) return <span class="text-ink-3">same</span>;
  return <span class={v > 0 ? "text-coral" : "text-emerald"}>{`${v > 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(1)}%`}</span>;
}

export function BazaarScreen() {
  const fx = useFx();
  const [city, setCity] = useState<string | undefined>(undefined);
  const pbs = usePbs(city);
  const [all, setAll] = useState(false);
  const headline = new Set(SPI_HEADLINE);
  const rows = (pbs.data?.items ?? []).filter((i) => all || headline.has(i.no));
  const cities = [{ value: "", label: "My city" }, ...SPI_CITIES.slice(0, 9).map((c) => ({ value: c.slug, label: c.name })), { value: NATIONAL.slug, label: "National" }];

  return (
    <>
      <ScreenHeader title="Bazaar" ur="بازار" sub="Exchange rates and this week's official prices of essentials." />
      <Card title="Exchange rates · rupees for one unit" class="mb-6">
        {!fx.data ? (
          <Skeleton class="h-28" />
        ) : (
          <div class="grid grid-cols-5 gap-4">
            {fx.data.currencies.slice(0, 5).map((c, i) => {
              const v = c.code === "USD" && fx.data!.usdDaily ? fx.data!.usdDaily.value : (c.reference ?? c.officialMonthly?.value);
              return (
                <button key={c.code} type="button" data-autofocus={i === 0 ? "" : undefined} class="tile p-5 text-start">
                  <p class="flex items-center justify-between text-lg">
                    <span class="font-semibold">{c.code}</span>
                    <span lang="ur" class="font-urdu text-base text-ink-3">
                      {c.nameUr}
                    </span>
                  </p>
                  <p class="mt-1 whitespace-nowrap text-[1.7rem] font-semibold tabular-nums">{v ? `Rs ${v.toFixed(2)}` : "—"}</p>
                  {c.officialMonthly && (
                    <p class="mt-1 text-sm text-ink-3">
                      SBP avg: Rs {c.officialMonthly.value.toFixed(2)} <Change v={pct(c.officialMonthly.value, c.officialMonthly.prev)} />
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {fx.data && (
          <Source>
            {fx.data.usdDaily ? "USD: State Bank of Pakistan M2M rate via PakDataHub. " : ""}Daily reference rates are open mid-market data, not the State Bank&apos;s rate; banks and exchange
            companies quote their own.
          </Source>
        )}
      </Card>
      <Card
        title={pbs.data ? `Essentials · ${pbs.data.cityName} · week ending ${new Date(`${pbs.data.week}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}` : "Essentials"}
        right={
          <button type="button" class="chip text-base" aria-pressed={all} onClick={() => setAll((a) => !a)}>
            {all ? "Show fewer" : "All 51 items"}
          </button>
        }
      >
        <Chips label="City" value={city ?? ""} onChange={(v) => setCity(v || undefined)} options={cities} />
        {pbs.error && !pbs.data ? (
          <div class="mt-4">
            <Problem title="PBS prices couldn't be loaded" text={pbs.error} onRetry={pbs.reload} />
          </div>
        ) : !pbs.data ? (
          <Skeleton class="mt-4 h-72" />
        ) : (
          <table class="mt-5 w-full text-xl">
            <thead>
              <tr class="text-sm uppercase tracking-wider text-ink-3">
                <th class="pb-2 text-start font-medium">Item</th>
                <th class="pb-2 text-end font-medium">Average</th>
                <th class="pb-2 text-end font-medium">Range</th>
                <th class="pb-2 text-end font-medium">vs last week</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.no} class="border-t border-line">
                  <td class="py-2.5">
                    {it.name} <span class="text-base text-ink-3">· {it.unit}</span>
                  </td>
                  <td class="py-2.5 text-end font-semibold tabular-nums">{it.avg != null ? rs(it.avg) : "n/a"}</td>
                  <td class={cx("py-2.5 text-end text-base tabular-nums text-ink-3")}>
                    {it.min != null && it.max != null && it.min !== it.max ? `${Math.round(it.min)}–${Math.round(it.max)}` : ""}
                  </td>
                  <td class="py-2.5 text-end text-base">
                    <Change v={pct(it.avg, it.prevAvg)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Source>Pakistan Bureau of Statistics, weekly Sensitive Price Indicator: average retail prices in each city. Shops vary.</Source>
      </Card>
    </>
  );
}
