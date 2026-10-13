"use client";

import { useEffect, useRef, useState } from "react";
import { describeWeather, dailyVerseRef } from "@/features/dashboard/widgets";
import { formatHHMM, formatLongDate, nowHHMM, todayKey, zonedParts } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore, tasksStore, tvRemoteStore } from "@/lib/storage/stores";
import { activeMedia } from "@/lib/tv/media-registry";
import { useTvMode } from "@/lib/tv/tv-mode";
import { taskStats } from "@/features/tasks/logic";
import type { NewsResponse } from "@/types/domain";
import { ACTIVITY_EVENT, isAmbientOpen, setAmbientOpen as setAmbient, useAmbientOpen } from "@/lib/tv/ambient-state";

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

/**
 * Ambient screen for TV mode — the Nisbat replacement for the Chromecast
 * backdrop. Appears after a period of inactivity (never over playing media)
 * and disappears on any button press.
 */
export function AmbientScreen() {
  const tv = useTvMode();
  const { ambientMinutes } = usePersisted(settingsStore);
  const open = useAmbientOpen();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!tv || ambientMinutes === 0) {
      setAmbient(false);
      return;
    }
    const arm = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(function check() {
        // Never cover a video or recitation that's playing; check again later.
        if (activeMedia()?.isPlaying() || document.querySelector("dialog[open]")) {
          timer.current = setTimeout(check, 60_000);
          return;
        }
        setAmbient(true);
      }, ambientMinutes * 60_000);
    };
    const onActivity = () => {
      if (isAmbientOpen()) setAmbient(false);
      arm();
    };
    arm();
    window.addEventListener(ACTIVITY_EVENT, onActivity);
    window.addEventListener("pointerdown", onActivity);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener(ACTIVITY_EVENT, onActivity);
      window.removeEventListener("pointerdown", onActivity);
    };
  }, [tv, ambientMinutes]);

  if (!open) return null;
  return <AmbientContent onClose={() => setAmbient(false)} />;
}

