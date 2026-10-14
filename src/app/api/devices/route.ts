import { allowed, hasPin, listDevices, pendingRequests } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

/** Trusted phones and phones waiting for approval (Settings, Phones). */
export async function GET(req: Request) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  return Response.json({ devices: await listDevices(), pending: pendingRequests(), hasPin: await hasPin() });
}
