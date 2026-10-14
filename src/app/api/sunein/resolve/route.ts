import { fetchUpstream, jsonError } from "@/lib/api/http";

export const revalidate = 86400;

/** Turn a YouTube channel link or @handle into its channel id (from the channel's public page). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const direct = /(UC[A-Za-z0-9_-]{22})/.exec(q)?.[1];
  let pageUrl: string | null = null;
  const handle = /^@?([A-Za-z0-9._-]{3,100})$/.exec(q)?.[1] ?? /youtube\.com\/@([A-Za-z0-9._-]{3,100})/.exec(q)?.[1];
  if (direct) pageUrl = `https://www.youtube.com/channel/${direct}`;
  else if (handle) pageUrl = `https://www.youtube.com/@${handle}`;
  if (!pageUrl) return jsonError("Paste a YouTube channel link or @handle", 400);
  try {
    const html = await (await fetchUpstream(pageUrl, { revalidate: 0, timeoutMs: 15000 })).text(); // page is >2 MB: too big for the data cache
    const id = direct ?? /"externalId":"(UC[A-Za-z0-9_-]{22})"/.exec(html)?.[1] ?? /channel\/(UC[A-Za-z0-9_-]{22})/.exec(html)?.[1];
    const title = /<meta property="og:title" content="([^"]+)"/.exec(html)?.[1] ?? handle ?? id;
    if (!id) return jsonError("Couldn't find that channel", 404);
    return Response.json({ id, title });
  } catch (err) {
    return jsonError(`Couldn't reach YouTube: ${(err as Error).message}`);
  }
}
