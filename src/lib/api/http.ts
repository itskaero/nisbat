import "server-only";

export class UpstreamError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

const UA = "NisbatHome/0.1 (+personal dashboard; respects publisher feeds)";

/** Server-side fetch with timeout and Next.js data-cache revalidation. */
export async function fetchUpstream(
  url: string,
  { revalidate = 600, timeoutMs = 10_000, accept }: { revalidate?: number; timeoutMs?: number; accept?: string } = {},
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, ...(accept ? { Accept: accept } : {}) },
      next: { revalidate },
    });
    if (!res.ok) throw new UpstreamError(`Upstream responded ${res.status}`, res.status);
    return res;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if ((err as Error).name === "AbortError") throw new UpstreamError("Upstream timed out");
    throw new UpstreamError("Upstream unreachable");
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<T>(url: string, opts?: Parameters<typeof fetchUpstream>[1]): Promise<T> {
  const res = await fetchUpstream(url, { accept: "application/json", ...opts });
  return (await res.json()) as T;
}

export function jsonError(message: string, status = 502) {
  return Response.json({ error: message }, { status });
}
