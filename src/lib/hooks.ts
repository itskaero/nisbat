"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { apiUrl, authHeaders } from "@/lib/api-base";

/** Current time, refreshed on an interval. `null` during SSR/hydration. */
const listeners = new Set<() => void>();
let nowValue = 0;
let timer: ReturnType<typeof setInterval> | undefined;
function subscribeNow(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    nowValue = Date.now();
    timer = setInterval(() => {
      nowValue = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): Date | null {
  const v = useSyncExternalStore(
    subscribeNow,
    () => nowValue || (nowValue = Date.now()),
    () => 0,
  );
  return v ? new Date(v) : null;
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Fetch JSON with loading/error state and abort on change. */
export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: !!url });
  const [nonce, setNonce] = useState(0);
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setState({ loading: false });
      return;
    }
    const ctrl = new AbortController();
    // Keep previous data while refreshing the same resource.
    setState((s) => ({ data: lastUrl.current === url ? s.data : undefined, loading: true }));
    lastUrl.current = url;
    fetch(apiUrl(url), { signal: ctrl.signal, headers: authHeaders() })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body?.error ?? `Request failed (${r.status})`);
        return body as T;
      })
      .then((data) => setState({ data, loading: false }))
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setState({ error: navigator.onLine === false ? "You appear to be offline." : e.message, loading: false });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, nonce, ...deps]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
