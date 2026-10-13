import { fetchJson, jsonError } from "@/lib/api/http";

export const revalidate = 1800;

interface AirResponse {
  current: { time: string; us_aqi: number; pm2_5: number; pm10: number };
  hourly: { time: string[]; us_aqi: (number | null)[] };
}

/** Air quality (US AQI, PM2.5, PM10) from Open-Meteo's CAMS-based model. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return jsonError("Valid lat/lon required", 400);
  try {
    const d = await fetchJson<AirResponse>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2&timezone=auto`,
      { revalidate: 1800 },
    );
    const start = Math.max(0, d.hourly.time.findIndex((t) => t >= d.current.time.slice(0, 13)));
    return Response.json({
      aqi: Math.round(d.current.us_aqi),
      pm25: d.current.pm2_5,
      pm10: d.current.pm10,
      observedAt: d.current.time,
      next24: d.hourly.time.slice(start, start + 24).map((t, i) => ({ time: t, aqi: d.hourly.us_aqi[start + i] })),
      provider: "Open-Meteo Air Quality (CAMS model estimate, CC BY 4.0)",
    });
  } catch (err) {
    return jsonError(`Air quality unavailable: ${(err as Error).message}`);
  }
}
