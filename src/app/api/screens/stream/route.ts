import { z } from "zod";
import { isSameOrigin, onPairingEvent, pendingRequests } from "@/lib/server/devices";
import { joinScreen } from "@/lib/remote/screens";
import { sseResponse } from "@/lib/server/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const params = z.object({ id: z.string().regex(/^[\w-]{6,64}$/), name: z.string().trim().min(1).max(40) });

/** A TV frontend's connection: receives remote commands and "allow this phone?" prompts. */
export async function GET(req: Request) {
  if (!isSameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const p = params.safeParse({ id: sp.get("id"), name: sp.get("name") });
  if (!p.success) return Response.json({ error: "Invalid screen" }, { status: 400 });
  return sseResponse(req, (send) => {
    const leave = joinScreen(p.data.id, p.data.name, send);
    for (const r of pendingRequests()) send("pairing-request", r);
    const off = onPairingEvent((event, r) => send(event, r));
    return () => {
      leave();
      off();
    };
  });
}
