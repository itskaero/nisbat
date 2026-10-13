"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Newspaper,
  NotebookPen,
  Play,
  Plus,
  ShoppingCart,
  SquareCheckBig,
  Tv,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge, Button, EmptyState, Panel, ProgressBar, ProgressRing, Segmented, cn } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CHANNELS } from "@/data/channels";
import { estimate, formatPKR } from "@/features/groceries/actions";
import { useGroceryDialog } from "@/features/groceries/add-item-dialog";
import { ProductThumb } from "@/features/groceries/product-thumb";
import { readStats, surahMeta } from "@/features/quran/quran-state";
import { createTask } from "@/features/tasks/actions";
import { filterTasks, sortTasks, taskStats } from "@/features/tasks/logic";
import { useTaskDialog } from "@/features/tasks/task-dialog";
import { TaskRow } from "@/features/tasks/task-row";
import { CATALOG_BY_ID, GROCERY_CATALOG } from "@/data/grocery-catalog";
import { dayPart, formatLongDate, timeAgo, todayKey } from "@/lib/dates";
import { useFetch, useNow } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { useHydrated, usePersisted } from "@/lib/storage/persisted-store";
import { activityStore, groceryStore, quranStore, settingsStore, tasksStore, tvStore } from "@/lib/storage/stores";
import type { ActivityType, NewsResponse } from "@/types/domain";
import { DailyVerse, PrayerCard, WeatherCard } from "./widgets";

export function HomePage() {
  const t = useT();
  const settings = usePersisted(settingsStore);
  const now = useNow();
  const greeting = now ? t(`greet.${dayPart(settings.timezone, now)}` as const) : " ";

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]" aria-label="Today">
        <div className="animate-fade-up flex flex-col justify-center py-2 md:py-6">
          <p className="text-sm text-ink-2" suppressHydrationWarning>
            {now ? formatLongDate(now, settings.timezone) : " "}
          </p>
          <h1 className="font-display mt-1 text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl" suppressHydrationWarning>
            {greeting}
            {settings.name ? `, ${settings.name}` : "."}
          </h1>
          <p lang="ur" dir="rtl" className="font-urdu mt-2 self-start text-xl text-ink-2 md:text-2xl">
            {t("greet.urdu")}
          </p>
          <DailyVerse />
          <QuickCapture />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] content-start items-start gap-4 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          <WeatherCard detailed />
          <PrayerCard />
        </div>
      </section>

      <ModuleCards />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <TodayTasks />
        <TadaburProgress />
        <RecentActivity />
      </div>
      <p className="pb-2 text-center text-[11px] text-ink-3">
        Your tasks, lists, bookmarks and notes are stored only in this browser on this device — they don&apos;t sync to family members or other devices.
      </p>
    </div>
  );
}

/* Quick capture --------------------------------------------------------- */

