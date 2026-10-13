"use client";

import { todayKey } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";

export interface PrayerToday {
  timings: Record<"Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha", string>;
  hijri: string;
  method: string;
}

/** Today's prayer times for the configured location (shared cache with the Home card). */
export function usePrayerToday() {
  const { location, prayerMethod, asrSchool, timezone } = usePersisted(settingsStore);
  const now = useNow();
  const date = now ? todayKey(timezone) : null;
  return useFetch<PrayerToday>(
    location && date
      ? `/api/prayer?lat=${location.latitude}&lon=${location.longitude}&method=${prayerMethod}&school=${asrSchool}&date=${date}&tz=${encodeURIComponent(timezone)}`
      : null,
  );
}

/** Minutes from `nowHHMM` until `hhmm` (wrapping past midnight). */
export function minutesUntil(hhmm: string, now: { hour: number; minute: number }) {
  const [h, m] = hhmm.split(":").map(Number);
  let diff = h * 60 + m - (now.hour * 60 + now.minute);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function formatCountdown(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m} min`;
}
