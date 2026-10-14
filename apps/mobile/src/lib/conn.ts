import { useEffect, useState } from "react";
import { configureApi } from "@/lib/api-base";
import { NisbatDiscovery, getPref, isNative, setPref, type FoundService } from "./native";

/**
 * The connection to the family's Nisbat server: its address on the home
 * network and this phone's device token (from the approve-once pairing).
 */
export interface Connection {
  base: string;
  token: string;
  serverName: string;
  serverId: string;
  phoneName: string;
}

let conn: Connection | null = null;
const listeners = new Set<() => void>();

export async function loadConnection(): Promise<Connection | null> {
  const raw = await getPref("connection");
  if (!raw) return null;
  try {
    conn = JSON.parse(raw) as Connection;
    configureApi({ base: conn.base, token: conn.token });
    return conn;
  } catch {
    return null;
  }
}

export async function saveConnection(c: Connection | null) {
  conn = c;
  configureApi({ base: c?.base ?? "", token: c?.token ?? null });
  await setPref("connection", c ? JSON.stringify(c) : null);
  listeners.forEach((l) => l());
}

export const connection = () => conn;

export function useConnection() {
  const [c, setC] = useState(conn);
  useEffect(() => {
    const l = () => setC(conn);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return c;
}

/* Finding the server ------------------------------------------------------ */

export interface ServerInfo {
  base: string;
  name: string;
  id: string;
}

/** Only home-network addresses: the app never sends the family's data to the internet. */
export function isHomeAddress(host: string) {
  if (/\.local$/i.test(host) || /^[a-z0-9-]+$/i.test(host)) return true;
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a === 127;
}

export function normaliseAddress(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  try {
    const u = new URL(s);
    if (!isHomeAddress(u.hostname)) return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export async function probe(base: string, timeoutMs = 2500): Promise<ServerInfo | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${base}/api/health`, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { ok?: boolean; app?: string; name?: string; id?: string };
    if (!j.ok || (j.app && j.app !== "nisbat")) return null;
    return { base, name: j.name ?? "Nisbat Home", id: j.id ?? base };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Find Nisbat on the Wi-Fi: the server's own announcement (mDNS) first, then
 * a quick sweep of the phone's subnet on Nisbat's usual ports.
 */
export async function discover(onProgress?: (msg: string) => void): Promise<ServerInfo[]> {
  const found = new Map<string, ServerInfo>();
  const add = (s: ServerInfo | null) => s && found.set(s.id, s);

  if (isNative) {
    onProgress?.("Looking for Nisbat on your Wi-Fi…");
    try {
      const { services } = await NisbatDiscovery.discover({ timeoutMs: 4000 });
      const results = await Promise.all(services.map((s: FoundService) => probe(`http://${s.host}:${s.port}`)));
      results.forEach(add);
    } catch {
      /* mDNS unavailable on this network */
    }
  }
  if (found.size) return [...found.values()];

  let ip: string | null = null;
  if (isNative) {
    try {
      ip = (await NisbatDiscovery.localAddress()).ip;
    } catch {
      /* ignore */
    }
  }
  const prefixes = ip ? [ip.split(".").slice(0, 3).join(".")] : ["192.168.1", "192.168.0", "10.0.0"];
  for (const prefix of prefixes) {
    onProgress?.(`Checking ${prefix}.x…`);
    const hosts = Array.from({ length: 254 }, (_, i) => `${prefix}.${i + 1}`);
    const ports = [3080, 3000];
    // 48 probes at a time keeps the sweep to a few seconds.
    for (let i = 0; i < hosts.length; i += 24) {
      const batch = hosts.slice(i, i + 24).flatMap((h) => ports.map((p) => probe(`http://${h}:${p}`, 900)));
      (await Promise.all(batch)).forEach(add);
      if (found.size) return [...found.values()];
    }
  }
  return [...found.values()];
}

/* Pairing (approve once) --------------------------------------------------- */

export type PairState = { status: "waiting"; requestId: string } | { status: "approved"; token: string } | { status: "denied" | "expired" };

export async function requestPairing(base: string, name: string, pin?: string): Promise<PairState> {
  const r = await fetch(`${base}/api/devices/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, platform: "android", ...(pin ? { pin } : {}) }),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; status?: string; error?: string };
  if (!r.ok || !j.id) throw new Error(j.error ?? "Nisbat didn't accept the request");
  return checkPairing(base, j.id);
}

export async function checkPairing(base: string, requestId: string): Promise<PairState> {
  const r = await fetch(`${base}/api/devices/request/${requestId}`, { cache: "no-store" });
  if (r.status === 404) return { status: "expired" };
  const j = (await r.json()) as { status: string; token?: string };
  if (j.status === "approved" && j.token) return { status: "approved", token: j.token };
  if (j.status === "denied") return { status: "denied" };
  return { status: "waiting", requestId };
}
