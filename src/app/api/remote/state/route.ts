import { z } from "zod";
import { publishState } from "@/lib/remote/hub";
import { codeSchema, tvStateSchema } from "@/lib/remote/protocol";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({ code: codeSchema, state: tvStateSchema });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid state" }, { status: 400 });
  publishState(parsed.data.code, parsed.data.state);
  return Response.json({ ok: true });
}
