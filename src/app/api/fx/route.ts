import { jsonError } from "@/lib/api/http";
import { getFx } from "@/lib/server/fx";

export const dynamic = "force-dynamic";

/** PKR exchange rates: SBP official (when a PakDataHub key is configured) and an open reference rate. */
export async function GET() {
  try {
    return Response.json(await getFx(), { headers: { "Cache-Control": "private, max-age=600" } });
  } catch (err) {
    return jsonError(`Exchange rates are unavailable: ${(err as Error).message}`);
  }
}
