import { fetchJson, jsonError } from "@/lib/api/http";
import { PRAYER_METHODS } from "@/features/dashboard/prayer-methods";

export const revalidate = 21600;

interface Day {
  timings: Record<string, string>;
  date: {
    gregorian: { date: string; weekday: { en: string } };
    hijri: { day: string; month: { number: number; en: string; ar: string }; year: string };
  };
  meta: { method: { name: string } };
}

const NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

/** A month of prayer times + Hijri dates from AlAdhan. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  const method = Number(sp.get("method") ?? 1);
  const school = Number(sp.get("school") ?? 1);
  const year = Number(sp.get("year"));
  const month = Number(sp.get("month"));
  const tz = sp.get("tz") ?? "Asia/Karachi";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return jsonError("Valid lat/lon required", 400);
  if (!(method in PRAYER_METHODS) || (school !== 0 && school !== 1)) return jsonError("Unsupported method", 400);
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) return jsonError("Invalid month", 400);
  if (!/^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$|^UTC$/.test(tz)) return jsonError("Invalid time zone", 400);

  try {
    const res = await fetchJson<{ data: Day[] }>(
      `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&method=${method}&school=${school}&timezonestring=${encodeURIComponent(tz)}`,
      { revalidate: 21600, timeoutMs: 15000 },
    );
    const days = res.data.map((d) => {
      const [dd, mm, yyyy] = d.date.gregorian.date.split("-");
      return {
        date: `${yyyy}-${mm}-${dd}`,
        weekday: d.date.gregorian.weekday.en,
        hijri: { day: Number(d.date.hijri.day), month: d.date.hijri.month.number, monthName: d.date.hijri.month.en, monthAr: d.date.hijri.month.ar, year: Number(d.date.hijri.year) },
        timings: Object.fromEntries(NAMES.map((n) => [n, d.timings[n].slice(0, 5)])),
      };
    });
    return Response.json({ days, method: res.data[0]?.meta.method.name ?? PRAYER_METHODS[method], provider: "AlAdhan API (aladhan.com)" });
  } catch (err) {
    return jsonError(`Prayer calendar unavailable: ${(err as Error).message}`);
  }
}
