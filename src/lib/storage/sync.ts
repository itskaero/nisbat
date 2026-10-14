"use client";

import { useSyncExternalStore } from "react";
import { apiUrl, authHeaders, streamUrl } from "@/lib/api-base";
import { allStores, uid, type PersistedStore } from "./persisted-store";

/**
 * Family sync: keeps `sync: true` stores identical on every device (TV, phones,
 * laptops) through the Nisbat server.
 *
 * - Local changes are uploaded (debounced). The server bumps a version and
 *   broadcasts it over SSE; other devices download the new value.
 * - Conflicts are last-write-wins per store; a device with unsent changes keeps
 *   them and uploads them when it can.
 * - localStorage remains the offline copy; unsent changes retry every 30s and
 *   whenever the connection comes back.
 * - The first time a device joins, its existing local data is merged with the
 *   family's (union by id) instead of being overwritten.
 */

type Status = "connecting" | "synced" | "syncing" | "offline";
interface Meta {
  version: number;
  dirty: boolean;
}

const ORIGIN = typeof window === "undefined" ? "server" : uid("dev-");
let status: Status = "connecting";
let lastSyncedAt: string | null = null;
const statusListeners = new Set<() => void>();
function setStatus(s: Status) {
  status = s;
  if (s === "synced") lastSyncedAt = new Date().toISOString();
  statusListeners.forEach((l) => l());
}

const metaKey = (key: string) => `nisbat:sync:${key}`;
function loadMeta(key: string): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(metaKey(key)) ?? "null");
    if (m && typeof m.version === "number") return { version: m.version, dirty: !!m.dirty };
  } catch {
    /* ignore */
  }
  return { version: 0, dirty: false };
}
function saveMeta(key: string, m: Meta) {
  try {
    localStorage.setItem(metaKey(key), JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const hasId = (v: unknown): v is Obj & { id: string } => isObj(v) && typeof v.id === "string";

/** Union local + remote on first join; remote wins where both have a value. */
export function mergeFirstSync(local: unknown, remote: unknown): unknown {
  if (remote == null) return local;
  if (local == null) return remote;
  if (Array.isArray(local) && Array.isArray(remote)) {
    if (local.every(hasId) && remote.every(hasId)) {
      const byId = new Map<string, unknown>();
      for (const item of local) byId.set(item.id, item);
      for (const item of remote) byId.set(item.id, item);
      return [...byId.values()];
    }
    const seen = new Set(remote.map((x) => JSON.stringify(x)));
    return [...remote, ...local.filter((x) => !seen.has(JSON.stringify(x)))];
  }
  if (isObj(local) && isObj(remote)) {
    const out: Obj = { ...local };
    for (const [k, v] of Object.entries(remote)) out[k] = k in local ? mergeFirstSync(local[k], v) : v;
    return out;
  }
  return remote;
}

const isDefault = (store: PersistedStore<unknown>) => JSON.stringify(store.get()) === JSON.stringify(store.defaults);

let started = false;

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const stores = allStores().filter((s) => s.sync);
  const metas = new Map(stores.map((s) => [s.key, loadMeta(s.key)]));
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let inflight = 0;

  const done = (ok: boolean) => {
    inflight = Math.max(0, inflight - 1);
    if (!ok) setStatus("offline");
    else if (!inflight && ![...metas.values()].some((m) => m.dirty)) setStatus("synced");
  };

  async function push(store: PersistedStore<unknown>) {
    const meta = metas.get(store.key)!;
    inflight++;
    setStatus("syncing");
    try {
      const r = await fetch(apiUrl(`/api/store/${store.key}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ data: store.get(), origin: ORIGIN }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const { version } = await r.json();
      // Only clear dirty if nothing changed while uploading.
      meta.version = version;
      meta.dirty = timers.has(store.key);
      saveMeta(store.key, meta);
      done(true);
    } catch {
      done(false);
    }
  }

  async function pull(store: PersistedStore<unknown>) {
    const meta = metas.get(store.key)!;
    inflight++;
    try {
      const r = await fetch(apiUrl(`/api/store/${store.key}`), { cache: "no-store", headers: authHeaders() });
      if (!r.ok) throw new Error(String(r.status));
      const remote = (await r.json()) as { version: number; data: unknown };
      if (remote.version === 0) {
        // Nobody has shared this yet: seed it from this device.
        if (!isDefault(store) || meta.dirty) {
          meta.dirty = true;
          saveMeta(store.key, meta);
          void push(store);
        }
      } else if (meta.version === 0 && !isDefault(store)) {
        // First join with existing local data: merge, then share the result.
        store.applyRemote(mergeFirstSync(store.get(), remote.data));
        meta.version = remote.version;
        meta.dirty = true;
        saveMeta(store.key, meta);
        void push(store);
      } else if (remote.version > meta.version) {
        if (meta.dirty) void push(store);
        else {
          store.applyRemote(remote.data);
          meta.version = remote.version;
          saveMeta(store.key, meta);
        }
      } else if (meta.dirty) {
        void push(store);
      }
      done(true);
    } catch {
      done(false);
    }
  }

  for (const store of stores) {
    store.onLocalChange(() => {
      const meta = metas.get(store.key)!;
      meta.dirty = true;
      saveMeta(store.key, meta);
      clearTimeout(timers.get(store.key));
      timers.set(
        store.key,
        setTimeout(() => {
          timers.delete(store.key);
          void push(store);
        }, 600),
      );
    });
  }

  const pullAll = () => stores.forEach((s) => void pull(s));
  const es = new EventSource(streamUrl("/api/store/events"));
  es.addEventListener("open", pullAll);
  es.addEventListener("change", (e) => {
    const change = JSON.parse((e as MessageEvent).data) as { key: string; version: number; origin?: string };
    if (change.origin === ORIGIN) return;
    const store = stores.find((s) => s.key === change.key);
    const meta = metas.get(change.key);
    if (store && meta && change.version > meta.version) void pull(store);
  });
  es.addEventListener("error", () => setStatus("offline"));
  window.addEventListener("online", pullAll);
  setInterval(() => {
    for (const s of stores) if (metas.get(s.key)!.dirty && !timers.has(s.key)) void push(s);
  }, 30_000);
}

export function useSyncStatus() {
  const s = useSyncExternalStore(
    (cb) => (statusListeners.add(cb), () => statusListeners.delete(cb)),
    () => status,
    () => "connecting" as Status,
  );
  return { status: s, lastSyncedAt };
}
