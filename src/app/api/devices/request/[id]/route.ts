import { collectRequest } from "@/lib/server/devices";

export const dynamic = "force-dynamic";

/** The phone polls its request. Once approved, the token is returned exactly once. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = collectRequest((await params).id);
  if (!r) return Response.json({ status: "expired" }, { status: 404 });
  return Response.json(r, { headers: { "Cache-Control": "no-store" } });
}
