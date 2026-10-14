import { useEffect, useState } from "react";

/**
 * Tab + stack navigation, like a native app: each tab keeps its own history;
 * Android's back button pops the current stack, then returns to Home, then exits.
 */
export type Tab = "home" | "quran" | "namaz" | "saman" | "more";
export interface Page {
  name: string;
  params?: Record<string, string>;
}

const ROOT: Record<Tab, Page> = { home: { name: "home" }, quran: { name: "quran" }, namaz: { name: "namaz" }, saman: { name: "saman" }, more: { name: "more" } };

let tab: Tab = "home";
const stacks: Record<Tab, Page[]> = { home: [ROOT.home], quran: [ROOT.quran], namaz: [ROOT.namaz], saman: [ROOT.saman], more: [ROOT.more] };
let overlay: (() => void)[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Which tab a page belongs to when opened from elsewhere (e.g. Home cards). */
const HOME_TAB: Record<string, Tab> = { quran: "quran", reader: "quran", namaz: "namaz", saman: "saman" };

export function setTab(t: Tab) {
  if (t === tab) {
    stacks[t] = [ROOT[t]]; // tapping the active tab returns to its root
  }
  tab = t;
  emit();
}

export function push(page: Page) {
  const owner = HOME_TAB[page.name];
  if (owner && owner !== tab && stacks[owner].length === 1 && page.name === ROOT[owner].name) {
    tab = owner;
  } else {
    stacks[tab] = [...stacks[tab], page];
  }
  emit();
}

export function pop(): boolean {
  const close = overlay.pop();
  if (close) {
    close();
    return true;
  }
  if (stacks[tab].length > 1) {
    stacks[tab] = stacks[tab].slice(0, -1);
    emit();
    return true;
  }
  if (tab !== "home") {
    tab = "home";
    emit();
    return true;
  }
  return false;
}

/** Sheets and players register here so Back closes them first. */
export function pushOverlay(close: () => void) {
  overlay.push(close);
  return () => {
    overlay = overlay.filter((c) => c !== close);
  };
}

export function useNav() {
  const [, setN] = useState(0);
  useEffect(() => {
    const l = () => setN((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const stack = stacks[tab];
  return { tab, page: stack[stack.length - 1], depth: stack.length };
}
