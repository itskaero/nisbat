import { dailyVerseRef } from "@/features/dashboard/daily";
import { nearestSpiCity } from "@/data/spi-cities";
import { nowHHMM, todayKey, zonedParts } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import type { FxResponse } from "@/lib/server/fx";
import { useCached } from "./cached";

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
}
export type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
export interface Prayer {
  timings: Record<PrayerKey, string>;
  hijri: string;
  method: string;
}
export interface MonthDay {
  date: string;
  weekday: string;
  hijri: { day: number; month: number; monthName: string; year: number };
  timings: Record<string, string>;
}
export interface Verse {
  surah: number;
  ayah: number;
  surahName: string;
  translation: string;
}
export interface PbsPrices {
  week: string;
  prevWeek: string | null;
  cityName: string;
  items: { no: number; name: string; unit: string; min: number | null; avg: number | null; max: number | null; prevAvg: number | null }[];
}

const MIN = 60_000;
export const useSettings = () => usePersisted(settingsStore);

export function useWeather(hours = 12) {
  const { location, showWeather } = useSettings();
  return useCached<Weather>(showWeather && location ? `/api/weather?lat=${location.latitude}&lon=${location.longitude}&hours=${hours}` : null, 10 * MIN);
}
export function useAir() {
  const { location } = useSettings();
  return useCached<Air>(location ? `/api/air?lat=${location.latitude}&lon=${location.longitude}` : null, 20 * MIN);
}
export function usePrayer() {
  const { location, showPrayer, prayerMethod, asrSchool, timezone } = useSettings();
  return useCached<Prayer>(
    showPrayer && location
      ? `/api/prayer?lat=${location.latitude}&lon=${location.longitude}&method=${prayerMethod}&school=${asrSchool}&date=${todayKey(timezone)}&tz=${encodeURIComponent(timezone)}`
      : null,
    6 * 60 * MIN,
  );
}
export function usePrayerMonth(year: number, month: number) {
  const { location, prayerMethod, asrSchool } = useSettings();
  return useCached<{ days: MonthDay[]; method: string }>(
    location ? `/api/prayer/month?lat=${location.latitude}&lon=${location.longitude}&method=${prayerMethod}&school=${asrSchool}&month=${month}&year=${year}` : null,
    24 * 60 * MIN,
  );
}
export function useVerse() {
  const { timezone, quranTranslation } = useSettings();
  const tr = quranTranslation.startsWith("en.") ? quranTranslation : "en.sahih";
  return useCached<Verse>(`/api/quran/ayah?ref=${dailyVerseRef(todayKey(timezone))}&translation=${tr}`, 12 * 60 * MIN);
}
export const useFx = () => useCached<FxResponse>("/api/fx", 30 * MIN);
export function usePbs(city?: string) {
  const { priceCity, location } = useSettings();
  const c = city ?? (priceCity !== "auto" ? priceCity : nearestSpiCity(location));
  return useCached<PbsPrices>(`/api/prices?city=${c}`, 6 * 60 * MIN);
}

export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const satisfies readonly PrayerKey[];

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
