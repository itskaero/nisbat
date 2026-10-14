import { z } from "zod";
import { allowed, resolveRequest } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

const body = z.object({ allow: z.boolean() });

/** Allow or deny a waiting phone (from the TV prompt or Settings). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const ok = await resolveRequest((await params).id, parsed.data.allow);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "That request has expired" }, { status: 404 });
}
