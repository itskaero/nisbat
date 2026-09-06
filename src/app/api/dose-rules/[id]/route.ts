import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/dal";

/** Defense in depth: system-sourced dose rules are never editable, even if a
 * client bypassed the UI guard — and now, writes require Faculty/Admin, with
 * publishing specifically requiring Admin, enforced here rather than trusting
 * the client's canAuthorContent/canPublishContent checks alone. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req, ["sr_faculty", "admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const existing = await prisma.doseRule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.source !== "faculty") {
    return NextResponse.json({ error: "System dose rules are not editable" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id: _drop, ...data } = body;
  void _drop;

  if (data.status === "published" && auth.user.role !== "admin" && existing.status !== "published") {
    return NextResponse.json({ error: "Only Admin can publish" }, { status: 403 });
  }

  const row = await prisma.doseRule.update({ where: { id }, data });
  return NextResponse.json(row);
}