function AmbientContent({ onClose }: { onClose: () => void }) {
  const settings = usePersisted(settingsStore);
  const tasks = usePersisted(tasksStore);
  const { code } = usePersisted(tvRemoteStore);
  const now = useNow() ?? new Date();
  const tz = settings.timezone;
  const loc = settings.location;
  const date = todayKey(tz);

  const weather = useFetch<{ temperature: number; code: number; isDay: boolean; high: number; low: number }>(
    loc && settings.showWeather ? `/api/weather?lat=${loc.latitude}&lon=${loc.longitude}` : null,
  );
  const prayer = useFetch<{ timings: Record<string, string>; hijri: string }>(
    loc && settings.showPrayer
      ? `/api/prayer?lat=${loc.latitude}&lon=${loc.longitude}&method=${settings.prayerMethod}&school=${settings.asrSchool}&date=${date}&tz=${encodeURIComponent(tz)}`
      : null,
  );
  const verse = useFetch<{ surah: number; ayah: number; surahName: string; translation: string }>(
    `/api/quran/ayah?ref=${dailyVerseRef(date)}&translation=${settings.quranTranslation.startsWith("en.") ? settings.quranTranslation : "en.sahih"}`,
  );
  const news = useFetch<NewsResponse>("/api/news?category=pakistan");

  // Rotate one headline at a time.
  const [headlineIdx, setHeadlineIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeadlineIdx((i) => i + 1), 15_000);
    return () => clearInterval(t);
  }, []);
  const headlines = news.data?.items.slice(0, 10) ?? [];
  const headline = headlines.length ? headlines[headlineIdx % headlines.length] : undefined;

  const parts = zonedParts(now, tz);
  const hh = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const time = `${hh}:${String(parts.minute).padStart(2, "0")}`;
  // Slow drift to protect TVs from burn-in.
  const drift = { x: ((parts.minute % 6) - 3) * 6, y: ((Math.floor(parts.minute / 6) % 5) - 2) * 6 };

  let nextPrayer: { name: string; at: string; inText: string } | undefined;
  if (prayer.data) {
    const cur = nowHHMM(tz);
    const name = PRAYERS.find((p) => prayer.data!.timings[p].slice(0, 5) > cur) ?? "Fajr";
    const at = prayer.data.timings[name].slice(0, 5);
    const [ah, am] = at.split(":").map(Number);
    let mins = ah * 60 + am - (parts.hour * 60 + parts.minute);
    if (mins < 0) mins += 24 * 60;
    nextPrayer = { name, at, inText: mins >= 60 ? `in ${Math.floor(mins / 60)}h ${mins % 60}m` : `in ${mins} min` };
  }
  const w = weather.data ? describeWeather(weather.data.code, weather.data.isDay) : undefined;
  const WIcon = w?.icon;
  const stats = taskStats(tasks, tz);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ambient screen. Press any button to return."
      className="fixed inset-0 z-[90] overflow-hidden bg-[#070c16] text-ink"
      onClick={onClose}
    >
      <div aria-hidden className="ambient-sky absolute inset-0" />
      <div
        className="relative flex h-full flex-col justify-between p-[6vh_6vw] transition-transform duration-[3000ms]"
        style={{ transform: `translate(${drift.x}px, ${drift.y}px)` }}
      >
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-display text-[clamp(5rem,13vw,12rem)] font-semibold leading-none tracking-tight tabular-nums">{time}</p>
            <p className="mt-3 text-[clamp(1.1rem,2vw,1.8rem)] text-ink-2">
              {formatLongDate(now, tz)}
              {prayer.data ? ` · ${prayer.data.hijri}` : ""}
            </p>
          </div>
          <div className="space-y-4 text-end">
            {weather.data && WIcon && (
              <div className="flex items-center justify-end gap-4">
                <WIcon className="size-[clamp(3rem,5vw,4.5rem)] text-gold" strokeWidth={1.4} aria-hidden />
                <div>
                  <p className="text-[clamp(2.4rem,4.5vw,4rem)] font-semibold leading-none tabular-nums">{Math.round(weather.data.temperature)}°</p>
                  <p className="text-[clamp(0.9rem,1.4vw,1.2rem)] text-ink-2">
                    {w?.label} · {loc?.name}
                  </p>
                </div>
              </div>
            )}
            {nextPrayer && (
              <p className="text-[clamp(1rem,1.8vw,1.5rem)] text-ink-2">
                <span className="text-emerald">{nextPrayer.name}</span> {formatHHMM(nextPrayer.at)} · {nextPrayer.inText}
              </p>
            )}
            {stats.todayTotal > 0 && (
              <p className="text-[clamp(0.9rem,1.4vw,1.2rem)] text-ink-3">
                {stats.todayTotal - stats.todayDone} task{stats.todayTotal - stats.todayDone === 1 ? "" : "s"} left today
              </p>
            )}
          </div>
        </div>

        <div className="max-w-[70vw] space-y-6">
          {verse.data && (
            <figure>
              <blockquote className="line-clamp-3 text-[clamp(1.2rem,2.2vw,2rem)] leading-snug text-ink">“{verse.data.translation}”</blockquote>
              <figcaption className="mt-2 text-[clamp(0.85rem,1.2vw,1.05rem)] text-ink-3">
                Quran {verse.data.surah}:{verse.data.ayah} · {verse.data.surahName}
              </figcaption>
            </figure>
          )}
          {headline && (
            <p key={headline.id} className="animate-fade-up text-[clamp(0.95rem,1.5vw,1.3rem)] text-ink-2">
              <span className="me-2 font-semibold uppercase tracking-wider text-cyan">Ajj ka Haal</span>
              {headline.title} <span className="text-ink-3">— {headline.source}</span>
            </p>
          )}
          <p className="text-[clamp(0.8rem,1.1vw,1rem)] text-ink-3">
            Press any button to return{code ? ` · Phone remote code ${code}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
