import { BookOpen, ChevronRight, Headphones, ShoppingCart, SquareCheckBig } from "lucide-react";
import { describeWeather } from "@/features/dashboard/daily";
import { aqiBand } from "@/features/mausam/aqi";
import { sherForDate } from "@/features/pakistan/data";
import { surahMeta } from "@/features/quran/quran-state";
import { toggleTask } from "@/features/tasks/actions";
import { filterTasks, sortTasks, taskStats } from "@/features/tasks/logic";
import { dayPart, formatHHMM, formatLongDate, todayKey } from "@/lib/dates";
import { usePersisted } from "@/lib/storage/persisted-store";
import { groceryStore, quranStore, suneinStore, tasksStore } from "@/lib/storage/stores";
import { Card, Skeleton, cx } from "../components/ui";
import { useNow } from "../lib/cached";
import { PRAYERS, nextPrayer, useAir, useFx, usePrayer, useSettings, useVerse, useWeather } from "../lib/data";
import { tap } from "../lib/native";
import { push, setTab } from "../lib/nav";
import { play } from "../lib/player";

const GREETING = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Assalamu alaikum" } as const;

export function HomeScreen() {
  const s = useSettings();
  const now = useNow(30_000);
  const prayer = usePrayer();
  const next = nextPrayer(prayer.data, s.timezone, now);
  const part = dayPart(s.timezone, now) as keyof typeof GREETING;

  return (
    <div className="page-in pt-safe px-4 pb-32">
      <p className="mt-2 text-sm text-ink-2">
        {formatLongDate(now, s.timezone)}
        {prayer.data ? ` · ${prayer.data.hijri}` : ""}
      </p>
      <h1 className="font-display mt-1 text-[2.1rem] font-semibold leading-tight">
        {GREETING[part]}
        {s.name ? `, ${s.name}` : ""}
      </h1>
      <p lang="ur" className="font-urdu text-lg text-ink-2">
        آج کا دن کیسا رہا؟
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="glass press p-4 text-start" onClick={() => setTab("namaz")}>
          <p className="text-xs uppercase tracking-wider text-ink-3">Next prayer</p>
          {next ? (
            <>
              <p className="mt-1 text-2xl font-semibold">{next.name}</p>
              <p className="text-sm text-emerald">
                {formatHHMM(next.at)} · {next.inText}
              </p>
            </>
          ) : (
            <Skeleton className="mt-2 h-12" />
          )}
        </button>
        <WeatherMini />
      </div>

      {prayer.data && (
        <div className="glass mt-3 grid grid-cols-5 p-2">
          {PRAYERS.map((k) => (
            <div key={k} className={cx("rounded-xl py-1.5 text-center", next?.name === k && "bg-emerald/15 text-emerald")}>
              <p className="text-[10px] uppercase tracking-wider opacity-70">{k}</p>
              <p className="text-sm font-semibold tabular-nums">{prayer.data!.timings[k].slice(0, 5)}</p>
            </div>
          ))}
        </div>
      )}

      <Verse />
      <Continue />
      <TodayTasks />
      <SherAndRates />
    </div>
  );
}

function WeatherMini() {
  const w = useWeather(6);
  const air = useAir();
  const { location } = useSettings();
  if (!w.data) return <Skeleton className="h-full min-h-24" />;
  const d = describeWeather(w.data.code, w.data.isDay);
  const Icon = d.icon;
  const band = air.data ? aqiBand(air.data.aqi) : null;
  return (
    <button type="button" className="glass press p-4 text-start" onClick={() => push({ name: "mausam" })}>
      <p className="flex items-center justify-between text-xs text-ink-3">
        {location?.name}
        <Icon size={20} className="text-gold" />
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{Math.round(w.data.temperature)}°</p>
      <p className="truncate text-sm" style={{ color: band?.color }}>
        {band && air.data ? `AQI ${air.data.aqi} · ${band.label}` : d.label}
      </p>
    </button>
  );
}

function Verse() {
  const v = useVerse();
  if (!v.data) return null;
  return (
    <button type="button" className="glass press mt-3 block w-full p-4 text-start" onClick={() => push({ name: "reader", params: { s: String(v.data!.surah), a: String(v.data!.ayah) } })}>
      <p className="text-xs uppercase tracking-wider text-gold">Ayah of the day</p>
      <p className="mt-2 line-clamp-4 text-[1.05rem] leading-relaxed">&ldquo;{v.data.translation}&rdquo;</p>
      <p className="mt-2 text-xs text-ink-3">
        Quran {v.data.surah}:{v.data.ayah} · {v.data.surahName}
      </p>
    </button>
  );
}

