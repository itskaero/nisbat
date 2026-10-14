"use client";

import { Headphones, Loader2, Pause, Play, Radio, RotateCcw, RotateCw, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconButton, cn } from "@/components/ui/primitives";
import { usePersisted } from "@/lib/storage/persisted-store";
import { suneinStore } from "@/lib/storage/stores";
import { notifyMediaChange, registerMedia } from "@/lib/tv/media-registry";

export interface Playable {
  /** Stable key for resume (episode guid / station id). */
  key: string;
  url: string;
  title: string;
  show: string;
  artwork?: string;
  feedUrl?: string;
  live?: boolean;
}

interface Ctx {
  current: Playable | null;
  status: "idle" | "loading" | "playing" | "paused" | "error";
  error?: string;
  time: number;
  duration: number;
  rate: number;
  play: (p: Playable) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  setRate: (r: number) => void;
  stop: () => void;
}

const ListeningContext = createContext<Ctx | null>(null);
export function useListening() {
  const ctx = useContext(ListeningContext);
  if (!ctx) throw new Error("useListening must be used within ListeningProvider");
  return ctx;
}

/** One audio element for the whole app, so listening continues across screens. */
export function ListeningProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Playable | null>(null);
  const [status, setStatus] = useState<Ctx["status"]>("idle");
  const [error, setError] = useState<string>();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const cur = useRef<Playable | null>(null);
  cur.current = current;
  const rateRef = useRef(1);

  const saveProgress = useCallback(() => {
    const a = audio.current;
    const p = cur.current;
    if (!a || !p || p.live || !Number.isFinite(a.duration) || a.currentTime < 5) return;
    suneinStore.set((s) => {
      const progress = { ...s.progress, [p.key]: { pos: a.currentTime, dur: a.duration, title: p.title.slice(0, 300), show: p.show.slice(0, 200), url: p.url, feedUrl: p.feedUrl, at: new Date().toISOString() } };
      // Keep the 100 most recent.
      const keys = Object.keys(progress).sort((x, y) => progress[y].at.localeCompare(progress[x].at));
      return { ...s, progress: Object.fromEntries(keys.slice(0, 100).map((k) => [k, progress[k]])) };
    });
  }, []);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audio.current = a;
    const on = (ev: string, fn: () => void) => a.addEventListener(ev, fn);
    on("playing", () => setStatus("playing"));
    on("pause", () => {
      setStatus((s) => (s === "error" ? s : "paused"));
      saveProgress();
    });
    on("waiting", () => setStatus("loading"));
    on("timeupdate", () => setTime(a.currentTime));
    on("loadedmetadata", () => setDuration(Number.isFinite(a.duration) ? a.duration : 0));
    on("ended", () => {
      saveProgress();
      setStatus("idle");
    });
    on("error", () => {
      if (!a.src) return;
      setStatus("error");
      setError(navigator.onLine === false ? "You're offline." : "This audio couldn't be played. The station or episode may be offline.");
    });
    const t = setInterval(() => !a.paused && saveProgress(), 10_000);
    return () => {
      clearInterval(t);
      a.pause();
    };
  }, [saveProgress]);

  const play = useCallback((p: Playable) => {
    const a = audio.current;
    if (!a) return;
    if (cur.current?.key === p.key && a.src) {
      void a.play();
      return;
    }
    if (cur.current) saveProgress();
    setCurrent(p);
    setError(undefined);
    setTime(0);
    setDuration(0);
    setStatus("loading");
    a.src = p.url;
    a.defaultPlaybackRate = p.live ? 1 : rateRef.current;
    a.playbackRate = a.defaultPlaybackRate;
    // Resume where this family left off (unless nearly finished).
    const saved = suneinStore.get().progress[p.key];
    if (saved && !p.live && saved.pos < saved.dur - 30) {
      a.addEventListener("loadedmetadata", () => (a.currentTime = saved.pos), { once: true });
    }
    a.play().catch((e: Error) => {
      if (e.name === "AbortError") return;
      setStatus("error");
      setError(e.name === "NotAllowedError" ? "Press play to start." : "Couldn't start playback.");
    });
  }, [saveProgress]);

  const setRate = useCallback((r: number) => {
    rateRef.current = r;
    setRateState(r);
    if (audio.current && !cur.current?.live) {
      audio.current.defaultPlaybackRate = r;
      audio.current.playbackRate = r;
    }
  }, []);
  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a || !a.src) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  }, []);
  const seek = useCallback((t: number) => {
    if (audio.current && Number.isFinite(t)) audio.current.currentTime = t;
  }, []);
  const skip = useCallback((d: number) => {
    const a = audio.current;
    if (a && !cur.current?.live) a.currentTime = Math.max(0, Math.min((a.duration || 0) - 1, a.currentTime + d));
  }, []);
  const stop = useCallback(() => {
    saveProgress();
    audio.current?.pause();
    audio.current?.removeAttribute("src");
    setCurrent(null);
    setStatus("idle");
  }, [saveProgress]);

  // Remote / media keys.
  const stateRef = useRef(status);
  stateRef.current = status;
  useEffect(() => {
    if (!current) return;
    return registerMedia({
      id: "sunein",
      label: `${current.live ? "Radio" : "Sunein"} · ${current.title}`,
      isPlaying: () => stateRef.current === "playing" || stateRef.current === "loading",
      toggle,
      next: () => skip(30),
      prev: () => skip(-15),
    });
  }, [current, toggle, skip]);
  useEffect(() => notifyMediaChange(), [status]);

  const value = useMemo(
    () => ({ current, status, error, time, duration, rate, play, toggle, seek, skip, setRate, stop }),
    [current, status, error, time, duration, rate, play, toggle, seek, skip, setRate, stop],
  );
  return (
    <ListeningContext.Provider value={value}>
      {children}
      <MiniPlayer />
    </ListeningContext.Provider>
  );
}

