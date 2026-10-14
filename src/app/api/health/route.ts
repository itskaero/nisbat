export const dynamic = "force-dynamic";

/** Liveness check used by autocast before it puts Nisbat on the TV. */
export function GET() {
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
