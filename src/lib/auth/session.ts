import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A hand-rolled, HMAC-signed session cookie rather than iron-session/next-auth
 * — this app has 3 fixed roles and no OAuth/self-signup (PRODUCT.md rules
 * that out), so a small auditable helper fits better than a framework aimed
 * at provider-based auth. The payload only ever carries `userId` + `exp` —
 * nothing sensitive, so a signature (tamper-proofing) is enough; no need to
 * encrypt it. Role/active-status are deliberately NOT in the payload — they
 * are re-checked against Postgres on every request (see src/lib/auth/dal.ts)
 * so deactivating a user takes effect on their very next request, not at
 * next login.
 */

export const SESSION_COOKIE = "nisbat_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add one to .env — see .env.example (generate with `openssl rand -base64 32`).",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function signSession(userId: string): string {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verifies signature + expiry only — never trust `userId` alone without this. */
export function verifySession(cookieValue: string | undefined): { userId: string } | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  let expectedBuf: Buffer;
  let sigBuf: Buffer;
  try {
    expectedBuf = Buffer.from(sign(payload));
    sigBuf = Buffer.from(sig);
  } catch {
    return null;
  }
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") return null;
    if (Date.now() > parsed.exp) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}
