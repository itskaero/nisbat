import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * `proxy.ts`, not `middleware.ts` — Next.js 16 deprecated and renamed the
 * `middleware` file convention (verified against
 * node_modules/next/dist/docs/.../file-conventions/proxy.md and
 * middleware.md; a `middleware.ts` file here would be silently ignored).
 *
 * This is the OPTIMISTIC check only (verifies the cookie's signature+expiry,
 * cheap, no DB — Proxy defaults to the Node.js runtime here so node:crypto is
 * available). It does not check `active` status, which requires a Postgres
 * lookup — that real, per-request check lives in the DAL
 * (src/lib/auth/dal.ts) and runs again in every route/page that actually
 * needs the user, per the Next.js docs' own recommendation not to rely on
 * Proxy alone for authorization.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/login")) return NextResponse.next();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // The original matcher only excluded framework-internal paths
  // (_next/static, _next/image, favicon.ico) — any other file served
  // straight out of public/ (logo.png, the default *.svg placeholders,
  // future fonts/icons) still matched, so an unauthenticated request for
  // one got redirected to /login instead of the actual file. Harmless
  // while nothing unauthenticated referenced a public/ asset; real once
  // the login page itself needed logo.png to render. Excluded by
  // extension rather than by name, so this doesn't need updating per file.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff2?|ttf)$).*)"],
};
