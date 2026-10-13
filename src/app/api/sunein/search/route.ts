import { fetchJson, jsonError } from "@/lib/api/http";

export const revalidate = 86400;

interface ITunes {
  results: { collectionName: string; artistName?: string; feedUrl?: string; artworkUrl100?: string; trackCount?: number; releaseDate?: string }[];
}

/** Podcast discovery via the public iTunes Search API (Pakistan storefront). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 60) return Response.json({ results: [] });
  try {
    const d = await fetchJson<ITunes>(`https://itunes.apple.com/search?media=podcast&country=pk&limit=25&term=${encodeURIComponent(q)}`, { revalidate: 86400 });
    return Response.json({
      results: d.results
        .filter((r) => r.feedUrl?.startsWith("https://"))
        .map((r) => ({ title: r.collectionName, author: r.artistName, feedUrl: r.feedUrl!, artwork: r.artworkUrl100, episodes: r.trackCount, latest: r.releaseDate })),
    });
  } catch (err) {
    return jsonError(`Podcast search unavailable: ${(err as Error).message}`);
  }
}
