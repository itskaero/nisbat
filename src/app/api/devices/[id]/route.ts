import { allowed, revokeDevice } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

/** Stop trusting a phone. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const ok = await revokeDevice((await params).id);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "Unknown phone" }, { status: 404 });
}
