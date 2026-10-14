import { fetchJson, jsonError, UpstreamError } from "@/lib/api/http";
import { isTranslation, type SearchMatch } from "@/features/quran/editions";

export const revalidate = 86400;

interface ApiMatch {
  text: string;
  numberInSurah: number;
  surah: { number: number; englishName: string };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const edition = searchParams.get("edition") ?? "en.sahih";
  if (q.length < 3) return Response.json({ matches: [], count: 0 });
  if (q.length > 60) return jsonError("Query too long", 400);
  if (!isTranslation(edition)) return jsonError("Unsupported translation", 400);

  try {
    const data = await fetchJson<{ data: { count: number; matches: ApiMatch[] } }>(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/${edition}`,
      { revalidate: 86400 },
    );
    const matches: SearchMatch[] = data.data.matches.slice(0, 40).map((m) => ({
      surah: m.surah.number,
      surahName: m.surah.englishName,
      ayah: m.numberInSurah,
      text: m.text,
    }));
    return Response.json({ matches, count: data.data.count });
  } catch (err) {
    // The API answers 404 when a term has no matches.
    if (err instanceof UpstreamError && err.status === 404) return Response.json({ matches: [], count: 0 });
    return jsonError(`Quran search unavailable: ${(err as Error).message}`);
  }
}
