import "server-only";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dataDir, ensureDir } from "./data-dir";

/**
 * Tiny file-backed key/value store for family-shared data. One JSON file per
 * key, written atomically (temp file + rename) and cached in memory. Designed
 * for one long-lived Nisbat server process (the same requirement as the
 * phone-remote relay).
 */
export interface Stored {
  version: number;
  updatedAt: string;
  data: unknown;
}

type Listener = (change: { key: string; version: number; origin?: string }) => void;

const g = globalThis as unknown as { __nisbatStore?: { cache: Map<string, Stored>; listeners: Set<Listener>; queue: Map<string, Promise<unknown>> } };
const state = (g.__nisbatStore ??= { cache: new Map(), listeners: new Set(), queue: new Map() });

function fileFor(key: string) {
  return dataDir("store", `${key}.json`);
}

export async function readKey(key: string): Promise<Stored> {
  const cached = state.cache.get(key);
  if (cached) return cached;
  try {
    const parsed = JSON.parse(await readFile(fileFor(key), "utf8")) as Stored;
    state.cache.set(key, parsed);
    return parsed;
  } catch {
    return { version: 0, updatedAt: "", data: null };
  }
}

/** Last-write-wins: every write bumps the version and notifies other devices. */
export async function writeKey(key: string, data: unknown, origin?: string): Promise<Stored> {
  // Serialise writes per key so versions stay monotonic.
  const prev = state.queue.get(key) ?? Promise.resolve();
  const run = prev.then(async () => {
    const current = await readKey(key);
    const next: Stored = { version: current.version + 1, updatedAt: new Date().toISOString(), data };
    await ensureDir(dataDir("store"));
    const file = fileFor(key);
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(next));
    await rename(tmp, file);
    state.cache.set(key, next);
    state.listeners.forEach((l) => l({ key, version: next.version, origin }));
    return next;
  });
  state.queue.set(key, run.catch(() => undefined));
  return run;
}

export function onStoreChange(listener: Listener) {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}
