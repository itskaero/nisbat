"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Ayah } from "./editions";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * Verse-by-verse recitation player. Plays one ayah file at a time and moves on
 * to the next when one finishes; falls back to the API's secondary bitrate if
 * the primary file fails.
 */
export function useVersePlayer(ayahs: Ayah[] | undefined, onVerseFinished?: (index: number) => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<string>();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [rate, setRateState] = useState(1);
  const [continuous, setContinuous] = useState(true);
  const state = useRef({ index: null as number | null, triedSecondary: false, ayahs, continuous, onVerseFinished });
  state.current.ayahs = ayahs;
  state.current.continuous = continuous;
  state.current.onVerseFinished = onVerseFinished;

  const load = useCallback((i: number, autoplay: boolean) => {
    const audio = audioRef.current;
    const a = state.current.ayahs?.[i];
    if (!audio || !a) return;
    state.current.index = i;
    state.current.triedSecondary = false;
    setIndex(i);
    setTime(0);
    setDuration(0);
    setError(undefined);
    if (!a.audio) {
      setStatus("error");
      setError("No recitation audio is available for this verse from the selected reciter.");
      return;
    }
    audio.src = a.audio;
    if (autoplay) {
      setStatus("loading");
      audio.play().catch((e: Error) => {
        if (e.name === "AbortError") return;
        setStatus("error");
        setError(e.name === "NotAllowedError" ? "Your browser blocked playback. Press play to start." : "Couldn't start playback.");
      });
    } else {
      setStatus("paused");
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    const onPlaying = () => setStatus("playing");
    const onPause = () => setStatus((s) => (s === "error" || s === "idle" ? s : "paused"));
    const onWaiting = () => setStatus("loading");
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      const i = state.current.index;
      if (i == null) return;
      state.current.onVerseFinished?.(i);
      const total = state.current.ayahs?.length ?? 0;
      if (state.current.continuous && i + 1 < total) load(i + 1, true);
      else setStatus("idle");
    };
    const onError = () => {
      const i = state.current.index;
      const a = i != null ? state.current.ayahs?.[i] : undefined;
      if (!audio.src) return;
      if (a?.audioSecondary?.[0] && !state.current.triedSecondary) {
        state.current.triedSecondary = true;
        audio.src = a.audioSecondary[0];
        audio.play().catch(() => undefined);
        return;
      }
      setStatus("error");
      setError(navigator.onLine === false ? "You're offline — recitation audio needs a connection." : "This recitation couldn't be loaded. Try another reciter or verse.");
    };
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [load]);

  // Stop when the surah or reciter changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    state.current.index = null;
    setIndex(null);
    setStatus("idle");
    setError(undefined);
    setTime(0);
    setDuration(0);
  }, [ayahs]);

  const playAt = useCallback((i: number) => load(i, true), [load]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (state.current.index == null || !audio.src) {
      load(0, true);
      return;
    }
    if (audio.paused) {
      setError(undefined);
      audio.play().catch(() => {
        setStatus("error");
        setError("Couldn't start playback.");
      });
    } else audio.pause();
  }, [load]);

  const next = useCallback(() => {
    const i = state.current.index ?? -1;
    if (i + 1 < (state.current.ayahs?.length ?? 0)) load(i + 1, true);
  }, [load]);
  const prev = useCallback(() => {
    const i = state.current.index ?? 1;
    if (i - 1 >= 0) load(i - 1, true);
  }, [load]);

  const seek = useCallback((t: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(t)) audio.currentTime = t;
  }, []);
  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVolumeState(v);
  }, []);
  const setRate = useCallback((r: number) => {
    if (audioRef.current) {
      // defaultPlaybackRate survives src changes between verses.
      audioRef.current.defaultPlaybackRate = r;
      audioRef.current.playbackRate = r;
    }
    setRateState(r);
  }, []);
  const stop = useCallback(() => {
    audioRef.current?.pause();
    setStatus("idle");
  }, []);

  return { index, status, error, time, duration, volume, rate, continuous, setContinuous, playAt, toggle, next, prev, seek, setVolume, setRate, stop };
}

export type VersePlayer = ReturnType<typeof useVersePlayer>;
