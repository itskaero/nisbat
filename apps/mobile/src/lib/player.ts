import { useEffect, useState } from "react";
import { suneinStore } from "@/lib/storage/stores";

/**
 * The phone's audio player: Quran recitation, adhkar, podcasts and radio.
 * Podcast positions go into the family's shared Sunein store (same keys as
 * the TV and website), so listening continues on any screen.
 */
export interface Track {
  key: string;
  src: string;
  fallback?: string[];
  title: string;
  sub: string;
  kind: "quran" | "podcast" | "radio" | "dhikr";
  feedUrl?: string;
  onStart?: () => void;
}

interface State {
  queue: Track[];
  index: number;
  playing: boolean;
  loading: boolean;
  error: string | null;
  pos: number;
  dur: number;
  rate: number;
}

const audio = typeof Audio !== "undefined" ? new Audio() : (null as unknown as HTMLAudioElement);
let state: State = { queue: [], index: -1, playing: false, loading: false, error: null, pos: 0, dur: 0, rate: 1 };
const listeners = new Set<() => void>();
let lastSave = 0;

const emit = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  updateMediaSession();
};
export const current = () => (state.index >= 0 ? state.queue[state.index] : null);

function saveProgress(force = false) {
  const t = current();
  if (!t || t.kind !== "podcast" || !Number.isFinite(audio.duration) || audio.currentTime < 5) return;
  if (!force && Date.now() - lastSave < 10_000) return;
  lastSave = Date.now();
  suneinStore.set((s) => {
    const progress = {
      ...s.progress,
      [t.key]: { pos: audio.currentTime, dur: audio.duration, title: t.title.slice(0, 300), show: t.sub.slice(0, 200), url: t.src, feedUrl: t.feedUrl, at: new Date().toISOString() },
    };
    const keys = Object.keys(progress).sort((x, y) => progress[y].at.localeCompare(progress[x].at));
    return { ...s, progress: Object.fromEntries(keys.slice(0, 100).map((k) => [k, progress[k]])) };
  });
}

function load(i: number) {
  saveProgress(true);
  const t = state.queue[i];
  if (!t) return stop();
  emit({ index: i, loading: true, error: null, pos: 0, dur: 0 });
  const sources = [t.src, ...(t.fallback ?? [])];
  const next = () => {
    const src = sources.shift();
    if (!src) return emit({ loading: false, playing: false, error: "This audio can't be played right now." });
    audio.src = src;
    audio.playbackRate = t.kind === "radio" ? 1 : state.rate;
    const saved = t.kind === "podcast" ? suneinStore.get().progress[t.key] : undefined;
    if (saved && saved.pos < saved.dur - 30) audio.addEventListener("loadedmetadata", () => (audio.currentTime = saved.pos), { once: true });
    audio.play().catch((e: Error) => {
      if (e.name === "AbortError") return;
      if (e.name === "NotAllowedError") return emit({ loading: false, playing: false, error: "Tap play to start." });
      next();
    });
  };
  audio.onerror = () => next();
  next();
  t.onStart?.();
}

if (audio) {
  audio.addEventListener("playing", () => emit({ playing: true, loading: false, error: null }));
  audio.addEventListener("pause", () => {
    saveProgress(true);
    emit({ playing: false });
  });
  audio.addEventListener("waiting", () => emit({ loading: true }));
  audio.addEventListener("timeupdate", () => {
    if (Math.abs(audio.currentTime - state.pos) >= 1) emit({ pos: audio.currentTime, dur: Number.isFinite(audio.duration) ? audio.duration : 0 });
    saveProgress();
  });
  audio.addEventListener("ended", () => {
    const t = current();
    if (t?.kind === "podcast")
      suneinStore.set((s) => {
        const rest = { ...s.progress };
        delete rest[t.key];
        return { ...s, progress: rest };
      });
    if (state.index + 1 < state.queue.length) load(state.index + 1);
    else emit({ playing: false });
  });
}

/** Lock-screen / notification controls via the browser Media Session API. */
function updateMediaSession() {
  const ms = navigator.mediaSession;
  const t = current();
  if (!ms) return;
  if (!t) {
    ms.metadata = null;
    return;
  }
  if (ms.metadata?.title !== t.title) ms.metadata = new MediaMetadata({ title: t.title, artist: t.sub, album: "Nisbat" });
  ms.playbackState = state.playing ? "playing" : "paused";
}
if (typeof navigator !== "undefined" && navigator.mediaSession) {
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", () => toggle());
  ms.setActionHandler("pause", () => toggle());
  ms.setActionHandler("nexttrack", () => skip(1));
  ms.setActionHandler("previoustrack", () => skip(-1));
  ms.setActionHandler("seekforward", () => seek(30));
  ms.setActionHandler("seekbackward", () => seek(-15));
}

export function play(queue: Track[], start = 0) {
  state = { ...state, queue };
  load(start);
}
export function toggle() {
  if (!current()) return;
  if (audio.paused) void audio.play().catch(() => undefined);
  else audio.pause();
}
export function skip(d: number) {
  const i = state.index + d;
  if (i >= 0 && i < state.queue.length) load(i);
}
export function seek(by: number) {
  if (current()?.kind === "radio" || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration - 1, audio.currentTime + by));
}
export function seekTo(pos: number) {
  if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration - 1, pos));
}
export function setRate(rate: number) {
  audio.playbackRate = rate;
  emit({ rate });
}
export function stop() {
  saveProgress(true);
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  emit({ queue: [], index: -1, playing: false, loading: false, error: null, pos: 0, dur: 0 });
}

export function usePlayer() {
  const [s, setS] = useState(state);
  useEffect(() => {
    const l = () => setS(state);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ...s, track: s.index >= 0 ? s.queue[s.index] : null };
}

export const fmtTime = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};
