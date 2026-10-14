import { dailyVerseRef } from "@/features/dashboard/daily";
import { nearestSpiCity } from "@/data/spi-cities";
import { nowHHMM, todayKey, zonedParts } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import type { FxResponse } from "@/lib/server/fx";
import { useCached } from "./cached";

/* Shapes returned by the Nisbat API. */
export interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind?: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
  observedAt: string;
  sunrise: string;
  sunset: string;
  hourly: { time: string; temperature: number; code: number; isDay: boolean; precipitation: number }[];
  daily: { date: string; high: number; low: number; code: number }[];
}
export interface Air {
  aqi: number;
  pm25: number;
  pm10: number;
  observedAt: string;
  next24: { time: string; aqi: number | null }[];
}
export type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
export interface Prayer {
  timings: Record<PrayerKey, string>;
  hijri: string;
  method: string;
}
export interface Verse {
  surah: number;
  ayah: number;
  surahName: string;
  arabic?: string;
  translation: string;
  translationName?: string;
}
export interface PbsPrices {
  week: string;
  prevWeek: string | null;
  cityName: string;
  source: string;
  items: { no: number; name: string; unit: string; min: number | null; avg: number | null; max: number | null; prevAvg: number | null }[];
}

const MIN = 60_000;

export function useSettings() {
  return usePersisted(settingsStore);
}

export function useWeather(hours = 12) {
  const { location, showWeather } = useSettings();
  return useCached<Weather>(showWeather && location ? `/api/weather?lat=${location.latitude}&lon=${location.longitude}&hours=${hours}` : null, 10 * MIN, 15 * MIN);
}

export function useAir() {
  const { location } = useSettings();
  return useCached<Air>(location ? `/api/air?lat=${location.latitude}&lon=${location.longitude}` : null, 20 * MIN, 30 * MIN);
}

export function usePrayer() {
  const { location, showPrayer, prayerMethod, asrSchool, timezone } = useSettings();
  const date = todayKey(timezone);
  return useCached<Prayer>(
    showPrayer && location
      ? `/api/prayer?lat=${location.latitude}&lon=${location.longitude}&method=${prayerMethod}&school=${asrSchool}&date=${date}&tz=${encodeURIComponent(timezone)}`
      : null,
    6 * 60 * MIN,
  );
}

export function useVerse() {
  const { timezone, quranTranslation } = useSettings();
  const ref = dailyVerseRef(todayKey(timezone));
  const tr = quranTranslation.startsWith("en.") ? quranTranslation : "en.sahih";
  return useCached<Verse>(`/api/quran/ayah?ref=${ref}&translation=${tr}`, 12 * 60 * MIN);
}

export function useFx() {
  return useCached<FxResponse>("/api/fx", 30 * MIN, 60 * MIN);
}

export function usePbs(city?: string) {
  const { priceCity, location } = useSettings();
  const c = city ?? (priceCity !== "auto" ? priceCity : nearestSpiCity(location));
  return useCached<PbsPrices>(`/api/prices?city=${c}`, 6 * 60 * MIN);
}

export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const satisfies readonly PrayerKey[];

/** The next prayer and minutes until it (wraps to tomorrow's Fajr). */
export function nextPrayer(p: Prayer | undefined, tz: string, now = new Date()) {
  if (!p) return null;
  const cur = nowHHMM(tz);
  const name = PRAYERS.find((k) => p.timings[k].slice(0, 5) > cur) ?? "Fajr";
  const at = p.timings[name].slice(0, 5);
  const [h, m] = at.split(":").map(Number);
  const { hour, minute } = zonedParts(now, tz);
  let mins = h * 60 + m - (hour * 60 + minute);
  if (mins < 0) mins += 24 * 60;
  return { name, at, mins, inText: mins >= 60 ? `in ${Math.floor(mins / 60)}h ${mins % 60}m` : `in ${mins} min` };
}

export function clock(now: Date, tz: string) {
  const { hour, minute } = zonedParts(now, tz);
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return { time: `${h}:${String(minute).padStart(2, "0")}`, ampm: hour < 12 ? "AM" : "PM" };
}
