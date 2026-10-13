import { fetchUpstream, jsonError } from "@/lib/api/http";
import { AZKAR_CHAPTERS } from "@/features/azkar/sources";

export const revalidate = 604800;

interface Raw {
  ID: number;
  ARABIC_TEXT: string;
  LANGUAGE_ARABIC_TRANSLATED_TEXT: string;
  TRANSLATED_TEXT: string;
  REPEAT: number;
  AUDIO?: string;
}

/** One Hisn al-Muslim chapter (Arabic, transliteration, English, repeat count, audio). */
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("chapter") ?? 27);
  const chapter = AZKAR_CHAPTERS.find((c) => c.id === id);
  if (!chapter) return jsonError("Unknown chapter", 400);
  try {
    const res = await fetchUpstream(`https://www.hisnmuslim.com/api/en/${id}.json`, { revalidate: 604800 });
    const text = (await res.text()).replace(/^﻿/, "");
    const data = JSON.parse(text) as Record<string, Raw[]>;
    const items = Object.values(data)[0] ?? [];
    return Response.json({
      chapter,
      items: items.map((x) => ({
        id: x.ID,
        arabic: x.ARABIC_TEXT.trim(),
        transliteration: x.LANGUAGE_ARABIC_TRANSLATED_TEXT?.trim() ?? "",
        translation: x.TRANSLATED_TEXT.trim(),
        repeat: Math.max(1, Number(x.REPEAT) || 1),
        audio: x.AUDIO ? x.AUDIO.replace(/^http:\/\//, "https://") : undefined,
      })),
      source: "Hisn al-Muslim (Fortress of the Muslim), Sa'id ibn Wahf al-Qahtani — via hisnmuslim.com",
    });
  } catch (err) {
    return jsonError(`Adhkar unavailable: ${(err as Error).message}`);
  }
}
