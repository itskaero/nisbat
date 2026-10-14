import "server-only";

/**
 * "Show Nisbat on the TV now": the app or website posts a request and the
 * autocast service (subscribed to /api/cast/events) launches it right away
 * instead of waiting for its next check.
 */
export interface CastRequest {
  id: string;
  path: string;
  force: boolean;
  at: string;
}

type Listener = (req: CastRequest) => void;
const g = globalThis as unknown as { __nisbatCast?: Set<Listener> };
const listeners = (g.__nisbatCast ??= new Set<Listener>());

export function onCastRequest(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Returns how many casters received it (0 = autocast isn't running). */
export function requestCast(req: CastRequest): number {
  listeners.forEach((l) => l(req));
  return listeners.size;
}

export const castListenerCount = () => listeners.size;
