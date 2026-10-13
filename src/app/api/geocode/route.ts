import { fetchJson, jsonError } from "@/lib/api/http";

export const revalidate = 86400;

interface GeoResult {
  results?: { name: string; admin1?: string; country: string; latitude: number; longitude: number; timezone?: string }[];
}

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 60) return Response.json({ results: [] });
  try {
    const d = await fetchJson<GeoResult>(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
      { revalidate: 86400 },
    );
    return Response.json({
      results: (d.results ?? []).map((r) => ({
        name: r.name,
        admin: r.admin1,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude,
        timezone: r.timezone,
      })),
    });
  } catch (err) {
    return jsonError(`Location search unavailable: ${(err as Error).message}`);
  }
}
