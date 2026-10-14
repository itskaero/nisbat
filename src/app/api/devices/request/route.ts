import { z } from "zod";
import { pendingRequests, requestPairing } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

const body = z.object({
  name: z.string().trim().min(1).max(40),
  platform: z.string().trim().max(30).default("android"),
  pin: z.string().regex(/^\d{4,8}$/).optional(),
});

/** A phone asks to be trusted. Someone at home allows it on the TV or website. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Give this phone a name." }, { status: 400 });
  if (pendingRequests().length >= 10) return Response.json({ error: "Too many phones are waiting. Try again in a few minutes." }, { status: 429 });
  const r = await requestPairing(parsed.data.name, parsed.data.platform, parsed.data.pin);
  return Response.json(r);
}
