import { isSameOrigin } from "@/lib/server/devices";
import { publishScreenState } from "@/lib/remote/screens";
import { tvStateSchema } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";

/** The TV reports what it is showing, for phones watching it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 401 });
  const parsed = tvStateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid state" }, { status: 400 });
  publishScreenState((await params).id, parsed.data);
  return Response.json({ ok: true });
}
