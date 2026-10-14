import { fetchJson, jsonError } from "@/lib/api/http";
import { isTranslation } from "@/features/quran/editions";

export const revalidate = 86400;

interface ApiAyah {
  text: string;
  numberInSurah: number;
  surah: { number: number; englishName: string };
  edition: { englishName: string };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") ?? "";
  const translation = searchParams.get("translation") ?? "en.sahih";
  if (!/^\d{1,3}:\d{1,3}$/.test(ref)) return jsonError("ref must look like 65:3", 400);
  if (!isTranslation(translation)) return jsonError("Unsupported translation", 400);
  try {
    const data = await fetchJson<{ data: ApiAyah[] }>(
      `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,${translation}`,
      { revalidate: 86400 },
    );
    const [ar, tr] = data.data;
    return Response.json({
      surah: ar.surah.number,
      surahName: ar.surah.englishName,
      ayah: ar.numberInSurah,
      arabic: ar.text.replace(/^﻿/, ""),
      translation: tr.text,
      translationName: tr.edition.englishName,
    });
  } catch (err) {
    return jsonError(`Quran service unavailable: ${(err as Error).message}`);
  }
}
