import { BookOpen, Headphones, MoonStar, ShoppingCart, SquareCheckBig, Tv } from "lucide-react";
import { CHANNELS } from "@/data/channels";
import { describeWeather } from "@/features/dashboard/daily";
import { aqiBand } from "@/features/mausam/aqi";
import { sherForDate } from "@/features/pakistan/data";
import { surahMeta } from "@/features/quran/quran-state";
import { taskStats } from "@/features/tasks/logic";
import { dayPart, formatHHMM, formatLongDate, todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, quranStore, suneinStore, tasksStore, tvStore } from "@/lib/storage/stores";
import { Card, Skeleton, Tile, cx } from "../components/ui";
import { useNow } from "../lib/cached";
import { PRAYERS, clock, nextPrayer, useAir, useFx, usePrayer, useSettings, useVerse, useWeather } from "../lib/data";
import { navigate } from "../lib/router";

const GREETING = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Assalamu alaikum" } as const;

export function HomeScreen() {
  const s = useSettings();
  const now = useNow(1000);
  const tz = s.timezone;
  const { time, ampm } = clock(now, tz);
  const prayer = usePrayer();
  const next = nextPrayer(prayer.data, tz, now);
  const part = dayPart(tz, now) as keyof typeof GREETING;

  return (
    <div class="grid h-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6">
      <div class="flex min-w-0 flex-col gap-6">
        <div>
          <p class="text-xl text-ink-2">
            {formatLongDate(now, tz)}
            {prayer.data ? ` · ${prayer.data.hijri}` : ""}
          </p>
          <div class="mt-1 flex items-end gap-4">
            <p class="font-display text-[6.5rem] font-semibold leading-none tabular-nums tracking-tight">{time}</p>
            <p class="mb-3 text-2xl text-ink-3">{ampm}</p>
          </div>
          <p class="mt-2 font-display text-[2.2rem] leading-tight">
            {GREETING[part] ?? "Assalamu alaikum"}
            {s.name ? `, ${s.name}` : ""}
          </p>
        </div>
        <VerseCard />
        <Modules />
      </div>
      <div class="flex min-w-0 flex-col gap-6">
        <WeatherCard />
        <Card title="Prayer times" right={next && <span class="text-lg text-emerald">{next.name} {next.inText}</span>}>
          {!prayer.data ? (
            <Skeleton class="h-24" />
          ) : (
            <div class="grid grid-cols-5 gap-3">
              {PRAYERS.map((k) => (
                <div key={k} class={cx("rounded-2xl px-3 py-3 text-center", next?.name === k ? "bg-emerald/15 text-emerald" : "bg-white/[0.04]")}>
                  <p class="text-sm uppercase tracking-wider opacity-80">{k}</p>
                  <p class="mt-1 text-2xl font-semibold tabular-nums">{formatHHMM(prayer.data!.timings[k].slice(0, 5))}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <SherCard />
        <RatesStrip />
      </div>
    </div>
  );
}

function VerseCard() {
  const v = useVerse();
  return (
    <Card title="Ayah of the day">
      {!v.data ? (
        <Skeleton class="h-28" />
      ) : (
        <button type="button" class="block w-full text-start" data-autofocus onClick={() => navigate(`/quran?s=${v.data!.surah}&a=${v.data!.ayah}`)}>
          <p class="line-clamp-4 text-[1.55rem] leading-snug">&ldquo;{v.data.translation}&rdquo;</p>
          <p class="mt-3 text-lg text-ink-3">
            Quran {v.data.surah}:{v.data.ayah} · {v.data.surahName}
          </p>
        </button>
      )}
    </Card>
  );
}

function WeatherCard() {
  const w = useWeather(8);
  const air = useAir();
  const { location } = useSettings();
  if (!w.data) return <Skeleton class="h-40" />;
  const d = describeWeather(w.data.code, w.data.isDay);
  const Icon = d.icon;
  const band = air.data ? aqiBand(air.data.aqi) : null;
  return (
    <button type="button" class="card block p-6 text-start" onClick={() => navigate("/mausam")}>
      <div class="flex items-center gap-6">
        <Icon size={72} strokeWidth={1.4} class="text-gold" aria-hidden="true" />
        <div class="flex-1">
          <p class="text-[3.2rem] font-semibold leading-none tabular-nums">{Math.round(w.data.temperature)}°</p>
          <p class="mt-1 text-xl text-ink-2">
            {d.label} · {location?.name}
          </p>
        </div>
        <div class="text-end text-lg text-ink-2">
          <p>
            H {Math.round(w.data.high)}° · L {Math.round(w.data.low)}°
          </p>
          {band && air.data && (
            <p class="mt-1" style={{ color: band.color }}>
              AQI {air.data.aqi} · {band.label}
            </p>
          )}
        </div>
      </div>
      <div class="mt-5 grid grid-cols-6 gap-2">
        {w.data.hourly.slice(0, 6).map((h) => {
          const hd = describeWeather(h.code, h.isDay);
          const HI = hd.icon;
          return (
            <div key={h.time} class="rounded-xl bg-white/[0.04] py-2 text-center">
              <p class="text-sm text-ink-3">{new Date(h.time).toLocaleTimeString("en-US", { hour: "numeric" })}</p>
              <HI size={22} class="mx-auto my-1 text-ink-2" aria-hidden="true" />
              <p class="text-lg tabular-nums">{Math.round(h.temperature)}°</p>
            </div>
          );
        })}
      </div>
    </button>
  );
}

function SherCard() {
  const { timezone } = useSettings();
  const sher = sherForDate(todayKey(timezone));
  return (
    <button type="button" class="card block p-6 text-center" onClick={() => navigate("/pakistan")}>
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Sher of the day</p>
      <div lang="ur" dir="rtl" class="font-urdu mt-2 text-[1.65rem] leading-[2.3]">
        <p>{sher.lines[0]}</p>
        <p>{sher.lines[1]}</p>
      </div>
      <p class="text-base text-ink-3">{sher.poet}</p>
    </button>
  );
}

function RatesStrip() {
  const fx = useFx();
  const pick = ["USD", "SAR", "AED", "GBP"].map((c) => fx.data?.currencies.find((x) => x.code === c)).filter((c) => !!c);
  if (!pick.length) return null;
  return (
    <button type="button" class="card flex items-center justify-between gap-4 px-6 py-4 text-lg" onClick={() => navigate("/bazaar")}>
      {pick.map((c) => {
        const v = c!.code === "USD" && fx.data!.usdDaily ? fx.data!.usdDaily.value : (c!.reference ?? c!.officialMonthly?.value);
        return (
          <span key={c!.code} class="tabular-nums">
            <span class="text-ink-3">{c!.code}</span> {v ? `Rs ${v.toFixed(1)}` : "—"}
          </span>
        );
      })}
    </button>
  );
}

function Modules() {
  const { timezone } = useSettings();
  const quran = usePersisted(quranStore);
  const tasks = usePersisted(tasksStore);
  const groceries = usePersisted(groceryStore);
  const sunein = usePersisted(suneinStore);
  const tv = usePersisted(tvStore);
  const last = quran.lastRead;
  const lastSurah = last ? surahMeta(last.surah) : null;
  const stats = taskStats(tasks, timezone);
  const pending = groceries.filter((g) => !g.purchased).length;
  const listening = Object.values(sunein.progress).sort((a, b) => b.at.localeCompare(a.at))[0];
  const lastChannel = tv.recent[0] ? CHANNELS.find((c) => c.id === tv.recent[0].id) : undefined;
  const tiles = [
    { icon: BookOpen, title: "Quran", sub: lastSurah ? `Continue ${lastSurah.englishName} ${last!.ayah}` : "Begin reading", go: last ? `/quran?s=${last.surah}&a=${last.ayah}` : "/quran" },
    { icon: MoonStar, title: "Namaz", sub: "Timetable & dates", go: "/namaz" },
    { icon: Headphones, title: "Sunein", sub: listening ? `Continue: ${listening.title}` : "Podcasts & radio", go: "/sunein" },
    { icon: Tv, title: "Live TV", sub: lastChannel ? lastChannel.name : "News & more", go: lastChannel ? `/tv?ch=${lastChannel.id}` : "/tv" },
    { icon: SquareCheckBig, title: "Tasks", sub: stats.todayTotal ? `${stats.todayTotal - stats.todayDone} left today` : "Nothing due today", go: "/tasks" },
    { icon: ShoppingCart, title: "Saman", sub: pending ? `${pending} to buy` : "List is empty", go: "/saman" },
  ];
  return (
    <div class="grid grid-cols-3 gap-4">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Tile key={t.title} class="p-5" onClick={() => navigate(t.go)}>
            <Icon size={28} class="text-emerald" aria-hidden="true" />
            <p class="mt-3 text-xl font-semibold">{t.title}</p>
            <p class="mt-0.5 line-clamp-1 text-base text-ink-3">{t.sub}</p>
          </Tile>
        );
      })}
    </div>
  );
}