function Continue() {
  const quran = usePersisted(quranStore);
  const sunein = usePersisted(suneinStore);
  const groceries = usePersisted(groceryStore);
  const last = quran.lastRead;
  const listening = Object.entries(sunein.progress)
    .sort(([, a], [, b]) => b.at.localeCompare(a.at))
    .find(([, v]) => v.pos < v.dur - 30);
  const pending = groceries.filter((g) => !g.purchased).length;
  const items = [
    last && {
      icon: BookOpen,
      title: `Continue ${surahMeta(last.surah).englishName}`,
      sub: `Ayah ${last.ayah}`,
      go: () => push({ name: "reader", params: { s: String(last.surah), a: String(last.ayah) } }),
    },
    listening && {
      icon: Headphones,
      title: listening[1].title,
      sub: `${listening[1].show} · resume`,
      go: () => {
        void tap();
        play([{ key: listening[0], src: listening[1].url, title: listening[1].title, sub: listening[1].show, kind: "podcast", feedUrl: listening[1].feedUrl }]);
      },
    },
    { icon: ShoppingCart, title: "Saman", sub: pending ? `${pending} to buy` : "List is empty", go: () => setTab("saman") },
  ].filter(Boolean) as { icon: typeof BookOpen; title: string; sub: string; go: () => void }[];
  return (
    <div className="mt-3 space-y-2">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button key={it.title} type="button" className="glass press flex w-full items-center gap-3 p-3.5 text-start" onClick={it.go}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald/15 text-emerald">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{it.title}</span>
              <span className="block truncate text-xs text-ink-3">{it.sub}</span>
            </span>
            <ChevronRight size={18} className="text-ink-3" />
          </button>
        );
      })}
    </div>
  );
}

function TodayTasks() {
  const tasks = usePersisted(tasksStore);
  const { timezone } = useSettings();
  const list = sortTasks(filterTasks(tasks, "today", timezone), "due").slice(0, 5);
  const stats = taskStats(tasks, timezone);
  return (
    <Card
      className="mt-3"
      title={
        <span className="flex items-center gap-2">
          <SquareCheckBig size={14} /> Today · {stats.todayDone}/{stats.todayTotal}
        </span>
      }
      right={
        <button type="button" className="text-xs text-emerald" onClick={() => push({ name: "tasks" })}>
          All tasks
        </button>
      }
    >
      {list.length === 0 ? (
        <p className="text-sm text-ink-2">Nothing due today.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="press flex w-full items-center gap-3 py-1.5 text-start"
                onClick={() => {
                  void tap(t.completed ? "light" : "medium");
                  toggleTask(t.id);
                }}
              >
                <span className={cx("size-5 shrink-0 rounded-full border-2", t.completed ? "border-emerald bg-emerald" : "border-white/30")} />
                <span className={cx("truncate", t.completed && "text-ink-3 line-through")}>{t.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SherAndRates() {
  const { timezone } = useSettings();
  const sher = sherForDate(todayKey(timezone));
  const fx = useFx();
  const rates = ["USD", "SAR", "AED"].map((c) => fx.data?.currencies.find((x) => x.code === c)).filter(Boolean);
  return (
    <>
      <button type="button" className="glass press mt-3 block w-full p-4 text-center" onClick={() => push({ name: "pakistan" })}>
        <p className="text-xs uppercase tracking-wider text-gold">Sher of the day</p>
        <div lang="ur" dir="rtl" className="font-urdu mt-1 text-[1.2rem] leading-[2.2]">
          <p>{sher.lines[0]}</p>
          <p>{sher.lines[1]}</p>
        </div>
        <p className="text-xs text-ink-3">{sher.poet}</p>
      </button>
      {rates.length > 0 && (
        <button type="button" className="glass press mt-3 flex w-full justify-between p-4 text-sm tabular-nums" onClick={() => push({ name: "bazaar" })}>
          {rates.map((c) => {
            const v = c!.code === "USD" && fx.data!.usdDaily ? fx.data!.usdDaily.value : (c!.reference ?? c!.officialMonthly?.value);
            return (
              <span key={c!.code}>
                <span className="text-ink-3">{c!.code}</span> {v ? `Rs ${v.toFixed(1)}` : "—"}
              </span>
            );
          })}
        </button>
      )}
    </>
  );
}
