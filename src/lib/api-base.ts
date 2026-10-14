/**
 * Where the Nisbat server lives. The website and the TV app are served by the
 * server itself (same origin, base ""); the Android app sets the NAS address
 * and its device token at start-up.
 */
let base = "";
let token: string | null = null;

export function configureApi(opts: { base?: string; token?: string | null }) {
  if (opts.base !== undefined) base = opts.base.replace(/\/+$/, "");
  if (opts.token !== undefined) token = opts.token;
}

export const apiBase = () => base;
export const deviceToken = () => token;

/** Absolute URL for a server path ("/api/…"); unchanged for other URLs. */
export function apiUrl(path: string): string {
  return path.startsWith("/") ? base + path : path;
}

/** URL for an EventSource, which can't send headers: the token goes in the query. */
export function streamUrl(path: string): string {
  const url = apiUrl(path);
  return token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
}
