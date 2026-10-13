/**
 * News feed registry for Ajj ka Haal.
 *
 * Every feed here is a public RSS feed advertised by its publisher. We store
 * only headline, a short excerpt, image URL, timestamp and the original link,
 * and always send readers to the publisher for the full article.
 *
 * Feed availability was checked on 2026-10-13. "Islamic & Community" is not
 * offered because no suitable publisher feed was verified yet — add one here
 * (with category "islamic") to enable that tab.
 */

export const NEWS_CATEGORIES = [
  { id: "top", label: "Top News" },
  { id: "pakistan", label: "Pakistan" },
  { id: "world", label: "World" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health" },
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "urdu", label: "اردو" },
] as const;

export type NewsCategoryId = (typeof NEWS_CATEGORIES)[number]["id"];

export interface FeedSource {
  id: string;
  publisher: string;
  url: string;
  homepage: string;
  lang: "en" | "ur";
  /** Categories this feed contributes to. */
  categories: NewsCategoryId[];
  /**
   * Optional per-item category filter, for aggregate feeds that tag items
   * (Sixty.pk tags each story with a section).
   */
  itemCategoryMap?: Record<string, NewsCategoryId[]>;
}

const SIXTY_MAP: Record<string, NewsCategoryId[]> = {
  Pakistan: ["pakistan"],
  "Crime & Justice": ["pakistan"],
  Politics: ["politics", "pakistan"],
  Economy: ["business"],
  Finance: ["business"],
  Business: ["business"],
  International: ["world"],
  World: ["world"],
  Health: ["health"],
  "Science & Technology": ["technology"],
  Technology: ["technology"],
  Sports: ["sports"],
};

export const FEED_SOURCES: FeedSource[] = [
  {
    id: "sixty-en",
    publisher: "Sixty",
    url: "https://sixty.pk/rss.xml",
    homepage: "https://sixty.pk/",
    lang: "en",
    categories: ["top", "pakistan", "politics", "business", "world", "health", "technology", "sports"],
    itemCategoryMap: SIXTY_MAP,
  },
  {
    id: "sixty-ur",
    publisher: "Sixty (اردو)",
    url: "https://sixty.pk/ur/rss.xml",
    homepage: "https://sixty.pk/ur",
    lang: "ur",
    categories: ["urdu"],
  },
  { id: "dawn-home", publisher: "Dawn", url: "https://www.dawn.com/feeds/home", homepage: "https://www.dawn.com/", lang: "en", categories: ["top"] },
  { id: "dawn-pakistan", publisher: "Dawn", url: "https://www.dawn.com/feeds/pakistan", homepage: "https://www.dawn.com/pakistan", lang: "en", categories: ["pakistan"] },
  { id: "dawn-business", publisher: "Dawn", url: "https://www.dawn.com/feeds/business", homepage: "https://www.dawn.com/business", lang: "en", categories: ["business"] },
  { id: "dawn-world", publisher: "Dawn", url: "https://www.dawn.com/feeds/world", homepage: "https://www.dawn.com/world", lang: "en", categories: ["world"] },
  { id: "dawn-sport", publisher: "Dawn", url: "https://www.dawn.com/feeds/sport", homepage: "https://www.dawn.com/sport", lang: "en", categories: ["sports"] },
  { id: "dawn-tech", publisher: "Dawn", url: "https://www.dawn.com/feeds/tech", homepage: "https://www.dawn.com/tech", lang: "en", categories: ["technology"] },
  { id: "tribune-pakistan", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/pakistan", homepage: "https://tribune.com.pk/pakistan", lang: "en", categories: ["pakistan"] },
  { id: "tribune-politics", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/politics", homepage: "https://tribune.com.pk/politics", lang: "en", categories: ["politics"] },
  { id: "tribune-business", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/business", homepage: "https://tribune.com.pk/business", lang: "en", categories: ["business"] },
  { id: "tribune-health", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/health", homepage: "https://tribune.com.pk/health", lang: "en", categories: ["health"] },
  { id: "tribune-technology", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/technology", homepage: "https://tribune.com.pk/technology", lang: "en", categories: ["technology"] },
  { id: "tribune-sports", publisher: "The Express Tribune", url: "https://tribune.com.pk/feed/sports", homepage: "https://tribune.com.pk/sports", lang: "en", categories: ["sports"] },
  { id: "aljazeera", publisher: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", homepage: "https://www.aljazeera.com/", lang: "en", categories: ["world"] },
  { id: "bbc-urdu", publisher: "BBC Urdu", url: "https://feeds.bbci.co.uk/urdu/rss.xml", homepage: "https://www.bbc.com/urdu", lang: "ur", categories: ["urdu"] },
];

export function isNewsCategory(v: string | null | undefined): v is NewsCategoryId {
  return NEWS_CATEGORIES.some((c) => c.id === v);
}
