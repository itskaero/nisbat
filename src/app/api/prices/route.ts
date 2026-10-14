import { jsonError } from "@/lib/api/http";
import { SPI_CITY_SLUGS, spiCityName } from "@/data/spi-cities";
import { getSpi } from "@/lib/server/spi";

export const dynamic = "force-dynamic";

/** PBS weekly SPI retail prices for one city (or "national"), with last week's average for comparison. */
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city") ?? "national";
  if (!SPI_CITY_SLUGS.has(city)) return jsonError("Unknown SPI city", 400);
  try {
    const { current, previous, stale } = await getSpi();
    const now = current.prices[city] ?? {};
    const prev = previous?.prices[city] ?? {};
    return Response.json(
      {
        week: current.week,
        prevWeek: previous?.week ?? null,
        city,
        cityName: spiCityName(city),
        source: "Pakistan Bureau of Statistics — Sensitive Price Indicator (weekly)",
        sourceUrl: current.postUrl,
        fileUrl: current.fileUrl,
        stale,
        items: current.items.map((it) => {
          const [min, avg, max] = now[it.no] ?? [null, null, null];
          return { ...it, min, avg, max, prevAvg: prev[it.no]?.[1] ?? null };
        }),
      },
      { headers: { "Cache-Control": "private, max-age=600" } },
    );
  } catch (err) {
    return jsonError(`PBS prices are unavailable: ${(err as Error).message}`);
  }
}
