import { fetchJson, jsonError } from "@/lib/api/http";
import { ARABIC_EDITION, isReciter, isTranslation, type Ayah, type SurahPayload } from "@/features/quran/editions";

export const revalidate = 86400;

interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  sajda: boolean | object;
  audio?: string;
  audioSecondary?: string[];
}
interface ApiEdition {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: ApiAyah[];
  edition: { identifier: string; englishName: string };
}

// Compare without diacritics: mark ordering differs between text sources.
const stripMarks = (t: string) => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\u0671/g, "\u0627");
const BISMILLAH_BARE = stripMarks("بسم الله الرحمن الرحيم");

export async function GET(req: Request, ctx: { params: Promise<{ number: string }> }) {
  const { number } = await ctx.params;
  const n = Number(number);
  if (!Number.isInteger(n) || n < 1 || n > 114) return jsonError("Surah must be 1–114", 400);

  const { searchParams } = new URL(req.url);
  const translation = searchParams.get("translation") ?? "en.sahih";
  const reciter = searchParams.get("reciter") ?? "ar.alafasy";
  if (!isTranslation(translation)) return jsonError("Unsupported translation", 400);
  if (!isReciter(reciter)) return jsonError("Unsupported reciter", 400);

  try {
    const data = await fetchJson<{ code: number; data: ApiEdition[] }>(
      `https://api.alquran.cloud/v1/surah/${n}/editions/${ARABIC_EDITION.id},${translation},${reciter}`,
      { revalidate: 86400, timeoutMs: 15000 },
    );
    const [ar, tr, au] = data.data;
    if (!ar || !tr || ar.ayahs.length !== tr.ayahs.length) return jsonError("Unexpected response from Quran API");

    let bismillah: string | undefined;
    const ayahs: Ayah[] = ar.ayahs.map((a, i) => {
      let arabic = a.text.replace(/^﻿/, "");
      if (i === 0 && n !== 1 && n !== 9) {
        const words = arabic.split(" ");
        const head = words.slice(0, 4).join(" ");
        if (stripMarks(head) === BISMILLAH_BARE && words.length > 4) {
          bismillah = head;
          arabic = words.slice(4).join(" ");
        }
      }
      const audio = au?.ayahs[i];
      return {
        number: a.number,
        numberInSurah: a.numberInSurah,
        arabic,
        translation: tr.ayahs[i].text,
        audio: audio?.audio,
        audioSecondary: audio?.audioSecondary,
        juz: a.juz,
        page: a.page,
        sajda: Boolean(a.sajda),
      };
    });

    const body: SurahPayload = {
      number: ar.number,
      name: ar.name,
      englishName: ar.englishName,
      englishNameTranslation: ar.englishNameTranslation,
      revelationType: ar.revelationType,
      numberOfAyahs: ar.numberOfAyahs,
      bismillah,
      ayahs,
      editions: {
        arabic: "Tanzil Uthmani",
        translation: tr.edition.englishName,
        translationId: translation,
        reciter: au?.edition.englishName ?? "",
        reciterId: reciter,
      },
    };
    return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch (err) {
    return jsonError(`Quran service unavailable: ${(err as Error).message}`);
  }
}
