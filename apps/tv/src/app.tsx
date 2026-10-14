import type { FunctionComponent } from "preact";
import { lazy, Suspense } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";
import { NAV_ITEMS } from "@/components/layout/nav";
import { activeMedia } from "@/lib/tv/media-registry";
import { settingsStore } from "@/lib/storage/stores";
import { Ambient } from "./components/ambient";
import { FocusRing } from "./components/focus-ring";
import { PrayerAlert } from "./components/prayer-alert";
import { Background, NowPlaying, PairingPrompt, Rail, Toasts } from "./components/shell";
import { focusFirst } from "./lib/input";
import { publishState, setScreenTitle } from "./lib/remote";
import { useRoute } from "./lib/router";
import { ambient, hasLayers, idleFor, pairing } from "./lib/ui-state";
import { HomeScreen } from "./screens/home";

// Screens other than Home load on first visit, keeping start-up small.
const SCREENS: Record<string, FunctionComponent> = {
  "/": HomeScreen,
  "/quran": lazy(() => import("./screens/quran").then((m) => m.QuranScreen)),
  "/namaz": lazy(() => import("./screens/namaz").then((m) => m.NamazScreen)),
  "/azkar": lazy(() => import("./screens/azkar").then((m) => m.AzkarScreen)),
  "/sunein": lazy(() => import("./screens/sunein").then((m) => m.SuneinScreen)),
  "/pakistan": lazy(() => import("./screens/pakistan").then((m) => m.PakistanScreen)),
  "/news": lazy(() => import("./screens/news").then((m) => m.NewsScreen)),
  "/mausam": lazy(() => import("./screens/mausam").then((m) => m.MausamScreen)),
  "/bazaar": lazy(() => import("./screens/bazaar").then((m) => m.BazaarScreen)),
  "/saman": lazy(() => import("./screens/saman").then((m) => m.SamanScreen)),
  "/tasks": lazy(() => import("./screens/tasks").then((m) => m.TasksScreen)),
  "/tv": lazy(() => import("./screens/live-tv").then((m) => m.LiveTvScreen)),
  "/search": lazy(() => import("./screens/search").then((m) => m.SearchScreen)),
  "/settings": lazy(() => import("./screens/settings").then((m) => m.SettingsScreen)),
};

const TITLES: Record<string, string> = Object.fromEntries([...NAV_ITEMS.map((n) => [n.href, n.short]), ["/search", "Search"], ["/settings", "Settings"]]);

export function App() {
  const r = useRoute();
  const Screen = SCREENS[r.path] ?? HomeScreen;
  const mainRef = useRef<HTMLElement>(null);
  const isAmbient = ambient.use();

  // New screen: title for phones, scroll to top, focus its first control.
  useEffect(() => {
    setScreenTitle(TITLES[r.path] ?? "Home");
    mainRef.current?.scrollTo(0, 0);
    // Screens load lazily and fill in from data: keep trying until focus lands
    // inside the new screen (its preferred control when it has one).
    const timers = [120, 450, 900, 1600, 2600].map((ms) =>
      setTimeout(() => {
        const a = document.activeElement as HTMLElement | null;
        const inMain = !!a?.closest("main");
        const preferred = document.querySelector("main [data-autofocus]");
        if (!inMain || (preferred && a !== preferred && a?.closest("[data-autofocus]") == null && ms <= 900)) focusFirst();
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [r.path]);

  useEffect(() => publishState(), [isAmbient]);

  // Ambient screen after the chosen idle time — never over playback or prompts.
  useEffect(() => {
    const t = setInterval(() => {
      const mins = settingsStore.get().ambientMinutes;
      if (!mins || ambient.get() || hasLayers() || pairing.get().length) return;
      if (activeMedia()?.isPlaying()) return;
      if (r.path === "/tv") return;
      if (idleFor() > mins * 60_000) ambient.set(true);
    }, 10_000);
    return () => clearInterval(t);
  }, [r.path]);

  return (
    <>
      <Background />
      <div class="flex h-full">
        <Rail />
        <main ref={mainRef} class="no-scrollbar min-w-0 flex-1 overflow-y-auto px-[2.4vw] py-[3vh]">
          <div key={r.path} class="screen-enter min-h-full">
            <Suspense fallback={<div class="h-40" />}>
              <Screen />
            </Suspense>
          </div>
        </main>
      </div>
      <NowPlaying />
      <Toasts />
      <PrayerAlert />
      <PairingPrompt />
      {isAmbient && <Ambient />}
      <FocusRing />
    </>
  );
}
