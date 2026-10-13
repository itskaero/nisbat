import "server-only";

/**
 * Guard for user-supplied URLs the server will fetch (e.g. podcast feeds):
 * HTTPS on the default port, public DNS names only — no IP literals,
 * localhost or LAN-style names, so the home server can't be used to probe
 * the local network.
 */
export function publicHttpsUrl(raw: string | null): URL | null {
  if (!raw || raw.length > 500) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || (u.port && u.port !== "443") || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return null;
  if (/(^|\.)(localhost|local|lan|internal|home|corp|intranet)$/.test(host)) return null;
  return u;
}

export async function readCapped(res: Response, maxBytes = 5_000_000): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Feed is too large");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
