import "server-only";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dataDir, ensureDir } from "./data-dir";

/**
 * Trusted phones (the Nisbat Android app). A phone asks once; someone at home
 * allows it on the TV or the website (or the phone enters the household PIN),
 * and the phone receives a long random token it sends from then on. Only token
 * hashes are stored. Pending requests live in memory and expire after 10 min.
 */
export interface Device {
  id: string;
  name: string;
  platform: string;
  tokenHash: string;
  createdAt: string;
  lastSeen: string;
}
export type PublicDevice = Omit<Device, "tokenHash">;

interface PairingRequest {
  id: string;
  name: string;
  platform: string;
  createdAt: number;
  status: "pending" | "approved" | "denied";
  /** Plain token, kept only until the phone collects it (once). */
  token?: string;
  deviceId?: string;
}
export type PublicRequest = Pick<PairingRequest, "id" | "name" | "platform" | "status">;

interface DevicesFile {
  serverId: string;
  pinHash?: string;
  devices: Device[];
}

type Listener = (event: "pairing-request" | "pairing-resolved", req: PublicRequest) => void;

const REQUEST_TTL = 10 * 60_000;
const g = globalThis as unknown as {
  __nisbatDevices?: { file: DevicesFile | null; requests: Map<string, PairingRequest>; listeners: Set<Listener>; queue: Promise<unknown> };
};
const st = (g.__nisbatDevices ??= { file: null, requests: new Map<string, PairingRequest>(), listeners: new Set<Listener>(), queue: Promise.resolve() as Promise<unknown> });

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const filePath = () => dataDir("devices.json");

function save(): Promise<unknown> {
  st.queue = st.queue.then(async () => {
    await ensureDir(dataDir());
    const tmp = `${filePath()}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(st.file, null, 1));
    await rename(tmp, filePath());
  });
  return st.queue;
}

async function load(): Promise<DevicesFile> {
  if (st.file) return st.file;
  try {
    st.file = JSON.parse(await readFile(filePath(), "utf8")) as DevicesFile;
  } catch {
    st.file = { serverId: randomUUID(), devices: [] };
    await save();
  }
  return st.file;
}

function prune() {
  const now = Date.now();
  for (const [id, r] of st.requests) if (now - r.createdAt > REQUEST_TTL) st.requests.delete(id);
}

const toPublic = (r: PairingRequest): PublicRequest => ({ id: r.id, name: r.name, platform: r.platform, status: r.status });
const emit = (event: Parameters<Listener>[0], r: PairingRequest) => st.listeners.forEach((l) => l(event, toPublic(r)));
const stripHash = (d: Device): PublicDevice => ({ id: d.id, name: d.name, platform: d.platform, createdAt: d.createdAt, lastSeen: d.lastSeen });

export async function serverId() {
  return (await load()).serverId;
}

export function onPairingEvent(l: Listener) {
  st.listeners.add(l);
  return () => {
    st.listeners.delete(l);
  };
}

export function pendingRequests(): PublicRequest[] {
  prune();
  return [...st.requests.values()].filter((r) => r.status === "pending").map(toPublic);
}

export async function listDevices(): Promise<PublicDevice[]> {
  return (await load()).devices.map(stripHash);
}

async function issue(r: PairingRequest) {
  const f = await load();
  const token = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();
  const device: Device = { id: randomUUID(), name: r.name, platform: r.platform, tokenHash: sha(token), createdAt: now, lastSeen: now };
  f.devices.push(device);
  await save();
  r.status = "approved";
  r.token = token;
  r.deviceId = device.id;
}

async function checkPin(pin: string) {
  const f = await load();
  if (!f.pinHash) return false;
  return timingSafeEqual(Buffer.from(f.pinHash, "hex"), Buffer.from(sha(`nisbat-pin:${pin}`), "hex"));
}

/** A phone asks to be trusted. With the right household PIN it is trusted at once. */
export async function requestPairing(name: string, platform: string, pin?: string): Promise<PublicRequest> {
  prune();
  const r: PairingRequest = { id: randomUUID(), name, platform, createdAt: Date.now(), status: "pending" };
  st.requests.set(r.id, r);
  if (pin && (await checkPin(pin))) await issue(r);
  else emit("pairing-request", r);
  return toPublic(r);
}

/** The phone polls this; the token is handed over exactly once. */
export function collectRequest(id: string) {
  prune();
  const r = st.requests.get(id);
  if (!r) return null;
  const out = { status: r.status, token: r.token, deviceId: r.deviceId };
  if (r.status !== "pending") st.requests.delete(id);
  return out;
}

export async function resolveRequest(id: string, allow: boolean) {
  prune();
  const r = st.requests.get(id);
  if (!r || r.status !== "pending") return false;
  if (allow) await issue(r);
  else r.status = "denied";
  emit("pairing-resolved", r);
  return true;
}

export async function revokeDevice(id: string) {
  const f = await load();
  const before = f.devices.length;
  f.devices = f.devices.filter((d) => d.id !== id);
  if (f.devices.length === before) return false;
  await save();
  return true;
}

/** The trusted device presenting this token, or null. */
export async function verifyToken(token: string | null | undefined): Promise<PublicDevice | null> {
  if (!token || token.length < 20) return null;
  const f = await load();
  const h = Buffer.from(sha(token), "hex");
  const d = f.devices.find((x) => timingSafeEqual(Buffer.from(x.tokenHash, "hex"), h));
  if (!d) return null;
  if (Date.now() - Date.parse(d.lastSeen) > 60_000) {
    d.lastSeen = new Date().toISOString();
    void save();
  }
  return stripHash(d);
}

export function tokenFrom(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return new URL(req.url).searchParams.get("token");
}

export const deviceFrom = (req: Request) => verifyToken(tokenFrom(req));

/**
 * Pages served by Nisbat itself (website, TV app) are trusted as before: any
 * screen in the house may approve phones or control a TV. The Android app runs
 * on its own origin and must present a device token.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function allowed(req: Request) {
  return isSameOrigin(req) || !!(await deviceFrom(req));
}

export async function setPin(pin: string | null) {
  const f = await load();
  f.pinHash = pin ? sha(`nisbat-pin:${pin}`) : undefined;
  await save();
}

export async function hasPin() {
  return !!(await load()).pinHash;
}
