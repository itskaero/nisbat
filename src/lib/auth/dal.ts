import { cache } from "react";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";
import type { AppUser, UserRole } from "@/types";

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  role: true,
  designation: true,
  username: true,
  active: true,
} as const;

/** Never let `passwordHash` reach a client-bound response — every read of
 * AppUser in a code path a client can observe goes through this `select`. */
export function publicUserSelect() {
  return PUBLIC_USER_SELECT;
}

async function loadUser(userId: string): Promise<AppUser | null> {
  const row = await prisma.appUser.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT });
  if (!row || !row.active) return null;
  return { ...row, role: row.role as UserRole };
}

/** Route Handlers — reads the session cookie straight off the NextRequest. */
export async function getSessionUserFromRequest(req: NextRequest): Promise<AppUser | null> {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return loadUser(session.userId);
}

/** Server Components / pages — reads the cookie via next/headers. Cached per
 * request so calling it from multiple components doesn't re-query Postgres. */
export const getSessionUser = cache(async (): Promise<AppUser | null> => {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const session = verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return loadUser(session.userId);
});

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; status: 401 | 403 };

/** Shared by src/lib/api/crud.ts and every bespoke route handler: 401 when
 * there's no valid session, 403 when there is one but the role doesn't
 * qualify, so callers can map each case to the right response. */
export async function authenticateRequest(req: NextRequest, roles?: UserRole[]): Promise<AuthResult> {
  const user = await getSessionUserFromRequest(req);
  if (!user) return { ok: false, status: 401 };
  if (roles && !roles.includes(user.role)) return { ok: false, status: 403 };
  return { ok: true, user };
}