function QuickCapture() {
  const [mode, setMode] = useState<"task" | "item">("task");
  const [value, setValue] = useState("");
  const { timezone } = usePersisted(settingsStore);
  const { openAddItem } = useGroceryDialog();
  const { toast } = useToast();
  return (
    <form
      className="glass mt-6 flex max-w-xl items-center gap-2 !rounded-full p-1.5 ps-2"
      onSubmit={(e) => {
        e.preventDefault();
        const text = value.trim();
        if (!text) return;
        if (mode === "task") {
          createTask({ title: text.slice(0, 200), priority: "medium", dueDate: todayKey(timezone) });
          toast("Task added for today");
        } else {
          const match = GROCERY_CATALOG.find((p) => p.name.toLowerCase() === text.toLowerCase() || p.nameUr === text || p.name.toLowerCase().startsWith(text.toLowerCase() + " "));
          openAddItem(match?.id, match ? undefined : text);
        }
        setValue("");
      }}
    >
      <Segmented
        label="Quick capture type"
        value={mode}
        onChange={setMode}
        className="shrink-0 !rounded-full !p-0.5 [&>button]:!rounded-full"
        options={[
          { value: "task", label: "Task" },
          { value: "item", label: "Saman" },
        ]}
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={mode === "task" ? "Quick note a task for today…" : "Add a grocery item, e.g. Tomato"}
        aria-label={mode === "task" ? "Quick add task" : "Quick add grocery item"}
        className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none"
        maxLength={200}
      />
      <button
        type="submit"
        aria-label="Add"
        disabled={!value.trim()}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-[#2a1a05] transition-transform hover:scale-105 disabled:opacity-50"
      >
        <Plus className="size-5" />
      </button>
    </form>
  );
}

/* Module cards ---------------------------------------------------------- */

function ModuleCard({
  href,
  icon: Icon,
  title,
  subtitle,
  art,
  children,
  delay = 0,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  art: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <article
      className="glass animate-fade-up group relative flex min-h-[210px] flex-col overflow-hidden p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/22"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100" style={{ background: art }} />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Icon className="size-5 text-emerald" aria-hidden />
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {title}
            </Link>
          </h2>
          <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>
        </div>
        <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink rtl:-scale-x-100" aria-hidden />
      </div>
      <div className="relative z-10 mt-auto pt-4">{children}</div>
    </article>
  );
}

function ModuleCards() {
  const t = useT();
  const hydrated = useHydrated();
  const quran = usePersisted(quranStore);
  const tasks = usePersisted(tasksStore);
  const groceries = usePersisted(groceryStore);
  const tv = usePersisted(tvStore);
  const { timezone } = usePersisted(settingsStore);
  const news = useFetch<NewsResponse>("/api/news?category=top");
  const pending = groceries.filter((g) => !g.purchased);
  const est = estimate(pending);
  const stats = taskStats(tasks, timezone);
  const last = hydrated ? quran.lastRead : null;
  const lastMeta = last ? surahMeta(last.surah) : null;
  const lastTv = hydrated && tv.recent[0] ? CHANNELS.find((c) => c.id === tv.recent[0].id) : undefined;
  const tvChannel = lastTv?.stream ? lastTv : CHANNELS.find((c) => c.stream);
  const headline = news.data?.items[0];
  const thumbs = pending.slice(0, 4).length ? pending.slice(0, 4) : ["tomato", "onion", "potato", "chicken"].map((id) => ({ id, productId: id, category: CATALOG_BY_ID.get(id)!.category, name: CATALOG_BY_ID.get(id)!.name }));

  return (
    <section aria-label="Modules" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <ModuleCard href="/quran" icon={BookOpen} title={t("nav.quran")} subtitle={t("module.quran.sub")} art="radial-gradient(120% 90% at 100% 0%, rgba(233,182,107,0.22), transparent 60%)">
        <Link
          href={last ? `/quran?s=${last.surah}&a=${last.ayah}` : "/quran?s=1"}
          className="glass-soft relative flex items-center gap-3 p-3 hover:bg-white/8"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald/20 text-emerald">
            <Play className="ms-0.5 size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{lastMeta ? `Surah ${lastMeta.englishName}` : "Start with Al-Faatiha"}</span>
            <span className="block text-[11px] text-ink-3">{last ? `Continue at ayah ${last.ayah}` : "Begin your Tadabur"}</span>
          </span>
        </Link>
      </ModuleCard>

      <ModuleCard href="/news" icon={Newspaper} title={t("nav.news")} subtitle={t("module.news.sub")} art="radial-gradient(120% 90% at 100% 0%, rgba(101,199,232,0.18), transparent 60%)" delay={60}>
        {news.error ? (
          <p className="text-xs text-ink-3">Headlines unavailable right now.</p>
        ) : headline ? (
          <Link href="/news" className="relative block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan">Top news</p>
            <p className="mt-1 line-clamp-3 text-sm font-medium leading-snug">{headline.title}</p>
            <p className="mt-1 text-[11px] text-ink-3" suppressHydrationWarning>
              {headline.source} · {timeAgo(headline.publishedAt)}
            </p>
          </Link>
        ) : (
          <div className="space-y-2" aria-hidden>
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        )}
      </ModuleCard>

      <ModuleCard href="/saman" icon={ShoppingCart} title={t("nav.saman")} subtitle={t("module.saman.sub")} art="radial-gradient(120% 90% at 100% 0%, rgba(69,212,154,0.18), transparent 60%)" delay={120}>
        <div className="flex items-end justify-between gap-2">
          <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden>
            {thumbs.slice(0, 3).map((g) => (
              <span key={g.id} className="size-10 overflow-hidden rounded-full border-2 border-[#162231]">
                <ProductThumb productId={g.productId} category={g.category} name={g.name} />
              </span>
            ))}
          </div>
          <Badge tone="emerald" className="shrink-0 whitespace-nowrap text-xs">
            {hydrated ? `${pending.length} item${pending.length === 1 ? "" : "s"} in list` : "Your list"}
          </Badge>
        </div>
        {hydrated && est.priced > 0 && (
          <p className="mt-2 text-[11px] text-ink-3">
            ≈ {formatPKR(est.total)}
            {est.sample ? " (incl. sample estimates)" : ""}
          </p>
        )}
      </ModuleCard>

      <ModuleCard href="/tasks" icon={SquareCheckBig} title={t("nav.tasks")} subtitle={t("module.tasks.sub")} art="radial-gradient(120% 90% at 100% 0%, rgba(185,164,255,0.16), transparent 60%)" delay={180}>
        <div className="flex items-center gap-3">
          <ProgressRing value={hydrated ? stats.todayDone : 0} max={hydrated ? stats.todayTotal : 0} size={56} stroke={5} label={`${stats.todayDone} of ${stats.todayTotal} done today`}>
            <span className="text-xs font-semibold">
              {hydrated ? stats.todayDone : 0}/{hydrated ? stats.todayTotal : 0}
            </span>
          </ProgressRing>
          <div className="text-xs">
            <p className="text-sm font-medium">{hydrated ? `${stats.todayTotal - stats.todayDone} left today` : "Today"}</p>
            {hydrated && stats.overdue > 0 ? <p className="text-coral">{stats.overdue} overdue</p> : <p className="text-ink-3">{hydrated ? `${stats.pending} pending overall` : ""}</p>}
          </div>
        </div>
      </ModuleCard>

      <ModuleCard href="/tv" icon={Tv} title={t("nav.tv")} subtitle={t("module.tv.sub")} art="radial-gradient(120% 90% at 100% 0%, rgba(240,124,101,0.16), transparent 60%)" delay={240}>
        {tvChannel && (
          <Link href={`/tv?ch=${tvChannel.id}`} className="glass-soft relative flex items-center gap-3 p-3 hover:bg-white/8">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{tvChannel.name}</span>
              <span className="block text-[11px] text-ink-3">{lastTv ? "Last watched" : "Official live stream"}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#0b1220]">
              <Play className="ms-0.5 size-4" aria-hidden />
            </span>
          </Link>
        )}
      </ModuleCard>
    </section>
  );
}

/* Today --------------------------------------------------------------- */

function TodayTasks() {
  const tasks = usePersisted(tasksStore);
  const { timezone } = usePersisted(settingsStore);
  const hydrated = useHydrated();
  const { openTask } = useTaskDialog();
  const today = sortTasks(filterTasks(tasks, "today", timezone), "due");
  const upcoming = sortTasks(filterTasks(tasks, "upcoming", timezone), "due").slice(0, 3);

  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="today-title">
      <div className="flex items-center justify-between">
        <h2 id="today-title" className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="size-4 text-cyan" /> Today&apos;s plan
        </h2>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openTask()}>
            <Plus className="size-4" /> New
          </Button>
          <Link href="/tasks" className="inline-flex h-8 items-center rounded-xl px-3 text-xs text-ink-2 hover:bg-white/6 hover:text-ink">
            All tasks
          </Link>
        </div>
      </div>
      {!hydrated ? (
        <div className="mt-3 space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-11" />
          ))}
        </div>
      ) : today.length === 0 ? (
        <EmptyState
          className="py-6"
          icon={<CheckCircle2 className="size-5" />}
          title="Nothing due today"
          description="Use the quick capture above to jot something down."
        />
      ) : (
        <ul className="mt-2">
          {today.slice(0, 6).map((task) => (
            <TaskRow key={task.id} task={task} tz={timezone} compact />
          ))}
          {today.length > 6 && (
            <li className="px-2 pt-1 text-xs text-ink-3">
              <Link href="/tasks" className="hover:underline">
                +{today.length - 6} more
              </Link>
            </li>
          )}
        </ul>
      )}
      {hydrated && upcoming.length > 0 && (
        <div className="mt-3 border-t border-white/8 pt-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Coming up</p>
          <ul>
            {upcoming.map((task) => (
              <TaskRow key={task.id} task={task} tz={timezone} compact />
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function TadaburProgress() {
  const quran = usePersisted(quranStore);
  const { timezone } = usePersisted(settingsStore);
  const hydrated = useHydrated();
  const { openAddItem } = useGroceryDialog();
  const { openTask } = useTaskDialog();
  const s = readStats(quran, timezone);
  const last = quran.lastRead;

  const actions = [
    { label: "Continue Quran", href: last ? `/quran?s=${last.surah}&a=${last.ayah}` : "/quran?s=1", icon: BookOpen },
    { label: "Today's Tadabur", href: last ? `/quran?s=${last.surah}&a=${last.ayah}` : "/quran?s=1", icon: NotebookPen },
    { label: "Today's news", href: "/news", icon: Newspaper },
    { label: "Open Live TV", href: "/tv", icon: Tv },
  ];

  return (
    <Panel className="p-4 sm:p-5" aria-labelledby="tadabur-title">
      <h2 id="tadabur-title" className="flex items-center gap-2 text-sm font-semibold">
        <NotebookPen className="size-4 text-gold" /> Today&apos;s Tadabur
      </h2>
      <div className="mt-3 flex items-center gap-4">
        <ProgressRing value={hydrated ? s.today : 0} max={quran.dailyGoal} size={72} stroke={6} color="var(--gold)" label={`${s.today} of ${quran.dailyGoal} verses today`}>
          <span className="text-sm font-semibold">
            {hydrated ? s.today : 0}
            <span className="text-ink-3">/{quran.dailyGoal}</span>
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1 text-xs text-ink-2">
          <p>
            <span className="font-semibold text-ink">{hydrated ? s.reflectionsToday : 0}</span> reflection{s.reflectionsToday === 1 ? "" : "s"} today
          </p>
          <p className="mt-1">Overall {hydrated ? s.total : 0} of 6,236 verses read</p>
          <ProgressBar className="mt-2" value={hydrated ? s.total : 0} max={6236} label="Overall reading progress" />
        </div>
      </div>
      <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Quick actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Link key={a.label} href={a.href} className="glass-soft flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/8">
            <a.icon className="size-4 text-emerald" aria-hidden /> {a.label}
          </Link>
        ))}
        <button type="button" onClick={() => openAddItem()} className="glass-soft flex items-center gap-2 px-3 py-2.5 text-start text-xs hover:bg-white/8">
          <ShoppingCart className="size-4 text-emerald" aria-hidden /> Add grocery item
        </button>
        <button type="button" onClick={() => openTask()} className="glass-soft flex items-center gap-2 px-3 py-2.5 text-start text-xs hover:bg-white/8">
          <SquareCheckBig className="size-4 text-emerald" aria-hidden /> Create task
        </button>
      </div>
    </Panel>
  );
}

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  "task-completed": CheckCircle2,
  "task-created": SquareCheckBig,
  "quran-read": BookOpen,
  "reflection-saved": NotebookPen,
  "grocery-added": ShoppingCart,
  "grocery-purchased": CheckCircle2,
  "news-saved": Newspaper,
  "tv-watched": Tv,
};

function RecentActivity() {
  const activity = usePersisted(activityStore);
  const hydrated = useHydrated();
  const t = useT();
  return (
    <Panel className="p-4 sm:p-5 lg:col-span-2 2xl:col-span-1" aria-labelledby="activity-title">
      <h2 id="activity-title" className="text-sm font-semibold">
        {t("home.recent")}
      </h2>
      {!hydrated ? null : activity.length === 0 ? (
        <EmptyState className="py-6" title="No activity yet" description="Reading, saving news, completing tasks and shopping will show up here." />
      ) : (
        <ol className="mt-3 space-y-0.5">
          {activity.slice(0, 7).map((a) => {
            const Icon = ACTIVITY_ICON[a.type];
            const body = (
              <>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-white/6", a.type.includes("completed") || a.type === "grocery-purchased" ? "text-emerald" : "text-ink-2")}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{a.label}</span>
                <time className="shrink-0 text-[11px] text-ink-3" dateTime={a.at}>
                  {timeAgo(a.at)}
                </time>
              </>
            );
            return (
              <li key={a.id}>
                {a.href ? (
                  <Link href={a.href} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-2 py-2">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
