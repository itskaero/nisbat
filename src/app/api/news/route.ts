import { fetchUpstream } from "@/lib/api/http";
import { parseFeed } from "@/features/news/parse-feed";
import { FEED_SOURCES, isNewsCategory } from "@/features/news/sources";
import type { NewsArticle, NewsResponse } from "@/types/domain";

export const revalidate = 600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "top";
  if (!isNewsCategory(category)) {
    return Response.json({ error: "Unknown category" }, { status: 400 });
  }

  const feeds = FEED_SOURCES.filter((s) => s.categories.includes(category));
  const results = await Promise.all(
    feeds.map(async (source) => {
      try {
        const res = await fetchUpstream(source.url, { revalidate: 600, accept: "application/rss+xml, application/xml, text/xml" });
        const xml = await res.text();
        const items = parseFeed(xml, source).filter((i) => i.category === category);
        return { source, items, ok: true as const };
      } catch (err) {
        return { source, items: [] as NewsArticle[], ok: false as const, error: (err as Error).message };
      }
    }),
  );

  const seen = new Set<string>();
  const dated: NewsArticle[] = [];
  const undated: NewsArticle[] = [];
  for (const r of results) {
    for (const item of r.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      (item.publishedAt ? dated : undated).push(item);
    }
  }
  dated.sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!));

  const body: NewsResponse = {
    category,
    items: [...dated, ...undated].slice(0, 80),
    sources: results.map((r) => ({
      id: r.source.id,
      publisher: r.source.publisher,
      homepage: r.source.homepage,
      ok: r.ok,
      count: r.items.length,
      ...(r.ok ? {} : { error: r.error }),
    })),
    fetchedAt: new Date().toISOString(),
  };
  return Response.json(body);
}
