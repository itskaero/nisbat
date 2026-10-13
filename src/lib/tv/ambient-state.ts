"use client";

import { useSyncExternalStore } from "react";

export const ACTIVITY_EVENT = "nisbat:activity";

/** Signals user activity (keys, remote commands) to the ambient-screen timer. */
export function markActivity() {
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

let open = false;
const listeners = new Set<() => void>();

export function setAmbientOpen(v: boolean) {
  if (open === v) return;
  open = v;
  listeners.forEach((l) => l());
}

export function isAmbientOpen() {
  return open;
}

export function useAmbientOpen() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => open,
    () => false,
  );
}
