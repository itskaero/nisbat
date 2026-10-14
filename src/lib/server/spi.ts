import "server-only";
import { readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import readXlsxFile from "read-excel-file/node";
import { dataDir, ensureDir } from "./data-dir";
import { publicHttpsUrl, readCapped, readCappedBytes } from "./safe-url";

/**
 * Weekly Sensitive Price Indicator (SPI) retail prices from the Pakistan
 * Bureau of Statistics. Each Friday PBS publishes "Annex_DD.MM.YYYY.xlsx",
 * whose sheet Appendix-A lists 51 essential items with MIN/AVG/MAX prices in
 * 17 cities plus the national average. We read that file as published and
 * keep the parsed weeks under <data>/spi so the app works when PBS is down.
 */

export interface SpiItem {
  no: number;
  name: string;
  unit: string;
}
/** [min, avg, max]; null where PBS reported no price. */
export type SpiPrice = [number | null, number | null, number | null];
export interface SpiWeek {
  /** Week-ending date, YYYY-MM-DD (a Thursday). */
  week: string;
  postUrl: string;
  fileUrl: string;
  fetchedAt: string;
  items: SpiItem[];
  prices: Record<string, Record<number, SpiPrice>>;
}

const PBS_HOST = "www.pbs.gov.pk";
const SEARCH = `https://${PBS_HOST}/wp-json/wp/v2/posts?search=sensitive%20price%20indicator&per_page=10&orderby=date&order=desc&_fields=link,content`;
const SLUG = /weekly-sensitive-price-indicator-spi-for-the-week-ended-on-(\d{2})-(\d{2})-(\d{4})/;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
const KEEP_WEEKS = 8;
const UA = "NisbatHome/0.1 (+personal dashboard; reads published PBS SPI releases)";

const spiDir = () => dataDir("spi");

function pbsUrl(raw: string): URL {
  const u = publicHttpsUrl(raw);
  if (!u || u.hostname !== PBS_HOST) throw new Error("Unexpected PBS link");
  return u;
}

async function get(url: URL, timeoutMs = 20_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA }, cache: "no-store" });
    if (!res.ok) throw new Error(`PBS responded ${res.status}`);
    return res;
  } catch (err) {
    throw new Error((err as Error).name === "AbortError" ? "PBS timed out" : (err as Error).message || "PBS unreachable");
  } finally {
    clearTimeout(t);
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null);

const citySlug = (header: string) =>
  /^national av/i.test(header)
    ? "national"
    : header
        .replace(/\(\d+\)/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]+/g, "-");

/** Parse sheet Appendix-A of a PBS SPI annex. */
export function parseAppendixA(rows: unknown[][]): Pick<SpiWeek, "week" | "items" | "prices"> {
  let week = "";
  let cols: { slug: string; col: number }[] = [];
  const items = new Map<number, SpiItem>();
  const prices: SpiWeek["prices"] = {};
  for (const r of rows) {
    if (r[0] === "SL.") {
      cols = [];
      for (let c = 3; c < r.length; c++) {
        const h = r[c];
        if (typeof h !== "string") continue;
        // "National Ave." / "% Change over" / "Yearly…" after the national block are not cities.
        if (/\(\d+\)$/.test(h.trim()) || /^national average$/i.test(h.trim())) cols.push({ slug: citySlug(h), col: c });
      }
      continue;
    }
    const label = r[3];
    if (typeof label === "string") {
      const m = /PRICES ON (\d{2})-(\d{2})-(\d{4})/i.exec(label);
      if (m) week = `${m[3]}-${m[2]}-${m[1]}`;
      continue;
    }
    if (typeof r[0] !== "number" || typeof r[1] !== "string" || !cols.length) continue;
    const no = r[0];
    if (!items.has(no)) items.set(no, { no, name: r[1].trim(), unit: String(r[2] ?? "").trim() });
    for (const { slug, col } of cols) {
      (prices[slug] ??= {})[no] = [num(r[col]), num(r[col + 1]), num(r[col + 2])];
    }
  }
  if (!week || items.size < 40 || Object.keys(prices).length < 17) throw new Error("PBS SPI sheet layout was not recognised");
  return { week, items: [...items.values()].sort((a, b) => a.no - b.no), prices };
}

