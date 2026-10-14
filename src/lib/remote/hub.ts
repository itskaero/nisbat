import "server-only";
import type { RemoteCommand, TvState } from "./protocol";

/**
 * In-memory relay between a TV screen and phone remotes, keyed by pairing code.
 * This lives in one server process: run Nisbat as a single long-lived Node
 * server (e.g. on a home PC/Raspberry Pi or one container), not on
 * multi-instance serverless hosting.
 */
type Sink = (event: string, data: unknown) => void;

interface Room {
  tvs: Set<Sink>;
  phones: Set<Sink>;
  state: TvState | null;
}

const g = globalThis as unknown as { __nisbatRemoteHub?: Map<string, Room> };
const rooms: Map<string, Room> = (g.__nisbatRemoteHub ??= new Map<string, Room>());

function room(code: string): Room {
  let r = rooms.get(code);
  if (!r) {
    r = { tvs: new Set(), phones: new Set(), state: null };
    rooms.set(code, r);
  }
  return r;
}

function cleanup(code: string) {
  const r = rooms.get(code);
  if (r && !r.tvs.size && !r.phones.size) rooms.delete(code);
}

export function joinAsTv(code: string, sink: Sink) {
  const r = room(code);
  r.tvs.add(sink);
  r.phones.forEach((p) => p("presence", { connected: true }));
  return () => {
    r.tvs.delete(sink);
    if (!r.tvs.size) {
      r.state = null;
      r.phones.forEach((p) => p("presence", { connected: false }));
    }
    cleanup(code);
  };
}

export function joinAsPhone(code: string, sink: Sink) {
  const r = room(code);
  r.phones.add(sink);
  sink("presence", { connected: r.tvs.size > 0 });
  if (r.state) sink("state", r.state);
  return () => {
    r.phones.delete(sink);
    cleanup(code);
  };
}

/** Returns false when no TV is listening on that code. */
export function sendToTv(code: string, command: RemoteCommand): boolean {
  const r = rooms.get(code);
  if (!r?.tvs.size) return false;
  r.tvs.forEach((tv) => tv("command", command));
  return true;
}

export function publishState(code: string, state: TvState) {
  const r = rooms.get(code);
  if (!r?.tvs.size) return;
  r.state = state;
  r.phones.forEach((p) => p("state", state));
}
