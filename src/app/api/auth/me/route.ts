import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/dal";

/** Lightweight "am I still logged in" check — the store's own hydrate() gets
 * its current-user identity from /api/bootstrap in the same round trip, so
 * this route exists for callers that just need identity, not the full data
 * set (e.g. a future retry/health check). */
export async function GET(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user);
}
