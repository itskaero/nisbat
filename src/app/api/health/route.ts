import { serverId } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

/** Liveness + identity. Used by autocast before casting and by the Android app to find the server. */
export async function GET() {
  return Response.json(
    { ok: true, app: "nisbat", name: process.env.NISBAT_NAME || "Nisbat Home", id: await serverId(), version: 2 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
