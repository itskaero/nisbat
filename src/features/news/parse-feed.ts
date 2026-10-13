import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "@/types/domain";
import type { FeedSource, NewsCategoryId } from "./sources";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: false,
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
});

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", ndash: "–", mdash: "—" };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITY[n.toLowerCase()] ?? m);
}

export function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|figure|blockquote)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep excerpts short: we link to publishers rather than republish articles. */
export function excerpt(text: string, maxWords = 48): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ").replace(/[,;:.\-–—]+$/, "") + "…";
}

function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  return "";
}

function arr<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

/** RFC-822 dates, including feeds that use two-digit years ("01 Oct 26"). */
export function parseFeedDate(raw: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim();
  s = s.replace(/^(\w{3},\s+\d{1,2}\s+\w{3}\s+)(\d{2})(\s)/, (_, a, y, b) => `${a}20${y}${b}`);
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

function hashId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function findImage(item: Record<string, unknown>, html: string): string | undefined {
  const candidates: unknown[] = [
    ...arr(item["media:content"] as unknown),
    ...arr(item["media:thumbnail"] as unknown),
    ...arr(item["enclosure"] as unknown),
  ];
  for (const c of candidates) {
    if (c && typeof c === "object") {
      const o = c as Record<string, string>;
      const url = o["@_url"];
      const type = o["@_type"] ?? "";
      if (url && (!type || type.startsWith("image"))) return upgradeImage(url);
    }
  }
  // Some feeds (e.g. The Express Tribune) put an <img> element inside <image>.
  const imageEl = item["image"] as Record<string, unknown> | string | undefined;
  if (imageEl && typeof imageEl === "object") {
    const img = imageEl["img"] as Record<string, string> | undefined;
    if (img?.["@_src"]) return upgradeImage(img["@_src"]);
  }
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? upgradeImage(decodeEntities(m[1])) : undefined;
}

/** BBC serves 240px thumbnails in RSS; its image service supports larger widths. */
function upgradeImage(url: string): string {
  if (!/^https:\/\//.test(url)) return url.replace(/^http:\/\//, "https://");
  return url.replace(/(ichef\.bbci\.co\.uk\/ace\/standard\/)240\//, "$1800/");
}

const MAX_AGE_MS = 10 * 24 * 60 * 60 * 1000;

export function parseFeed(xml: string, source: FeedSource): NewsArticle[] {
  const doc = parser.parse(xml);
  const items = arr(doc?.rss?.channel?.item) as Record<string, unknown>[];
  const out: NewsArticle[] = [];
  for (const item of items) {
    const title = stripHtml(text(item.title));
    const link = text(item.link).trim();
    if (!title || !/^https?:\/\//.test(link)) continue;

    const creator = stripHtml(text(item["dc:creator"]));
    if (/sponsored/i.test(creator)) continue; // skip paid placements

    const descHtml = text(item.description);
    const contentHtml = text(item["content:encoded"]);
    const body = stripHtml(descHtml || contentHtml);

    const itemCats = arr(item.category).map((c) => stripHtml(text(c)));
    let categories: NewsCategoryId[] = source.categories;
    if (source.itemCategoryMap) {
      const mapped = new Set<NewsCategoryId>(["top"]);
      for (const c of itemCats) for (const m of source.itemCategoryMap[c] ?? []) mapped.add(m);
      categories = [...mapped];
    }

    const publishedAt = parseFeedDate(text(item.pubDate));
    // Skip stale items (some section feeds keep months-old evergreen/advertorial posts).
    if (publishedAt && Date.now() - Date.parse(publishedAt) > MAX_AGE_MS) continue;

    const url = link.replace(/[?&]traffic_source=rss$/, "").replace(/[?&]at_medium=RSS&at_campaign=rss$/, "");
    for (const category of categories) {
      out.push({
        id: hashId(url),
        title,
        excerpt: excerpt(body),
        url,
        imageUrl: findImage(item, descHtml + contentHtml),
        source: source.publisher,
        sourceId: source.id,
        publishedAt,
        category,
        lang: source.lang,
      });
    }
  }
  return out;
}
