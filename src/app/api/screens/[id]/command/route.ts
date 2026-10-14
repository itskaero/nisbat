import { allowed } from "@/lib/server/devices";
import { commandScreen } from "@/lib/remote/screens";
import { remoteCommandSchema } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";

/** Send a remote command (D-pad, navigate, type...) to a TV. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed(req))) return Response.json({ error: "This phone isn't trusted yet" }, { status: 401 });
  const parsed = remoteCommandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid command" }, { status: 400 });
  if (!commandScreen((await params).id, parsed.data)) return Response.json({ error: "That TV isn't showing Nisbat right now" }, { status: 409 });
  return Response.json({ ok: true });
}
