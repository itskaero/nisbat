import { allowed } from "@/lib/server/devices";
import { watchScreen } from "@/lib/remote/screens";
import { sseResponse } from "@/lib/server/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A phone watches one TV: online/offline and what it is showing. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const { id } = await params;
  return sseResponse(req, (send) => watchScreen(id, send));
}
