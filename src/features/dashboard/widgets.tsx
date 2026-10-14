"use client";

import {
  AlertTriangle,
  Cloud,
  CloudSun,
  Moon,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import Link from "next/link";
import { Panel, Skeleton, cn } from "@/components/ui/primitives";
import { formatHHMM, nowHHMM, todayKey } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";
import { PRAYER_METHODS } from "./prayer-methods";
import { AqiChip } from "@/features/mausam/aqi-chip";
import { dailyVerseRef, describeWeather } from "./daily";

export { dailyVerseRef, describeWeather };

interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
  observedAt: string;
  provider: string;
  sunrise: string;
  sunset: string;
  hourly: { time: string; temperature: number; code: number; isDay: boolean; precipitation: number }[];
  daily: { date: string; high: number; low: number; code: number }[];
}

export function WeatherCard({ className, detailed = false }: { className?: string; detailed?: boolean }) {
  const { location, showWeather } = usePersisted(settingsStore);
  const { data, error, loading } = useFetch<Weather>(showWeather && location ? `/api/weather?lat=${location.latitude}&lon=${location.longitude}` : null);
  if (!showWeather) return null;
  if (!location) return <SetupCard className={className} title="Weather" />;
  const d = data ? describeWeather(data.code, data.isDay) : null;
  const Icon = d?.icon ?? Cloud;
  return (
    <Panel className={cn("flex flex-col justify-between p-4", className)} aria-label="Weather">
      <p className="flex items-center gap-1.5 text-xs text-ink-2">
        <MapPin className="size-3.5" /> {location.name}
      </p>
      {error ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-2" role="status">
          <AlertTriangle className="size-4 shrink-0 text-gold" /> Weather unavailable right now.
        </p>
      ) : loading && !data ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ) : data && d ? (
        <>
          <div className="mt-2 flex items-center gap-3">
            <Icon className={cn("size-10", data.isDay ? "text-gold" : "text-[#ffd98a]")} strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-3xl font-semibold leading-none tabular-nums">{Math.round(data.temperature)}°C</p>
              <p className="mt-1 text-xs text-ink-2">{d.label}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink-3">
            H {Math.round(data.high)}° · L {Math.round(data.low)}° · feels {Math.round(data.feelsLike)}° · humidity {data.humidity}%
          </p>
          {detailed && (
            <>
              <ol className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1" aria-label="Next hours">
                {data.hourly.map((h, i) => {
                  const HIcon = describeWeather(h.code, h.isDay).icon;
                  return (
                    <li key={h.time} className={cn("flex min-w-12 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[11px]", i === 0 ? "bg-white/8 text-ink" : "text-ink-2")}>
                      <span>{i === 0 ? "Now" : formatHHMM(h.time.slice(11, 16)).replace(":00", "")}</span>
                      <HIcon className="size-4" aria-hidden />
                      <span className="font-semibold tabular-nums text-ink">{Math.round(h.temperature)}°</span>
                      {h.precipitation >= 30 && <span className="text-[9px] text-cyan">{h.precipitation}%</span>}
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 flex items-center gap-3 text-[11px] text-ink-2">
                <span className="inline-flex items-center gap-1">
                  <Sunrise className="size-3.5 text-gold" aria-hidden /> {formatHHMM(data.sunrise.slice(11, 16))}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sunset className="size-3.5 text-coral" aria-hidden /> {formatHHMM(data.sunset.slice(11, 16))}
                </span>
              </p>
            </>
          )}
          <AqiChip className="mt-2" />
          <p className="mt-1 text-[10px] text-ink-3">Open-Meteo · observed {data.observedAt.slice(11, 16)} local</p>
        </>
      ) : null}
    </Panel>
  );
}

interface Prayer {
  timings: Record<"Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha", string>;
  hijri: string;
  method: string;
}

const PRAYERS = [
  { key: "Fajr", icon: Sunrise },
  { key: "Dhuhr", icon: Sun },
  { key: "Asr", icon: CloudSun },
  { key: "Maghrib", icon: Sunset },
  { key: "Isha", icon: Moon },
] as const;

export function PrayerCard({ className }: { className?: string }) {
  const { location, showPrayer, prayerMethod, asrSchool, timezone } = usePersisted(settingsStore);
  const now = useNow();
  const date = now ? todayKey(timezone) : null;
  const { data, error, loading } = useFetch<Prayer>(
    showPrayer && location && date
      ? `/api/prayer?lat=${location.latitude}&lon=${location.longitude}&method=${prayerMethod}&school=${asrSchool}&date=${date}&tz=${encodeURIComponent(timezone)}`
      : null,
  );
  if (!showPrayer) return null;
  if (!location) return <SetupCard className={className} title="Prayer times" />;

  const current = now ? nowHHMM(timezone) : "";
  const next = data ? PRAYERS.find((p) => data.timings[p.key].slice(0, 5) > current)?.key ?? "Fajr" : undefined;

  return (
    <Panel className={cn("p-4", className)} aria-labelledby="prayer-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="prayer-title" className="text-sm font-semibold">
          Prayer Times
        </h2>
        {data && <span className="truncate text-[11px] text-ink-3">{data.hijri}</span>}
      </div>
      {error ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-2" role="status">
          <AlertTriangle className="size-4 shrink-0 text-gold" /> Prayer times are unavailable right now. Please rely on your local masjid timetable.
        </p>
      ) : loading && !data ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {PRAYERS.map((p) => (
            <Skeleton key={p.key} className="h-16" />
          ))}
        </div>
      ) : data ? (
        <>
          <ol className="mt-3 grid grid-cols-5 gap-1.5">
            {PRAYERS.map((p) => {
              const active = p.key === next;
              const Icon = p.icon;
              return (
                <li
                  key={p.key}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center",
                    active ? "bg-emerald/15 text-emerald ring-1 ring-emerald/40" : "text-ink-2",
                  )}
                  aria-current={active ? "time" : undefined}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="text-[11px]">{p.key}</span>
                  <span className={cn("text-xs font-semibold tabular-nums", active ? "text-emerald" : "text-ink")}>{formatHHMM(data.timings[p.key].slice(0, 5)).replace(/ (AM|PM)/, "")}</span>
                  {active && <span className="sr-only">(next prayer)</span>}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 truncate text-[10px] text-ink-3" title={data.method}>
            AlAdhan · {PRAYER_METHODS[prayerMethod] ?? data.method} · {asrSchool === 1 ? "Hanafi Asr" : "Standard Asr"} · {location.name}
          </p>
        </>
      ) : null}
    </Panel>
  );
}

function SetupCard({ title, className }: { title: string; className?: string }) {
  return (
    <Panel className={cn("flex flex-col justify-center gap-2 p-4 text-sm", className)}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-ink-2">Set your city to see live {title.toLowerCase()}.</p>
      <Link href="/settings#location" className="text-xs font-medium text-emerald hover:underline">
        Choose location →
      </Link>
    </Panel>
  );
}

/* Daily verse ------------------------------------------------------------ */

export function DailyVerse() {
  const { timezone, quranTranslation } = usePersisted(settingsStore);
  const now = useNow();
  const ref = now ? dailyVerseRef(todayKey(timezone)) : null;
  const tr = quranTranslation.startsWith("en.") ? quranTranslation : "en.sahih";
  const { data, error } = useFetch<{ surah: number; ayah: number; surahName: string; translation: string; translationName: string }>(
    ref ? `/api/quran/ayah?ref=${ref}&translation=${tr}` : null,
  );
  if (error) return null;
  if (!data)
    return (
      <div className="mt-4 max-w-xl space-y-2" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  return (
    <figure className="mt-4 max-w-xl">
      <blockquote className="line-clamp-4 text-sm leading-relaxed text-ink-2 md:text-[0.95rem]">“{data.translation}”</blockquote>
      <figcaption className="mt-1.5 text-xs text-ink-3">
        <Link href={`/quran?s=${data.surah}&a=${data.ayah}`} className="hover:text-emerald hover:underline">
          Quran {data.surah}:{data.ayah} ({data.surahName})
        </Link>{" "}
        · {data.translationName}
      </figcaption>
    </figure>
  );
}
