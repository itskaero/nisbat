import "server-only";
import type { RemoteCommand, TvState } from "./protocol";

/**
 * Named screens for the Android app. Each TV frontend registers a stable id
 * and a name ("Dining Room TV") while it is open; trusted phones list them and
 * send commands without typing a pairing code. In-memory, like the code relay
 * in hub.ts: run Nisbat as one long-lived server process.
 */
type Sink = (event: string, data: unknown) => void;

interface Screen {
  id: string;
  name: string;
  tvs: Set<Sink>;
  watchers: Set<Sink>;
  state: TvState | null;
  since: number;
}

export interface ScreenInfo {
  id: string;
  name: string;
  online: boolean;
  state: TvState | null;
}

const g = globalThis as unknown as { __nisbatScreens?: { screens: Map<string, Screen>; tvsAll: Set<Sink> } };
const st = (g.__nisbatScreens ??= { screens: new Map<string, Screen>(), tvsAll: new Set<Sink>() });

function get(id: string, name = "TV"): Screen {
  let s = st.screens.get(id);
  if (!s) {
    s = { id, name, tvs: new Set(), watchers: new Set(), state: null, since: Date.now() };
    st.screens.set(id, s);
  }
  return s;
}

const info = (s: Screen): ScreenInfo => ({ id: s.id, name: s.name, online: s.tvs.size > 0, state: s.tvs.size ? s.state : null });

export function listScreens(): ScreenInfo[] {
  return [...st.screens.values()].filter((s) => s.tvs.size).map(info);
}

export function screenInfo(id: string): ScreenInfo | null {
  const s = st.screens.get(id);
  return s ? info(s) : null;
}

/** A TV frontend connects; it receives commands (and pairing prompts via broadcastToTvs). */
export function joinScreen(id: string, name: string, sink: Sink) {
  const s = get(id, name);
  s.name = name;
  s.tvs.add(sink);
  st.tvsAll.add(sink);
  s.watchers.forEach((w) => w("screen", info(s)));
  return () => {
    s.tvs.delete(sink);
    st.tvsAll.delete(sink);
    if (!s.tvs.size) s.state = null;
    s.watchers.forEach((w) => w("screen", info(s)));
    if (!s.tvs.size && !s.watchers.size) st.screens.delete(id);
  };
}

/** A phone watches one screen's state. */
export function watchScreen(id: string, sink: Sink) {
  const s = get(id);
  s.watchers.add(sink);
  sink("screen", info(s));
  return () => {
    s.watchers.delete(sink);
    if (!s.tvs.size && !s.watchers.size) st.screens.delete(id);
  };
}

export function commandScreen(id: string, command: RemoteCommand): boolean {
  const s = st.screens.get(id);
  if (!s?.tvs.size) return false;
  s.tvs.forEach((tv) => tv("command", command));
  return true;
}

export function publishScreenState(id: string, state: TvState) {
  const s = st.screens.get(id);
  if (!s?.tvs.size) return;
  s.state = state;
  s.watchers.forEach((w) => w("screen", info(s)));
}

/** Send an event to every open TV frontend (e.g. "Allow this phone?"). */
export function broadcastToTvs(event: string, data: unknown) {
  st.tvsAll.forEach((tv) => tv(event, data));
}
