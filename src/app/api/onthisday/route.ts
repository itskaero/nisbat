import { fetchJson, jsonError } from "@/lib/api/http";

export const revalidate = 86400;

interface Wiki {
  events?: { text: string; year: number; pages?: { title: string; content_urls?: { desktop?: { page?: string } }; thumbnail?: { source: string } }[] }[];
  births?: Wiki["events"];
  deaths?: Wiki["events"];
}

const PAKISTAN = /\b(Pakistan|Pakistani|Lahore|Karachi|Islamabad|Rawalpindi|Peshawar|Quetta|Multan|Sindh|Punjab, Pakistan|Balochistan|Khyber|Jinnah|Iqbal|Gilgit|Azad Kashmir|East Pakistan)\b/;

/** Wikipedia "On this day", filtered to Pakistan-related entries. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const m = Number(sp.get("month"));
  const d = Number(sp.get("day"));
  if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > 31) return jsonError("Invalid date", 400);
  try {
    const data = await fetchJson<Wiki>(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`, { revalidate: 86400, timeoutMs: 15000 });
    const pick = (list: Wiki["events"], kind: string) =>
      (list ?? [])
        .filter((e) => PAKISTAN.test(e.text))
        .map((e) => ({ kind, year: e.year, text: e.text, url: e.pages?.[0]?.content_urls?.desktop?.page, image: e.pages?.[0]?.thumbnail?.source }));
    const items = [...pick(data.events, "event"), ...pick(data.births, "birth"), ...pick(data.deaths, "death")].sort((a, b) => b.year - a.year);
    return Response.json({ items, source: "Wikipedia — On this day (CC BY-SA 4.0)" });
  } catch (err) {
    return jsonError(`On this day is unavailable: ${(err as Error).message}`);
  }
}
