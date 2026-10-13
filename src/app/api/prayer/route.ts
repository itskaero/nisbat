import { fetchJson, jsonError } from "@/lib/api/http";
import { PRAYER_METHODS } from "@/features/dashboard/prayer-methods";

export const revalidate = 3600;

interface AlAdhan {
  data: {
    timings: Record<string, string>;
    date: { readable: string; hijri: { day: string; month: { en: string; ar: string }; year: string } };
    meta: { timezone: string; method: { id: number; name: string }; school: string };
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const method = Number(searchParams.get("method") ?? 1);
  const school = Number(searchParams.get("school") ?? 1);
  const date = searchParams.get("date") ?? ""; // YYYY-MM-DD in the user's zone
  const tz = searchParams.get("tz") ?? "Asia/Karachi";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return jsonError("Valid lat/lon required", 400);
  if (!(method in PRAYER_METHODS)) return jsonError("Unsupported method", 400);
  if (school !== 0 && school !== 1) return jsonError("school must be 0 or 1", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("date must be YYYY-MM-DD", 400);
  if (!/^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$|^UTC$/.test(tz)) return jsonError("Invalid time zone", 400);

  const [y, m, d] = date.split("-");
  const url =
    `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&method=${method}&school=${school}&timezonestring=${encodeURIComponent(tz)}`;
  try {
    const res = await fetchJson<AlAdhan>(url, { revalidate: 3600 });
    const t = res.data.timings;
    return Response.json({
      date,
      timings: { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha },
      hijri: `${res.data.date.hijri.day} ${res.data.date.hijri.month.en} ${res.data.date.hijri.year} AH`,
      method: res.data.meta.method.name,
      school: res.data.meta.school,
      timezone: res.data.meta.timezone,
      provider: "AlAdhan API (aladhan.com)",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonError(`Prayer time service unavailable: ${(err as Error).message}`);
  }
}
