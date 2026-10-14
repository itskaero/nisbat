// Shared code is written against React/Next types; these bridge the gaps
// when it is type-checked with Preact (runtime behaviour is identical).
import "preact/compat";

declare module "preact/compat" {
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
}

declare global {
  interface RequestInit {
    /** Next.js data-cache options (server-only code, never runs here). */
    next?: { revalidate?: number | false; tags?: string[] };
  }
}
