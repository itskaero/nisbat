import { onCastRequest } from "@/lib/server/cast";
import { sseResponse } from "@/lib/server/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The autocast service listens here for "show on TV now" requests. */
export async function GET(req: Request) {
  return sseResponse(req, (send) => onCastRequest((r) => send("cast", r)));
}