async function readWeek(week: string): Promise<SpiWeek | null> {
  try {
    return JSON.parse(await readFile(path.join(spiDir(), `${week}.json`), "utf8")) as SpiWeek;
  } catch {
    return null;
  }
}

async function storedWeeks(): Promise<string[]> {
  try {
    return (await readdir(spiDir()))
      .map((f) => /^(\d{4}-\d{2}-\d{2})\.json$/.exec(f)?.[1])
      .filter((w): w is string => !!w)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function download(postUrl: string, fileUrl: string): Promise<SpiWeek> {
  const res = await get(pbsUrl(fileUrl));
  const buf = await readCappedBytes(res, 5_000_000);
  const sheets = await readXlsxFile(buf);
  const sheet = sheets.find((s) => /appendix-?a/i.test(s.sheet)) ?? sheets[0];
  const parsed = parseAppendixA(sheet.data as unknown[][]);
  const week: SpiWeek = { ...parsed, postUrl, fileUrl, fetchedAt: new Date().toISOString() };
  const dir = await ensureDir(spiDir());
  const tmp = path.join(dir, `.${week.week}.${process.pid}.tmp`);
  await writeFile(tmp, JSON.stringify(week));
  await rename(tmp, path.join(dir, `${week.week}.json`));
  return week;
}

/** Find the two newest releases, downloading any we don't have yet. */
async function refresh(): Promise<void> {
  const res = await get(new URL(SEARCH));
  const posts = JSON.parse(await readCapped(res, 3_000_000)) as { link: string; content?: { rendered?: string } }[];
  const releases = posts
    .map((p) => {
      const m = SLUG.exec(p.link ?? "");
      const file = /https:\/\/www\.pbs\.gov\.pk\/[^"'\s]*Annex_[\d.]+\.xlsx/i.exec(p.content?.rendered ?? "")?.[0];
      return m && file ? { week: `${m[3]}-${m[2]}-${m[1]}`, postUrl: p.link, fileUrl: file } : null;
    })
    .filter((r): r is { week: string; postUrl: string; fileUrl: string } => !!r)
    .sort((a, b) => b.week.localeCompare(a.week))
    .slice(0, 2);
  if (!releases.length) throw new Error("No SPI release found on pbs.gov.pk");
  const have = new Set(await storedWeeks());
  for (const r of releases) if (!have.has(r.week)) await download(r.postUrl, r.fileUrl);
  const all = await storedWeeks();
  await Promise.all(all.slice(KEEP_WEEKS).map((w) => rm(path.join(spiDir(), `${w}.json`), { force: true })));
}

let lastCheck = 0;
let lastError: string | null = null;
let inflight: Promise<void> | null = null;

/** Latest week and the one before it. Serves stored weeks if PBS can't be reached. */
export async function getSpi(): Promise<{ current: SpiWeek; previous: SpiWeek | null; stale: string | null }> {
  if (Date.now() - lastCheck > CHECK_EVERY_MS) {
    inflight ??= refresh()
      .then(() => {
        lastError = null;
        lastCheck = Date.now();
      })
      .catch((err: Error) => {
        lastError = err.message;
        // Retry sooner after a failure, but not on every request.
        lastCheck = Date.now() - CHECK_EVERY_MS + 15 * 60 * 1000;
      })
      .finally(() => (inflight = null));
    await inflight;
  }
  const [w1, w2] = await storedWeeks();
  const current = w1 ? await readWeek(w1) : null;
  if (!current) throw new Error(lastError ?? "No SPI data yet");
  return { current, previous: w2 ? await readWeek(w2) : null, stale: lastError };
}
