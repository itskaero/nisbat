import { XMLParser } from "fast-xml-parser";
import { fetchUpstream, jsonError } from "@/lib/api/http";
import { publicHttpsUrl, readCapped } from "@/lib/server/safe-url";
import { decodeEntities, excerpt, parseFeedDate, stripHtml } from "@/features/news/parse-feed";
import type { Episode, PodcastFeed } from "@/features/sunein/sources";

export const revalidate = 3600;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: true, htmlEntities: true });
const arr = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const txt = (v: unknown): string => (v == null ? "" : typeof v === "object" ? String((v as Record<string, unknown>)["#text"] ?? "") : String(v));

function duration(v: unknown): number | undefined {
  const s = txt(v).trim();
  if (!s) return undefined;
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** Parses a podcast RSS feed into shows + episodes (only HTTPS audio is playable). */
export async function GET(req: Request) {
  const url = publicHttpsUrl(new URL(req.url).searchParams.get("url"));
  if (!url) return jsonError("Podcast feeds must be public https:// links", 400);
  try {
    const res = await fetchUpstream(url.toString(), { revalidate: 3600, timeoutMs: 15000, accept: "application/rss+xml, application/xml, text/xml" });
    const doc = parser.parse(await readCapped(res));
    const ch = doc?.rss?.channel;
    if (!ch) return jsonError("That link isn't a podcast RSS feed", 422);
    const image = ch["itunes:image"]?.["@_href"] ?? txt(ch.image?.url);
    const episodes: Episode[] = arr(ch.item as Record<string, unknown>[])
      .slice(0, 60)
      .map((it, i) => {
        const enc = arr(it.enclosure as Record<string, string>[]).find((e) => (e["@_type"] ?? "audio").startsWith("audio") || /\.(mp3|m4a|aac)(\?|$)/i.test(e["@_url"] ?? ""));
        let audio = enc?.["@_url"] ?? null;
        if (audio?.startsWith("http://")) audio = null; // browsers block insecure audio on secure pages
        return {
          id: txt(it.guid) || audio || `${i}`,
          title: stripHtml(txt(it.title)) || "Untitled episode",
          audioUrl: audio,
          publishedAt: parseFeedDate(txt(it.pubDate)),
          durationSec: duration(it["itunes:duration"]),
          image: (it["itunes:image"] as Record<string, string> | undefined)?.["@_href"],
          description: excerpt(stripHtml(txt(it.description) || txt(it["itunes:summary"])), 40),
        };
      });
    const body: PodcastFeed = {
      title: decodeEntities(stripHtml(txt(ch.title))) || url.hostname,
      author: stripHtml(txt(ch["itunes:author"])) || undefined,
      image: image || undefined,
      episodes,
    };
    return Response.json(body);
  } catch (err) {
    return jsonError(`Couldn't load this podcast: ${(err as Error).message}`);
  }
}
