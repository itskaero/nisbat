import { BookOpen, Gamepad2, Home, LayoutGrid, MoonStar, Pause, Play, ShoppingCart, Tv, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { apiUrl } from "@/lib/api-base";
import { zonedParts } from "@/lib/dates";
import { cx } from "./components/ui";
import { fmtTime, stop, toggle, usePlayer } from "./lib/player";
import { onBackButton } from "./lib/native";
import { pop, push, setTab, useNav, type Tab } from "./lib/nav";
import { showOnTv } from "./lib/remote";
import { toast, Toasts } from "./lib/toast";
import { useSettings } from "./lib/data";
import { HomeScreen } from "./screens/home";

const lz = <T extends string>(load: () => Promise<Record<T, ComponentType<{ params: Record<string, string> }>>>, name: T) => lazy(() => load().then((m) => ({ default: m[name] })));

const PAGES: Record<string, ComponentType<{ params: Record<string, string> }>> = {
  home: HomeScreen,
  quran: lz(() => import("./screens/quran"), "QuranScreen"),
  reader: lz(() => import("./screens/quran"), "ReaderScreen"),
  namaz: lz(() => import("./screens/namaz"), "NamazScreen"),
  saman: lz(() => import("./screens/saman"), "SamanScreen"),
  tasks: lz(() => import("./screens/tasks"), "TasksScreen"),
  azkar: lz(() => import("./screens/azkar"), "AzkarScreen"),
  sunein: lz(() => import("./screens/sunein"), "SuneinScreen"),
  podcast: lz(() => import("./screens/sunein"), "PodcastScreen"),
  news: lz(() => import("./screens/news"), "NewsScreen"),
  mausam: lz(() => import("./screens/mausam"), "MausamScreen"),
  bazaar: lz(() => import("./screens/bazaar"), "BazaarScreen"),
  pakistan: lz(() => import("./screens/pakistan"), "PakistanScreen"),
  livetv: lz(() => import("./screens/live-tv"), "LiveTvScreen"),
  more: lz(() => import("./screens/more"), "MoreScreen"),
  settings: lz(() => import("./screens/settings"), "SettingsScreen"),
  remote: lz(() => import("./screens/remote"), "RemoteScreen") as unknown as ComponentType<{ params: Record<string, string> }>,
};

/** The TV screen matching what the phone is looking at ("Show on TV"). */
const TV_PATH: Record<string, string> = {
  home: "/", quran: "/quran", reader: "/quran", namaz: "/namaz", saman: "/saman", tasks: "/tasks", azkar: "/azkar", sunein: "/sunein",
  podcast: "/sunein", news: "/news", mausam: "/mausam", bazaar: "/bazaar", pakistan: "/pakistan", livetv: "/tv", more: "/", settings: "/settings",
};

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "quran", label: "Quran", icon: BookOpen },
  { id: "namaz", label: "Namaz", icon: MoonStar },
  { id: "saman", label: "Saman", icon: ShoppingCart },
  { id: "more", label: "More", icon: LayoutGrid },
];

function slot(tz: string) {
  const { hour, minute } = zonedParts(new Date(), tz);
  const h = hour + minute / 60;
  return h >= 4 && h < 7 ? "dawn" : h >= 7 && h < 17 ? "day" : h >= 17 && h < 19.5 ? "dusk" : "night";
}

export function App() {
  const { tab, page } = useNav();
  const { timezone } = useSettings();
  const Screen = PAGES[page.name] ?? HomeScreen;
  const [bg, setBg] = useState(() => slot(timezone));

  useEffect(() => onBackButton(pop), []);
  useEffect(() => {
    const t = setInterval(() => setBg(slot(timezone)), 60_000);
    return () => clearInterval(t);
  }, [timezone]);
  useEffect(() => {
    document.getElementById("app-scroll")?.scrollTo(0, 0);
  }, [page]);

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <img src={apiUrl(`/backgrounds/${bg}-sm.webp`)} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,18,32,.55) 0%, rgba(11,18,32,.82) 55%, rgba(11,18,32,.95) 100%)" }} />
      </div>
      <main id="app-scroll" className="no-scrollbar h-full overflow-y-auto">
        <Suspense fallback={<div className="pt-safe px-4 text-ink-3">Loading…</div>}>
          <Screen key={`${tab}-${page.name}-${JSON.stringify(page.params ?? {})}`} params={page.params ?? {}} />
        </Suspense>
      </main>
      <MiniPlayer />
      {page.name !== "remote" && (
        <div className="fixed bottom-[calc(var(--safe-bottom)+5.2rem)] end-4 z-30 flex flex-col gap-2">
          <button
            type="button"
            aria-label="Show this on the TV"
            className="glass glass-strong press grid size-12 place-items-center rounded-full"
            onClick={async () => {
              try {
                const r = await showOnTv(TV_PATH[page.name] ?? "/");
                toast(r.switched ? "Showing on the TV" : "Putting Nisbat on the TV…", "info");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            <Tv size={20} />
          </button>
          <button type="button" aria-label="Remote" className="press grid size-14 place-items-center rounded-full bg-emerald text-[#06231a] shadow-lg shadow-emerald/30" onClick={() => push({ name: "remote" })}>
            <Gamepad2 size={26} />
          </button>
        </div>
      )}
      <nav aria-label="Main" className="glass glass-strong pb-safe fixed inset-x-0 bottom-0 z-40 flex rounded-none border-x-0 border-b-0 pt-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = t.id === tab;
          return (
            <button key={t.id} type="button" aria-current={on ? "page" : undefined} className={cx("press flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px]", on ? "text-emerald" : "text-ink-3")} onClick={() => setTab(t.id)}>
              <Icon size={23} strokeWidth={on ? 2.3 : 1.8} />
              {t.label}
            </button>
          );
        })}
      </nav>
      <Toasts />
    </>
  );
}

function MiniPlayer() {
  const p = usePlayer();
  if (!p.track) return null;
  return (
    <div className="glass glass-strong fade-in fixed inset-x-3 bottom-[calc(var(--safe-bottom)+4.6rem)] z-30 me-[4.5rem] flex items-center gap-3 p-2.5 ps-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.track.title}</p>
        <p className="truncate text-[11px] text-ink-3">{p.error ?? (p.track.kind === "radio" ? `${p.track.sub} · live` : `${p.track.sub} · ${fmtTime(p.pos)} / ${fmtTime(p.dur)}`)}</p>
      </div>
      <button type="button" aria-label={p.playing ? "Pause" : "Play"} className="press grid size-10 place-items-center rounded-full bg-emerald text-[#06231a]" onClick={toggle}>
        {p.playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button type="button" aria-label="Stop" className="press grid size-9 place-items-center rounded-full text-ink-3" onClick={stop}>
        <X size={18} />
      </button>
    </div>
  );
}
