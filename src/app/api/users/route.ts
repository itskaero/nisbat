import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, publicUserSelect } from "@/lib/auth/dal";
import { genId } from "@/lib/utils";

/** Admin-only, and bespoke rather than the generic factory: the incoming
 * body carries a plaintext `password` that must be hashed here and never
 * echoed back — the generic createHandler writes `data` straight through. */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req, ["admin"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role;
  const designation = typeof body?.designation === "string" ? body.designation.trim() : "";

  if (!name || !username || !password || !designation) {
    return NextResponse.json({ error: "Name, username, password, and designation are required" }, { status: 400 });
  }
  if (!["pgr_mo", "sr_faculty", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const row = await prisma.appUser.create({
      data: { id: genId("u"), name, username, passwordHash, role, designation, active: true },
      select: publicUserSelect(),
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
