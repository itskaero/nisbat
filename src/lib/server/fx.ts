import "server-only";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchJson } from "@/lib/api/http";
import { dataDir, ensureDir } from "./data-dir";

/**
 * PKR exchange rates from two clearly separated sources:
 *  - official: State Bank of Pakistan series via the PakDataHub API, only when
 *    PAKDATAHUB_API_KEY is set on the server (free plan: 500 calls a month,
 *    so responses are cached in memory and on disk and refreshed sparingly);
 *  - reference: the open fawazahmed0 currency-api (CC0), a daily mid-market
 *    rate that is NOT the SBP rate and is labelled as such.
 */

export const FX_CURRENCIES = [
  { code: "USD", name: "US dollar", nameUr: "ڈالر", official: true },
  { code: "SAR", name: "Saudi riyal", nameUr: "ریال", official: true },
  { code: "AED", name: "UAE dirham", nameUr: "درہم", official: true },
  { code: "GBP", name: "British pound", nameUr: "پاؤنڈ", official: true },
  { code: "EUR", name: "Euro", nameUr: "یورو", official: true },
  { code: "QAR", name: "Qatari riyal", nameUr: "قطری ریال", official: false },
  { code: "KWD", name: "Kuwaiti dinar", nameUr: "کویتی دینار", official: false },
  { code: "OMR", name: "Omani rial", nameUr: "عمانی ریال", official: false },
  { code: "CAD", name: "Canadian dollar", nameUr: "کینیڈین ڈالر", official: false },
  { code: "AUD", name: "Australian dollar", nameUr: "آسٹریلین ڈالر", official: false },
] as const;

interface Point {
  date: string;
  value: number;
}
interface OfficialCache {
  daily?: { at: number; point: Point | null };
  monthly?: { at: number; series: Record<string, Point[]> };
}

const API = "https://api.pakdatahub.com/v1";
const DAILY_TTL = 12 * 3600_000;
// Monthly averages change once a month; a few checks a week is plenty.
const MONTHLY_TTL = 3 * 24 * 3600_000;
const cacheFile = () => dataDir("fx-official.json");

let cache: OfficialCache | null = null;
let officialError: string | null = null;
let blockedUntil = 0;
let inflight: Promise<void> | null = null;

async function loadCache(): Promise<OfficialCache> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(cacheFile(), "utf8")) as OfficialCache;
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache() {
  const dir = await ensureDir(path.dirname(cacheFile()));
  const tmp = path.join(dir, `.fx-official.${process.pid}.tmp`);
  await writeFile(tmp, JSON.stringify(cache));
  await rename(tmp, cacheFile());
}

class PdhError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function pdh<T>(pathAndQuery: string, key: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(`${API}${pathAndQuery}`, { headers: { "X-API-Key": key, Accept: "application/json" }, cache: "no-store", signal: ctrl.signal });
    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    if (!res.ok) throw new PdhError(body.error?.message ?? `PakDataHub responded ${res.status}`, res.status);
    return body as T;
  } catch (err) {
    if (err instanceof PdhError) throw err;
    throw new PdhError((err as Error).name === "AbortError" ? "PakDataHub timed out" : "PakDataHub unreachable", 0);
  } finally {
    clearTimeout(t);
  }
}

type SeriesResponse = { data: { date: string; value: number | null }[] };
const points = (r: SeriesResponse): Point[] =>
  r.data.filter((d): d is Point => typeof d.value === "number" && d.value > 0).map((d) => ({ date: d.date, value: d.value }));

async function refreshOfficial(key: string) {
  const c = await loadCache();
  const now = Date.now();
  if (now < blockedUntil) return;
  let changed = false;
  try {
    if (!c.daily || now - c.daily.at > DAILY_TTL) {
      const r = await pdh<SeriesResponse>("/series/fx.rate.m2m.usd/latest", key);
      c.daily = { at: now, point: points(r)[0] ?? null };
      changed = true;
    }
    if (!c.monthly || now - c.monthly.at > MONTHLY_TTL) {
      const series: Record<string, Point[]> = {};
      for (const cur of FX_CURRENCIES.filter((x) => x.official)) {
        const r = await pdh<SeriesResponse>(`/series/fx.rate.avg.${cur.code.toLowerCase()}?limit=2&sort=desc`, key);
        series[cur.code] = points(r);
      }
      c.monthly = { at: now, series };
      changed = true;
    }
    officialError = null;
  } catch (err) {
    const e = err as PdhError;
    officialError =
      e.status === 401
        ? "The PakDataHub API key was not accepted."
        : e.status === 402
          ? "This month's free PakDataHub calls are used up; official rates resume on the 1st."
          : e.status === 429
            ? "PakDataHub asked us to slow down; trying again shortly."
            : e.message;
    // Don't keep spending calls on a key that fails.
    blockedUntil = now + (e.status === 401 || e.status === 402 ? 6 * 3600_000 : 15 * 60_000);
  }
  if (changed) await saveCache().catch(() => undefined);
}

export async function getFx() {
  const key = process.env.PAKDATAHUB_API_KEY?.trim();
  if (key) {
    inflight ??= refreshOfficial(key).finally(() => (inflight = null));
    await inflight;
  }
  const official = key ? await loadCache() : null;

  let reference: { date: string; rates: Record<string, number> } | null = null;
  let referenceError: string | null = null;
  for (const url of [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json",
    "https://latest.currency-api.pages.dev/v1/currencies/pkr.json",
  ]) {
    try {
      const r = await fetchJson<{ date: string; pkr: Record<string, number> }>(url, { revalidate: 3 * 3600, timeoutMs: 10_000 });
      const rates: Record<string, number> = {};
      for (const c of FX_CURRENCIES) {
        const perPkr = r.pkr[c.code.toLowerCase()];
        if (perPkr > 0) rates[c.code] = 1 / perPkr;
      }
      reference = { date: r.date, rates };
      break;
    } catch (err) {
      referenceError = (err as Error).message;
    }
  }

  return {
    currencies: FX_CURRENCIES.map((c) => {
      const m = official?.monthly?.series[c.code];
      return {
        code: c.code,
        name: c.name,
        nameUr: c.nameUr,
        reference: reference?.rates[c.code] ?? null,
        officialMonthly: m?.[0] ? { value: m[0].value, month: m[0].date, prev: m[1]?.value ?? null } : null,
      };
    }),
    usdDaily: official?.daily?.point ?? null,
    official: {
      status: !key ? ("no-key" as const) : officialError ? ("error" as const) : ("ok" as const),
      message: officialError,
      source: "State Bank of Pakistan, via PakDataHub",
    },
    reference: reference
      ? { date: reference.date, source: "fawazahmed0/exchange-api (open data, CC0)" }
      : { date: null, source: "fawazahmed0/exchange-api (open data, CC0)", error: referenceError },
  };
}

export type FxResponse = Awaited<ReturnType<typeof getFx>>;
