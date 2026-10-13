/**
 * Quran editions offered in Nisbat Home, all served by the AlQuran Cloud API
 * (https://alquran.cloud/api). Arabic text: Tanzil Uthmani (quran-uthmani),
 * distributed under the Tanzil terms (verbatim, with attribution). Audio is
 * served by the Islamic Network CDN that backs AlQuran Cloud.
 *
 * Only identifiers listed here are proxied by our API routes.
 */

export const ARABIC_EDITION = { id: "quran-uthmani", name: "Tanzil Uthmani text" };

export const TRANSLATIONS = [
  { id: "en.sahih", name: "Saheeh International", lang: "en" },
  { id: "en.pickthall", name: "Pickthall", lang: "en" },
  { id: "en.yusufali", name: "Abdullah Yusuf Ali", lang: "en" },
  { id: "en.hilali", name: "Hilali & Muhsin Khan", lang: "en" },
  { id: "en.maududi", name: "Abul Ala Maududi", lang: "en" },
  { id: "ur.jalandhry", name: "Fateh Muhammad Jalandhry (اردو)", lang: "ur" },
  { id: "ur.maududi", name: "Abul A'ala Maududi (اردو)", lang: "ur" },
  { id: "ur.junagarhi", name: "Muhammad Junagarhi (اردو)", lang: "ur" },
  { id: "ur.ahmedali", name: "Ahmed Ali (اردو)", lang: "ur" },
] as const;

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdur-Rahman As-Sudais" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Siddiq Al-Minshawi" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly" },
  { id: "ar.saoodshuraym", name: "Saud Ash-Shuraym" },
  { id: "ar.muhammadayyoub", name: "Muhammad Ayyoub" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
] as const;

export function isTranslation(id: string | null): boolean {
  return !!id && TRANSLATIONS.some((t) => t.id === id);
}

export function isReciter(id: string | null): boolean {
  return !!id && RECITERS.some((r) => r.id === id);
}

export function translationMeta(id: string) {
  return TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];
}

export interface Ayah {
  /** Global ayah number 1..6236. */
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
  audio?: string;
  audioSecondary?: string[];
  juz: number;
  page: number;
  sajda: boolean;
}

export interface SurahPayload {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  /** Shown as a header, separated from ayah 1 for all surahs except 1 and 9. */
  bismillah?: string;
  ayahs: Ayah[];
  editions: { arabic: string; translation: string; translationId: string; reciter: string; reciterId: string };
}

export interface SearchMatch {
  surah: number;
  surahName: string;
  ayah: number;
  text: string;
}
