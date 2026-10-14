import { useState } from "react";
import { NATIONAL, SPI_CITIES } from "@/data/spi-cities";
import { formatPKR } from "@/features/groceries/actions";
import { Card, Field, Page, Problem, Skeleton, Source, cx, inputCls } from "../components/ui";
import { useFx, usePbs } from "../lib/data";

const pct = (now: number | null, prev: number | null) => (now && prev ? ((now - prev) / prev) * 100 : null);

function Change({ v }: { v: number | null }) {
  if (v == null) return null;
  if (Math.abs(v) < 0.5) return <span className="text-ink-3">same</span>;
  return <span className={v > 0 ? "text-coral" : "text-emerald"}>{`${v > 0 ? "▲" : "▼"}${Math.abs(v).toFixed(1)}%`}</span>;
}

export function BazaarScreen() {
  const fx = useFx();
  const [amount, setAmount] = useState("100");
  const [code, setCode] = useState("SAR");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const pbs = usePbs(city || undefined);
  const cur = fx.data?.currencies.find((c) => c.code === code);
  const rate = code === "USD" && fx.data?.usdDaily ? fx.data.usdDaily.value : (cur?.reference ?? cur?.officialMonthly?.value ?? null);
  const qty = Number(amount);
  const rows = (pbs.data?.items ?? []).filter((i) => !q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Page title="Bazaar" ur="بازار" back>
      <Card title="Convert to rupees">
        <div className="grid grid-cols-[1fr_6.5rem] gap-2">
          <input className={inputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 12))} aria-label="Amount" />
          <select className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} aria-label="Currency">
            {(fx.data?.currencies ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums" aria-live="polite">
          {rate && qty > 0 ? formatPKR(qty * rate) : "—"}
        </p>
        <p className="text-xs text-ink-3">{rate ? `Rs ${rate.toFixed(2)} per ${code} · ${code === "USD" && fx.data?.usdDaily ? "SBP rate" : "reference rate"}` : ""}</p>
      </Card>
      {!fx.data ? (
        <Skeleton className="mt-3 h-40" />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {fx.data.currencies.slice(0, 6).map((c) => {
            const v = c.code === "USD" && fx.data!.usdDaily ? fx.data!.usdDaily.value : (c.reference ?? c.officialMonthly?.value);
            return (
              <button key={c.code} type="button" className={cx("glass press p-3 text-start", c.code === code && "!border-emerald/50")} onClick={() => setCode(c.code)}>
                <p className="flex justify-between text-sm">
                  <span className="font-semibold">{c.code}</span>
                  <span lang="ur" className="font-urdu text-xs text-ink-3">
                    {c.nameUr}
                  </span>
                </p>
                <p className="text-xl font-semibold tabular-nums">{v ? `Rs ${v.toFixed(2)}` : "—"}</p>
                {c.officialMonthly && (
                  <p className="text-[11px] text-ink-3">
                    SBP avg {c.officialMonthly.value.toFixed(1)} <Change v={pct(c.officialMonthly.value, c.officialMonthly.prev)} />
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      <Source>
        {fx.data?.official.status === "ok" ? "Official SBP rates via PakDataHub. " : ""}Reference rates are open mid-market data, not the State Bank&apos;s rate. Banks and exchange companies quote their own.
      </Source>

      <Card className="mt-4" title={pbs.data ? `Essentials · ${pbs.data.cityName}` : "Essentials"}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="City">
            <select className={inputCls} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">My city</option>
              {SPI_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value={NATIONAL.slug}>{NATIONAL.name}</option>
            </select>
          </Field>
          <Field label="Search">
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Atta, sugar…" />
          </Field>
        </div>
        {pbs.error && !pbs.data ? (
          <div className="mt-3">
            <Problem title="PBS prices couldn't be loaded" text={pbs.error} onRetry={pbs.reload} />
          </div>
        ) : !pbs.data ? (
          <Skeleton className="mt-3 h-64" />
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {rows.map((it) => (
              <li key={it.no} className="flex items-center gap-2 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{it.name}</span>
                  <span className="block text-[11px] text-ink-3">
                    {it.unit}
                    {it.min != null && it.max != null && it.min !== it.max ? ` · ${Math.round(it.min)}–${Math.round(it.max)}` : ""}
                  </span>
                </span>
                <span className="text-end">
                  <span className="block text-sm font-semibold tabular-nums">{it.avg != null ? `Rs ${it.avg.toLocaleString("en-PK", { maximumFractionDigits: it.avg < 100 ? 2 : 0 })}` : "n/a"}</span>
                  <span className="block text-[11px]">
                    <Change v={pct(it.avg, it.prevAvg)} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {pbs.data && <Source>Pakistan Bureau of Statistics weekly SPI, week ending {pbs.data.week}. Average retail prices; shops vary.</Source>}
      </Card>
    </Page>
  );
}
