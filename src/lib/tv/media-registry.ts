"use client";

/**
 * One place for "whatever is playing right now" so a TV remote, a phone remote
 * or hardware media keys can control it, and so the ambient screen knows not
 * to cover active playback.
 */
export interface MediaHandle {
  id: string;
  label: string;
  isPlaying: () => boolean;
  toggle: () => void;
  next?: () => void;
  prev?: () => void;
}

let active: MediaHandle | null = null;
const listeners = new Set<() => void>();

export function registerMedia(handle: MediaHandle) {
  active = handle;
  listeners.forEach((l) => l());
  return () => {
    if (active?.id === handle.id) {
      active = null;
      listeners.forEach((l) => l());
    }
  };
}

/** Call when a registered player changes play state. */
export function notifyMediaChange() {
  listeners.forEach((l) => l());
}

export function activeMedia(): MediaHandle | null {
  return active;
}

export function onMediaChange(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function mediaCommand(action: "toggle" | "next" | "prev"): boolean {
  if (!active) return false;
  if (action === "toggle") active.toggle();
  else if (action === "next") active.next?.();
  else active.prev?.();
  return true;
}