export const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

/** Persistent bar shown on every screen while something is loaded. */
function MiniPlayer() {
  const l = useListening();
  usePersisted(suneinStore);
  if (!l.current) return null;
  const pct = l.duration ? (l.time / l.duration) * 100 : 0;
  const playing = l.status === "playing" || l.status === "loading";
  return (
    <section
      aria-label="Now listening"
      className="glass fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 !rounded-2xl !bg-[rgba(12,20,33,0.94)] p-2.5 md:inset-x-auto md:bottom-5 md:end-5 md:w-[min(560px,calc(100vw-340px))]"
    >
      <div className="flex items-center gap-3">
        {l.current.artwork ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.current.artwork} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald/15 text-emerald">
            {l.current.live ? <Radio className="size-5" /> : <Headphones className="size-5" />}
          </span>
        )}
        <Link href="/sunein" className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{l.current.title}</span>
          <span className="block truncate text-[11px] text-ink-3">
            {l.current.show}
            {l.status === "error" ? ` · ${l.error}` : l.current.live ? " · Live" : ` · ${fmtTime(l.time)} / ${fmtTime(l.duration)}`}
          </span>
        </Link>
        {!l.current.live && (
          <IconButton label="Back 15 seconds" size="sm" onClick={() => l.skip(-15)}>
            <RotateCcw className="size-4" />
          </IconButton>
        )}
        <button
          type="button"
          onClick={l.toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#0b1220] hover:scale-105"
        >
          {l.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : <Play className="ms-0.5 size-4" />}
        </button>
        {!l.current.live && (
          <IconButton label="Forward 30 seconds" size="sm" onClick={() => l.skip(30)}>
            <RotateCw className="size-4" />
          </IconButton>
        )}
        <IconButton label="Close player" size="sm" onClick={l.stop}>
          <X className="size-4" />
        </IconButton>
      </div>
      {!l.current.live && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className={cn("h-full bg-emerald")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </section>
  );
}
