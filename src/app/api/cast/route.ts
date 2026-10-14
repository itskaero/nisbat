import { randomUUID } from "node:crypto";
import { z } from "zod";
import { allowed } from "@/lib/server/devices";
import { requestCast } from "@/lib/server/cast";
import { commandScreen, listScreens } from "@/lib/remote/screens";
import { REMOTE_PATHS } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";

const body = z.object({ path: z.enum(REMOTE_PATHS).default("/"), force: z.boolean().default(false) });

/**
 * "Show on TV". If a TV already has Nisbat open it just switches screen;
 * otherwise the autocast service launches Nisbat on the Chromecast now.
 */
export async function POST(req: Request) {
  if (!(await allowed(req))) return Response.json({ error: "This phone isn't trusted yet" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { path, force } = parsed.data;
  const online = listScreens();
  for (const s of online) commandScreen(s.id, { type: "navigate", path });
  const casters = requestCast({ id: randomUUID(), path, force, at: new Date().toISOString() });
  if (!online.length && !casters) {
    return Response.json({ error: "Nisbat isn't open on any TV and the autocast service isn't running." }, { status: 503 });
  }
  return Response.json({ ok: true, switched: online.length, casters });
}
