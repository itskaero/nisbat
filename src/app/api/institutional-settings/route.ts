import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth/dal";

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id: _drop, ...data } = body;
  void _drop;
  const row = await prisma.institutionalSettings.update({ where: { id: "singleton" }, data });
  return NextResponse.json(row);
}
