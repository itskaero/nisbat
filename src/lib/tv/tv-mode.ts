"use client";

import { useSyncExternalStore } from "react";
import { usePersisted } from "@/lib/storage/persisted-store";
import { settingsStore } from "@/lib/storage/stores";

/** Chromecast (CrKey), Google TV / Android TV and other TV browsers. */
export function isTvUserAgent(ua: string): boolean {
  return /CrKey|Android TV|GoogleTV|Google TV|BRAVIA|AFT[A-Z]|SMART-TV|SmartTV|Tizen|Web0S|webOS/i.test(ua);
}

const SESSION_KEY = "nisbat:tv-session";

/**
 * `?tv=1` on any URL (e.g. the address cast to a Chromecast) forces the TV
 * layout for this browser session without changing saved settings; `?tv=0`
 * clears it.
 */
function readSessionFlag(): boolean {
  try {
    const p = new URLSearchParams(window.location.search).get("tv");
    if (p === "1") sessionStorage.setItem(SESSION_KEY, "1");
    if (p === "0") sessionStorage.removeItem(SESSION_KEY);
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

const noop = () => () => {};
let cached: { ua: boolean; flag: boolean } | null = null;
function envSnapshot() {
  if (!cached) cached = { ua: isTvUserAgent(navigator.userAgent), flag: readSessionFlag() };
  return cached;
}

export function useTvMode(): boolean {
  const { displayMode } = usePersisted(settingsStore);
  const env = useSyncExternalStore(noop, envSnapshot, () => null);
  if (displayMode === "tv") return true;
  if (displayMode === "standard") return false;
  return !!env && (env.ua || env.flag);
}

export function tvModeReason(): string {
  if (typeof window === "undefined") return "";
  const env = envSnapshot();
  return env.ua ? "TV browser detected" : env.flag ? "Opened with ?tv=1" : "Not detected";
}
