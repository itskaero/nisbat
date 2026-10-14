import { useEffect, useState } from "preact/hooks";

/**
 * Hash routing ("/screen#/quran?s=2"): the Chromecast loads the app once and
 * every screen change after that is an in-page transition — no reloads. The
 * app keeps its own back stack (TV "Back" = previous screen, then Home).
 */
export interface Route {
  path: string;
  query: URLSearchParams;
  href: string;
}

function parse(href: string): Route {
  const raw = href || "/";
  const [p, q = ""] = raw.split("?");
  return { path: p || "/", query: new URLSearchParams(q), href: raw };
}

const fromHash = () => parse(location.hash.replace(/^#/, ""));

let current = fromHash();
const stack: string[] = [current.href];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(href: string) {
  current = parse(href);
  history.replaceState(null, "", `#${current.href}`);
  emit();
}

// Typed into the URL or set by DashCast/autocast.
window.addEventListener("hashchange", () => {
  const r = fromHash();
  if (r.href === current.href) return;
  stack.push(r.href);
  current = r;
  emit();
});

export const route = () => current;

export function navigate(href: string) {
  const target = href.startsWith("/") ? href : `/${href}`;
  if (target === current.href) return;
  // Opening a top-level screen from Home resets the stack, like a launcher.
  if (target === "/") stack.length = 0;
  stack.push(target);
  if (stack.length > 30) stack.splice(0, stack.length - 30);
  set(target);
}

/** Back: previous screen, or Home. Returns false when already Home. */
export function goBack(): boolean {
  if (current.path === "/" && stack.length <= 1) return false;
  stack.pop();
  const prev = stack[stack.length - 1] ?? "/";
  if (!stack.length) stack.push("/");
  set(prev);
  return true;
}

export function useRoute(): Route {
  const [r, setR] = useState(current);
  useEffect(() => {
    const l = () => setR(current);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return r;
}
