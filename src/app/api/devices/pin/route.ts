import { z } from "zod";
import { allowed, setPin } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

const body = z.object({ pin: z.string().regex(/^\d{4,8}$/).nullable() });

/** Set (or clear) the household PIN a phone can enter instead of waiting for approval. */
export async function PUT(req: Request) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The PIN must be 4 to 8 digits." }, { status: 400 });
  await setPin(parsed.data.pin);
  return Response.json({ ok: true });
}
