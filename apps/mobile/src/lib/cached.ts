import { useEffect, useRef, useState } from "react";
import { apiUrl, authHeaders } from "@/lib/api-base";

/**
 * Offline-first fetch: shows the last response instantly (even with no Wi-Fi),
 * then refreshes from the Nisbat server. Snapshots are capped to the newest 60.
 */
const PREFIX = "nisbat:mc:";
const INDEX = "nisbat:mc-index";
const MAX = 60;

function read<T>(url: string): { at: number; data: T } | null {
  try {
    const raw = localStorage.getItem(PREFIX + url);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write<T>(url: string, data: T) {
  try {
    localStorage.setItem(PREFIX + url, JSON.stringify({ at: Date.now(), data }));
    const idx = (JSON.parse(localStorage.getItem(INDEX) ?? "[]") as string[]).filter((u) => u !== url);
    idx.unshift(url);
    for (const old of idx.splice(MAX)) localStorage.removeItem(PREFIX + old);
    localStorage.setItem(INDEX, JSON.stringify(idx));
  } catch {
    /* full */
  }
}

export interface Cached<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  at: number | null;
  reload: () => void;
}

export function useCached<T>(path: string | null, maxAgeMs = 5 * 60_000): Cached<T> {
  const [state, setState] = useState(() => {
    const s = path ? read<T>(path) : null;
    return { data: s?.data, at: s?.at ?? null, error: null as string | null, loading: !!path };
  });
  const [nonce, setNonce] = useState(0);
  const last = useRef(path);

  useEffect(() => {
    if (!path) {
      setState({ data: undefined, at: null, error: null, loading: false });
      return;
    }
    if (last.current !== path) {
      last.current = path;
      const s = read<T>(path);
      setState({ data: s?.data, at: s?.at ?? null, error: null, loading: true });
    }
    const snap = read<T>(path);
    if (nonce === 0 && snap && Date.now() - snap.at < maxAgeMs) {
      setState({ data: snap.data, at: snap.at, error: null, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetch(apiUrl(path), { cache: "no-store", headers: authHeaders() })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${r.status})`);
        return body as T;
      })
      .then((data) => {
        if (cancelled) return;
        write(path, data);
        setState({ data, at: Date.now(), error: null, loading: false });
      })
      .catch((e: Error) => {
        if (!cancelled) setState((s) => ({ ...s, error: navigator.onLine === false ? "You're offline." : e.message === "Failed to fetch" ? "Can't reach Nisbat on this Wi-Fi." : e.message, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, nonce, maxAgeMs]);

  return { data: state.data, error: state.data ? null : state.error, loading: state.loading, at: state.at, reload: () => setNonce((n) => n + 1) };
}

/** JSON request to the Nisbat server with this phone's token. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch(apiUrl(path), {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: authHeaders(init?.body ? { "Content-Type": "application/json" } : undefined),
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${r.status})`);
  return body as T;
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
