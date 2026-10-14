import { NextResponse, type NextRequest } from "next/server";

/**
 * The Android app's UI is bundled in the APK and runs on its own local origin,
 * so it calls the Nisbat server cross-origin. Allow exactly those origins for
 * the API; everything else stays same-origin only.
 */
const APP_ORIGINS = new Set(["http://localhost", "https://localhost", "capacitor://localhost"]);

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || !APP_ORIGINS.has(origin)) return NextResponse.next();
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

export const config = { matcher: ["/api/:path*", "/backgrounds/:path*", "/groceries/:path*"] };
