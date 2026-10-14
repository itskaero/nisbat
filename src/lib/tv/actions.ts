"use client";

import { mediaCommand } from "./media-registry";
import { focusables, focusElement, moveFocus, type Direction } from "./spatial-nav";

export type RemoteKey = Direction | "ok" | "back" | "home";

type Router = { push: (href: string) => void; back: () => void };

/** Close the top-most layer (dialog, popover); returns true if something closed. */
export function closeTopLayer(): boolean {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")];
  const top = dialogs.at(-1);
  if (top) {
    // Our dialogs close themselves from their `cancel` handler.
    top.dispatchEvent(new Event("cancel", { cancelable: true }));
    return true;
  }
  const popover = document.querySelector<HTMLElement>("[data-popover-open]");
  if (popover) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    return true;
  }
  return false;
}

export function goBack(router: Router) {
  if (closeTopLayer()) return;
  if (window.location.pathname === "/") return;
  if (window.history.length > 1) router.back();
  else router.push("/");
}

export function activate() {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) {
    const first = focusables()[0];
    if (first) focusElement(first);
    return;
  }
  if (el instanceof HTMLSelectElement) {
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
    return;
  }
  if (el instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit"].includes(el.type)) {
    el.focus();
    return;
  }
  if (el instanceof HTMLVideoElement) {
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
    return;
  }
  el.click();
}

export function runKey(key: RemoteKey, router: Router) {
  switch (key) {
    case "ok":
      return activate();
    case "back":
      return goBack(router);
    case "home":
      closeTopLayer();
      return router.push("/");
    default:
      moveFocus(key);
  }
}

export { mediaCommand };
