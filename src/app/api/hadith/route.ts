import { fetchJson, jsonError } from "@/lib/api/http";
import { DAILY_HADITH } from "@/features/azkar/sources";

export const revalidate = 604800;

interface Edition {
  metadata: { name: string };
  hadiths: { hadithnumber: number; text: string; reference?: { book: number; hadith: number } }[];
}

/** Hadith of the day (English + Urdu) for a YYYY-MM-DD date key. */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("date must be YYYY-MM-DD", 400);
  const [y, m, d] = date.split("-").map(Number);
  const n = DAILY_HADITH[Math.floor(Date.UTC(y, m - 1, d) / 86_400_000) % DAILY_HADITH.length];
  const base = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
  try {
    const [en, ur] = await Promise.all([
      fetchJson<Edition>(`${base}/eng-bukhari/${n}.json`, { revalidate: 604800 }),
      fetchJson<Edition>(`${base}/urd-bukhari/${n}.json`, { revalidate: 604800 }).catch(() => null),
    ]);
    return Response.json({
      collection: en.metadata.name,
      number: n,
      english: en.hadiths[0]?.text ?? "",
      urdu: ur?.hadiths[0]?.text ?? null,
      reference: en.hadiths[0]?.reference ?? null,
      source: "fawazahmed0/hadith-api (public domain)",
      link: `https://sunnah.com/bukhari:${n}`,
    });
  } catch (err) {
    return jsonError(`Hadith unavailable: ${(err as Error).message}`);
  }
}
