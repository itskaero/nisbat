import { z } from "zod";
import { sendToTv } from "@/lib/remote/hub";
import { codeSchema, remoteCommandSchema } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({ code: codeSchema, command: remoteCommandSchema });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid command" }, { status: 400 });
  if (!sendToTv(parsed.data.code, parsed.data.command)) {
    return Response.json({ error: "The TV isn't connected. Make sure Nisbat is open on the TV." }, { status: 409 });
  }
  return Response.json({ ok: true });
}
