import { deviceFrom } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

/** Lets the app check its token is still trusted. */
export async function GET(req: Request) {
  const device = await deviceFrom(req);
  if (!device) return Response.json({ error: "This phone is no longer trusted" }, { status: 401 });
  return Response.json(device, { headers: { "Cache-Control": "no-store" } });
}
