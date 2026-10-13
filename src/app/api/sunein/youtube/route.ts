import { XMLParser } from "fast-xml-parser";
import { fetchUpstream, jsonError } from "@/lib/api/http";
import type { Video } from "@/features/sunein/sources";

export const revalidate = 1800;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

/** Latest videos from a YouTube channel's public RSS feed. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("channel") ?? "";
  if (!/^UC[A-Za-z0-9_-]{22}$/.test(id)) return jsonError("Invalid channel id", 400);
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
    // YouTube's feed endpoint intermittently answers 404/5xx; retry once.
    const res = await fetchUpstream(url, { revalidate: 1800 }).catch(async () => {
      await new Promise((r) => setTimeout(r, 1200));
      return fetchUpstream(url, { revalidate: 1800 });
    });
    const doc = parser.parse(await res.text());
    const entries = [doc?.feed?.entry ?? []].flat() as Record<string, unknown>[];
    const videos: Video[] = entries.slice(0, 15).map((e) => {
      const vid = String(e["yt:videoId"]);
      return { id: vid, title: String(e.title ?? ""), publishedAt: String(e.published ?? ""), thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` };
    });
    return Response.json({ title: String(doc?.feed?.title ?? ""), videos });
  } catch (err) {
    return jsonError(`YouTube channel unavailable: ${(err as Error).message}`);
  }
}
