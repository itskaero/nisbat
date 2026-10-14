import { useEffect, useRef, useState } from "preact/hooks";

/**
 * Fetch with a last-known snapshot: the previous response is shown instantly
 * (so the TV paints a full screen in well under a second), then refreshed in
 * the background. Snapshots live in localStorage, capped to the newest 40.
 */
const PREFIX = "nisbat:tvc:";
const INDEX = "nisbat:tvc-index";
const MAX = 40;

interface Entry<T> {
  at: number;
  data: T;
}

function readEntry<T>(url: string): Entry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + url);
    return raw ? (JSON.parse(raw) as Entry<T>) : null;
  } catch {
    return null;
  }
}

function writeEntry<T>(url: string, data: T) {
  try {
    localStorage.setItem(PREFIX + url, JSON.stringify({ at: Date.now(), data }));
    const idx = (JSON.parse(localStorage.getItem(INDEX) ?? "[]") as string[]).filter((u) => u !== url);
    idx.unshift(url);
    for (const old of idx.splice(MAX)) localStorage.removeItem(PREFIX + old);
    localStorage.setItem(INDEX, JSON.stringify(idx));
  } catch {
    /* storage full: still works, just without a snapshot */
  }
}

export interface Cached<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  /** When the shown data was fetched (ms epoch). */
  at: number | null;
  reload: () => void;
}

/** `maxAgeMs`: snapshots younger than this are not refetched on mount. */
export function useCached<T>(url: string | null, maxAgeMs = 5 * 60_000, refreshEveryMs = 0): Cached<T> {
  const snap = url ? readEntry<T>(url) : null;
  const [state, setState] = useState<{ data?: T; at: number | null; error: string | null; loading: boolean }>(() => ({
    data: snap?.data,
    at: snap?.at ?? null,
    error: null,
    loading: !!url,
  }));
  const [nonce, setNonce] = useState(0);
  const lastUrl = useRef(url);

  useEffect(() => {
    if (!url) {
      setState({ at: null, error: null, loading: false });
      return;
    }
    if (lastUrl.current !== url) {
      lastUrl.current = url;
      const s = readEntry<T>(url);
      setState({ data: s?.data, at: s?.at ?? null, error: null, loading: true });
    }
    const fresh = readEntry<T>(url);
    if (nonce === 0 && fresh && Date.now() - fresh.at < maxAgeMs) {
      setState({ data: fresh.data, at: fresh.at, error: null, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${r.status})`);
        return body as T;
      })
      .then((data) => {
        if (cancelled) return;
        writeEntry(url, data);
        setState({ data, at: Date.now(), error: null, loading: false });
      })
      .catch((e: Error) => {
        // Keep showing the snapshot; only surface the error when there's nothing to show.
        if (!cancelled) setState((s) => ({ ...s, error: e.message, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [url, nonce, maxAgeMs]);

  useEffect(() => {
    if (!refreshEveryMs || !url) return;
    const t = setInterval(() => setNonce((n) => n + 1), refreshEveryMs);
    return () => clearInterval(t);
  }, [refreshEveryMs, url]);

  return { data: state.data, error: state.data ? null : state.error, loading: state.loading, at: state.at, reload: () => setNonce((n) => n + 1) };
}

/** Tick every `ms` (default 1 s) for clocks and countdowns. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
