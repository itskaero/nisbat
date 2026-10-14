import { useEffect, useState } from "preact/hooks";
import { describeWeather } from "@/features/dashboard/daily";
import { aqiBand } from "@/features/mausam/aqi";
import { sherForDate } from "@/features/pakistan/data";
import { taskStats } from "@/features/tasks/logic";
import { formatHHMM, formatLongDate, todayKey, zonedParts } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { tasksStore } from "@/lib/storage/stores";
import { useCached, useNow } from "../lib/cached";
import { clock, nextPrayer, useAir, useFx, usePrayer, useSettings, useVerse, useWeather } from "../lib/data";
import { identity } from "../lib/remote";
import { ambient, markActivity } from "../lib/ui-state";
import { FadeImg } from "./shell";

interface Headline {
  id: string;
  title: string;
  source: string;
}

/**
 * The TV's idle state (instead of the Chromecast backdrop): clock, prayer,
 * weather and air, the ayah or sher of the day, headlines and family photos.
 * Everything drifts slowly so a static image never burns into the panel.
 */
export function Ambient() {
  const s = useSettings();
  const tz = s.timezone;
  const now = useNow(1000);
  const { time, ampm } = clock(now, tz);
  const prayer = usePrayer();
  const next = nextPrayer(prayer.data, tz, now);
  const w = useWeather(6);
  const air = useAir();
  const verse = useVerse();
  const fx = useFx();
  const tasks = usePersisted(tasksStore);
  const news = useCached<{ items: Headline[] }>("/api/news?category=pakistan", 15 * 60_000, 20 * 60_000);
  const photos = useCached<{ photos: { id: string; url: string }[] }>(s.ambientPhotos ? "/api/photos" : null, 10 * 60_000, 30 * 60_000);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    // No focus ring over the screensaver; give focus back when it closes.
    const prev = document.activeElement as HTMLElement | null;
    prev?.blur();
    return () => {
      clearInterval(t);
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, []);

  const { minute } = zonedParts(now, tz);
  const drift = { x: ((minute % 6) - 3) * 6, y: ((Math.floor(minute / 6) % 5) - 2) * 6 };
  const headlines = news.data?.items.slice(0, 10) ?? [];
  const headline = headlines.length ? headlines[tick % headlines.length] : undefined;
  const showSher = Math.floor(tick / 2) % 2 === 1;
  const sher = sherForDate(todayKey(tz));
  const wd = w.data ? describeWeather(w.data.code, w.data.isDay) : null;
  const WIcon = wd?.icon;
  const band = air.data ? aqiBand(air.data.aqi) : null;
  const stats = taskStats(tasks, tz);
  const list = photos.data?.photos ?? [];
  const photo = list.length ? list[Math.floor(tick / 2) % list.length] : null;
  const fxLine = ["USD", "SAR"]
    .map((c) => {
      const cur = fx.data?.currencies.find((x) => x.code === c);
      const v = c === "USD" && fx.data?.usdDaily ? fx.data.usdDaily.value : cur?.reference;
      return v ? `${c} Rs ${v.toFixed(1)}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ambient screen. Press any button to return."
      class="fade-in fixed inset-0 z-[90] overflow-hidden bg-[#070c16]"
      onClick={() => {
        markActivity();
        ambient.set(false);
      }}
    >
      {photo && (
        <div class="absolute inset-0">
          <FadeImg key={photo.id} src={photo.url} class="!object-contain opacity-80" />
          <div class="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,12,22,.75) 0%, rgba(7,12,22,.25) 40%, rgba(7,12,22,.85) 100%)" }} />
        </div>
      )}
      <div class="relative flex h-full flex-col justify-between p-[6vh_6vw]" style={{ transform: `translate3d(${drift.x}px, ${drift.y}px, 0)`, transition: "transform 3000ms ease" }}>
        <div class="flex items-start justify-between gap-8">
          <div>
            <p class="font-display text-[9rem] font-semibold leading-none tabular-nums tracking-tight">
              {time}
              <span class="ms-3 text-[2.4rem] text-ink-3">{ampm}</span>
            </p>
            <p class="mt-3 text-[1.6rem] text-ink-2">
              {formatLongDate(now, tz)}
              {prayer.data ? ` · ${prayer.data.hijri}` : ""}
            </p>
          </div>
          <div class="space-y-3 text-end">
            {w.data && WIcon && (
              <div class="flex items-center justify-end gap-4">
                <WIcon size={64} strokeWidth={1.4} class="text-gold" aria-hidden="true" />
                <div>
                  <p class="text-[3.4rem] font-semibold leading-none tabular-nums">{Math.round(w.data.temperature)}°</p>
                  <p class="text-xl text-ink-2">
                    {wd?.label} · {s.location?.name}
                  </p>
                </div>
              </div>
            )}
            {band && air.data && (
              <p class="text-xl" style={{ color: band.color }}>
                AQI {air.data.aqi} · {band.label}
              </p>
            )}
            {next && (
              <p class="text-2xl text-ink-2">
                <span class="text-emerald">{next.name}</span> {formatHHMM(next.at)} · {next.inText}
              </p>
            )}
            {fxLine && <p class="text-xl tabular-nums text-ink-3">{fxLine}</p>}
            {stats.todayTotal > stats.todayDone && (
              <p class="text-xl text-ink-3">
                {stats.todayTotal - stats.todayDone} task{stats.todayTotal - stats.todayDone === 1 ? "" : "s"} left today
              </p>
            )}
          </div>
        </div>
        <div class="max-w-[72vw] space-y-6">
          {showSher ? (
            <figure key="sher" class="fade-in">
              <blockquote lang="ur" dir="rtl" class="font-urdu w-fit text-[2.4rem] leading-[2.3]">
                <p>{sher.lines[0]}</p>
                <p>{sher.lines[1]}</p>
              </blockquote>
              <figcaption class="mt-1 text-xl text-ink-3">{sher.poet}</figcaption>
            </figure>
          ) : (
            verse.data && (
              <figure key="verse" class="fade-in">
                <blockquote class="line-clamp-3 text-[2rem] leading-snug">&ldquo;{verse.data.translation}&rdquo;</blockquote>
                <figcaption class="mt-2 text-xl text-ink-3">
                  Quran {verse.data.surah}:{verse.data.ayah} · {verse.data.surahName}
                </figcaption>
              </figure>
            )
          )}
          {headline && (
            <p key={headline.id} class="fade-in text-[1.35rem] text-ink-2">
              <span class="me-2 font-semibold uppercase tracking-wider text-cyan">Ajj ka Haal</span>
              {headline.title} <span class="text-ink-3">— {headline.source}</span>
            </p>
          )}
          <p class="text-lg text-ink-3">Press any button to return · {identity().name}</p>
        </div>
      </div>
    </div>
  );
}
