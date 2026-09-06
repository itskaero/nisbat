import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, publicUserSelect } from "@/lib/auth/dal";

/** Admin-only. Patches `active` (deactivate/reactivate — never a hard delete,
 * per CLAUDE.md), `name`/`role`/`designation`, and optionally a new
 * `password` (hashed here, never accepted as `passwordHash` directly). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.designation === "string") data.designation = body.designation.trim();
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.role === "string" && ["pgr_mo", "sr_faculty", "admin"].includes(body.role)) data.role = body.role;
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  try {
    const row = await prisma.appUser.update({ where: { id }, data, select: publicUserSelect() });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
