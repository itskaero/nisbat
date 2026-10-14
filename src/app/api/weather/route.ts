import { fetchJson, jsonError } from "@/lib/api/http";

export const revalidate = 900;

interface OpenMeteo {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; sunrise: string[]; sunset: string[] };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; is_day: number[]; precipitation_probability: number[] };
  timezone: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const hours = Math.min(24, Math.max(1, Number(searchParams.get("hours")) || 8));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return jsonError("Valid lat/lon required", 400);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code,is_day,precipitation_probability` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&forecast_days=7&timezone=auto`;
  try {
    const d = await fetchJson<OpenMeteo>(url, { revalidate: 900 });
    return Response.json({
      temperature: d.current.temperature_2m,
      feelsLike: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      wind: d.current.wind_speed_10m,
      code: d.current.weather_code,
      isDay: d.current.is_day === 1,
      high: d.daily.temperature_2m_max[0],
      low: d.daily.temperature_2m_min[0],
      observedAt: d.current.time,
      sunrise: d.daily.sunrise[0],
      sunset: d.daily.sunset[0],
      // Next 8 hours starting from the current local hour.
      hourly: (() => {
        const start = Math.max(0, d.hourly.time.findIndex((t) => t >= d.current.time.slice(0, 13)));
        return d.hourly.time.slice(start, start + hours).map((t, i) => ({
          time: t,
          temperature: d.hourly.temperature_2m[start + i],
          code: d.hourly.weather_code[start + i],
          isDay: d.hourly.is_day[start + i] === 1,
          precipitation: d.hourly.precipitation_probability[start + i],
        }));
      })(),
      daily: d.daily.time.map((t, i) => ({
        date: t,
        high: d.daily.temperature_2m_max[i],
        low: d.daily.temperature_2m_min[i],
        code: d.daily.weather_code[i],
      })),
      timezone: d.timezone,
      provider: "Open-Meteo (open-meteo.com, CC BY 4.0)",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return jsonError(`Weather service unavailable: ${(err as Error).message}`);
  }
}
