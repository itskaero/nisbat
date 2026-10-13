"use client";

import quranMeta from "@/data/quran-meta.json";
import { dateKey } from "@/lib/dates";
import { uid } from "@/lib/storage/persisted-store";
import { logActivity, quranStore, settingsStore, type QuranState } from "@/lib/storage/stores";
import type { Reflection } from "@/types/domain";

export const SURAHS = quranMeta.surahs;
export const JUZ_STARTS = quranMeta.juzs;
export const TOTAL_AYAHS = quranMeta.totalAyahs;

export const refKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export function surahMeta(n: number) {
  return SURAHS[n - 1];
}

/** Which juz a surah:ayah falls in, from the bundled juz start table. */
export function juzOf(surah: number, ayah: number): number {
  let juz = 1;
  JUZ_STARTS.forEach((start, i) => {
    if (surah > start.surah || (surah === start.surah && ayah >= start.ayah)) juz = i + 1;
  });
  return juz;
}

export function setLastRead(surah: number, ayah: number) {
  quranStore.set((s) =>
    s.lastRead?.surah === surah && s.lastRead.ayah === ayah ? s : { ...s, lastRead: { surah, ayah, at: new Date().toISOString() } },
  );
}

export function isBookmarked(state: QuranState, surah: number, ayah: number) {
  return state.bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
}

export function toggleBookmark(surah: number, ayah: number): boolean {
  const on = !isBookmarked(quranStore.get(), surah, ayah);
  quranStore.set((s) => ({
    ...s,
    bookmarks: on
      ? [{ surah, ayah, createdAt: new Date().toISOString() }, ...s.bookmarks]
      : s.bookmarks.filter((b) => !(b.surah === surah && b.ayah === ayah)),
  }));
  return on;
}

export function markRead(surah: number, ayahs: number[]) {
  const tz = settingsStore.get().timezone;
  const today = dateKey(new Date(), tz);
  quranStore.set((s) => {
    let changed = false;
    const read = { ...s.read };
    for (const a of ayahs) {
      const k = refKey(surah, a);
      if (!read[k]) {
        read[k] = today;
        changed = true;
      }
    }
    return changed ? { ...s, read } : s;
  });
}

export function unmarkRead(surah: number, ayah: number) {
  quranStore.set((s) => {
    const read = { ...s.read };
    delete read[refKey(surah, ayah)];
    return { ...s, read };
  });
}

export function readStats(state: QuranState, tz: string) {
  const today = dateKey(new Date(), tz);
  const values = Object.values(state.read);
  const reflectionsToday = state.reflections.filter((r) => dateKey(new Date(r.createdAt), tz) === today).length;
  return {
    total: values.length,
    today: values.filter((d) => d === today).length,
    reflectionsToday,
    percent: (values.length / TOTAL_AYAHS) * 100,
  };
}

export function surahReadCount(state: QuranState, surah: number) {
  const prefix = `${surah}:`;
  return Object.keys(state.read).filter((k) => k.startsWith(prefix)).length;
}

export function saveReflection(input: Omit<Reflection, "id" | "createdAt" | "updatedAt">, id?: string): Reflection {
  const now = new Date().toISOString();
  let saved!: Reflection;
  quranStore.set((s) => {
    if (id) {
      return {
        ...s,
        reflections: s.reflections.map((r) => (r.id === id ? (saved = { ...r, ...input, updatedAt: now }) : r)),
      };
    }
    saved = { ...input, id: uid("r"), createdAt: now, updatedAt: now };
    return { ...s, reflections: [saved, ...s.reflections] };
  });
  const meta = surahMeta(input.surah);
  logActivity("reflection-saved", `Reflected on ${meta.englishName} ${input.surah}:${input.ayah}`, `/quran?s=${input.surah}&a=${input.ayah}`);
  return saved;
}

export function deleteReflection(id: string): Reflection | undefined {
  const r = quranStore.get().reflections.find((x) => x.id === id);
  quranStore.set((s) => ({ ...s, reflections: s.reflections.filter((x) => x.id !== id) }));
  return r;
}

export function restoreReflection(r: Reflection) {
  quranStore.set((s) => ({ ...s, reflections: [r, ...s.reflections.filter((x) => x.id !== r.id)] }));
}

export function setDailyGoal(n: number) {
  quranStore.set((s) => ({ ...s, dailyGoal: Math.min(100, Math.max(1, Math.round(n))) }));
}
