"use client";

import { useSyncExternalStore } from "react";
import type { ZodType } from "zod";

/**
 * A small, versioned, schema-validated localStorage store.
 *
 * - Values are written as `{ v: <version>, data: <payload> }`.
 * - Reads are validated with a zod schema; malformed values fall back to the
 *   defaults (the bad payload is kept under `<key>:corrupt` for recovery).
 * - Older versions are passed through `migrate` before validation.
 * - Never touches `window` during server rendering.
 * - Syncs across tabs via the `storage` event.
 *
 * localStorage is the device's copy. Stores created with `sync: true` are also
 * shared with the family through the Nisbat server (lib/storage/sync.ts);
 * the local copy keeps working offline and catches up when reconnected.
 */
export interface PersistedStore<T> {
  key: string;
  defaults: T;
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
  /** Raw JSON-able payload for export. */
  exportData(): unknown;
  /** Replace contents from an exported payload. Returns false if invalid. */
  importData(data: unknown): boolean;
  /** Shared with the family through the Nisbat server (see lib/storage/sync.ts). */
  sync: boolean;
  /** Apply a value that came from the server; does not trigger a sync upload. */
  applyRemote(data: unknown): boolean;
  /** Called after every change made on this device (not for applyRemote). */
  onLocalChange(listener: () => void): () => void;
}

interface Options<T> {
  key: string;
  version: number;
  schema: ZodType<T>;
  defaults: T;
  migrate?: (data: unknown, fromVersion: number) => unknown;
  /** Applied to every read before validation, e.g. to fill newly added fields. */
  normalize?: (data: unknown) => unknown;
  /** Share this store across devices via the Nisbat server. */
  sync?: boolean;
}

const PREFIX = "nisbat:";
const registry: PersistedStore<unknown>[] = [];

export function allStores(): PersistedStore<unknown>[] {
  return registry;
}

export function createPersistedStore<T>(opts: Options<T>): PersistedStore<T> {
  const storageKey = PREFIX + opts.key;
  const listeners = new Set<() => void>();
  const localListeners = new Set<() => void>();
  let cache: T | undefined;

  const canUseStorage = () => {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  };

  const read = (): T => {
    if (!canUseStorage()) return opts.defaults;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      return opts.defaults;
    }
    if (raw == null) return opts.defaults;
    try {
      const parsed = JSON.parse(raw) as { v?: number; data?: unknown };
      let data = parsed?.data;
      const v = typeof parsed?.v === "number" ? parsed.v : 0;
      if (v !== opts.version) {
        if (!opts.migrate) throw new Error("version mismatch");
        data = opts.migrate(data, v);
      }
      if (opts.normalize) data = opts.normalize(data);
      const result = opts.schema.safeParse(data);
      if (!result.success) throw result.error;
      return result.data;
    } catch (err) {
      try {
        window.localStorage.setItem(storageKey + ":corrupt", raw);
      } catch {
        /* ignore quota errors */
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[nisbat] ignoring invalid stored data for "${opts.key}"`, err);
      }
      return opts.defaults;
    }
  };

  const write = (value: T) => {
    if (!canUseStorage()) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ v: opts.version, data: value }));
    } catch {
      /* storage full or blocked: keep in-memory value */
    }
  };

  const emit = () => listeners.forEach((l) => l());
  const emitLocal = () => localListeners.forEach((l) => l());

  const store: PersistedStore<T> = {
    key: opts.key,
    defaults: opts.defaults,
    get() {
      if (cache === undefined) cache = read();
      return cache;
    },
    set(next) {
      const prev = store.get();
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (Object.is(value, prev)) return;
      cache = value;
      write(value);
      emit();
      emitLocal();
    },
    reset() {
      cache = opts.defaults;
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      emit();
      emitLocal();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          cache = read();
          listener();
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    exportData() {
      return store.get();
    },
    importData(data) {
      const result = opts.schema.safeParse(data);
      if (!result.success) return false;
      store.set(result.data);
      return true;
    },
    sync: !!opts.sync,
    applyRemote(data) {
      const result = opts.schema.safeParse(opts.normalize ? opts.normalize(data) : data);
      if (!result.success) return false;
      cache = result.data;
      write(result.data);
      emit();
      return true;
    },
    onLocalChange(listener) {
      localListeners.add(listener);
      return () => localListeners.delete(listener);
    },
  };

  registry.push(store as PersistedStore<unknown>);
  return store;
}

/** Subscribe a component to a persisted store. SSR-safe. */
export function usePersisted<T>(store: PersistedStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.defaults);
}

/** True after the first client render (local data is available). */
const noopSubscribe = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function uid(prefix = ""): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${rand}`;
}
