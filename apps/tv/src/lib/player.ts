import { useEffect, useState } from "preact/hooks";
import { registerMedia, notifyMediaChange } from "@/lib/tv/media-registry";
import { suneinStore } from "@/lib/storage/stores";

/**
 * One audio element for the whole TV app: Quran recitation, podcasts and
 * radio. Registered with the media registry so the phone remote's play/pause
 * and next/previous work, and so the ambient screen never covers playback.
 * Podcast positions are saved in the family's shared Sunein store (same keys
 * as the website), so "continue listening" works across every screen.
 */
export interface Track {
  /** Podcast progress key (`${feedUrl}#${episodeId}`) or any unique id. */
  key: string;
  src: string;
  fallback?: string[];
  title: string;
  sub: string;
  kind: "quran" | "podcast" | "radio";
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
}

const audio = new Audio();
audio.preload = "auto";
let state: State = { queue: [], index: -1, playing: false, loading: false, error: null, pos: 0, dur: 0 };
const listeners = new Set<() => void>();
let unregister: (() => void) | null = null;
let lastSave = 0;

function emit(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  notifyMediaChange();
}

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
  let sources = [t.src, ...(t.fallback ?? [])];
  const tryNext = () => {
    const src = sources.shift();
    if (!src) return emit({ loading: false, playing: false, error: "This audio can't be played right now." });
    audio.src = src;
    const saved = t.kind === "podcast" ? suneinStore.get().progress[t.key] : undefined;
    if (saved && saved.pos < saved.dur - 30) audio.addEventListener("loadedmetadata", () => (audio.currentTime = saved.pos), { once: true });
    audio.play().catch((e: Error) => {
      if (e.name === "AbortError") return;
      if (e.name === "NotAllowedError") return emit({ loading: false, playing: false, error: "Press OK to start playback." });
      tryNext();
    });
  };
  audio.onerror = () => tryNext();
  tryNext();
  t.onStart?.();
  unregister?.();
  unregister = registerMedia({
    id: "tv-player",
    label: `${t.title} — ${t.sub}`,
    isPlaying: () => state.playing,
    toggle,
    next: () => skip(1),
    prev: () => skip(-1),
  });
}

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
  if (t?.kind === "podcast") {
    // Finished: forget the position so it isn't offered as "continue".
    suneinStore.set((s) => {
      const rest = { ...s.progress };
      delete rest[t.key];
      return { ...s, progress: rest };
    });
  }
  if (state.index + 1 < state.queue.length) load(state.index + 1);
  else emit({ playing: false });
});

/** Play a list of tracks starting at `start`. */
export function play(queue: Track[], start = 0) {
  state = { ...state, queue };
  load(start);
}

export function toggle() {
  if (!current()) return;
  if (audio.paused) void audio.play().catch(() => undefined);
  else audio.pause();
}

export function skip(delta: number) {
  const i = state.index + delta;
  if (i >= 0 && i < state.queue.length) load(i);
}

export function seek(by: number) {
  if (current()?.kind === "radio" || !Number.isFinite(audio.duration)) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration - 1, audio.currentTime + by));
}

export function stop() {
  saveProgress(true);
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  unregister?.();
  unregister = null;
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
