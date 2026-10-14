import { allowed } from "@/lib/server/devices";
import { listScreens } from "@/lib/remote/screens";

export const dynamic = "force-dynamic";

/** TVs that currently have Nisbat open. */
export async function GET(req: Request) {
  if (!(await allowed(req))) return Response.json({ error: "Not allowed" }, { status: 401 });
  return Response.json({ screens: listScreens() }, { headers: { "Cache-Control": "no-store" } });
}
