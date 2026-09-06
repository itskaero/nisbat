import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import type { UserRole } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const row = await prisma.appUser.findUnique({ where: { username } });
  // Same generic message whether the username doesn't exist or the password
  // is wrong — never reveal which one failed.
  if (!row || !row.active || !(await bcrypt.compare(password, row.passwordHash))) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  const res = NextResponse.json({
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    designation: row.designation,
    username: row.username,
    active: row.active,
  });
  res.cookies.set(SESSION_COOKIE, signSession(row.id), {
    httpOnly: true,
    // The app is LAN-only over plain HTTP (no TLS) so a phone on the same
    // Wi-Fi can reach it — `secure: true` would silently break login there.
    // See README's "Access from a phone" security note.
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
