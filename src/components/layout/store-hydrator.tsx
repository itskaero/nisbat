"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import { Logo } from "@/components/layout/logo";

/**
 * Fetches everything from the server once on mount. Renders nothing itself
 * until hydrated — every page underneath reads live store state, so there's
 * no point rendering a shell with empty arrays first.
 *
 * The one route this skips entirely is /login: /api/bootstrap requires a
 * session (src/app/api/bootstrap/route.ts), so calling it pre-login would
 * always 401. A 401 from a route that *isn't* /login means the session's
 * signature is still valid (proxy.ts's cheap check already caught anything
 * with no cookie or a bad/expired signature) but the DB-backed check failed
 * — the account was deactivated mid-session. That distinction matters here:
 * the stale cookie must be cleared (via /api/auth/logout) *before*
 * redirecting to /login, or proxy.ts's own "already signed in → bounce away
 * from /login" check (still true, since the signature is still valid) would
 * immediately bounce the browser right back to a page that 401s again — an
 * infinite loop rather than landing on the login form.
 */
export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const [failed, setFailed] = React.useState(false);
  const isLoginRoute = pathname === "/login";

  React.useEffect(() => {
    if (isLoginRoute) return;
    hydrate().catch(async (err) => {
      if (err instanceof ApiError && err.status === 401) {
        await api.logout().catch(() => {});
        router.replace("/login");
        return;
      }
      setFailed(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginRoute]);

  if (isLoginRoute) return <>{children}</>;

  if (failed) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
        <Logo variant="full" />
        <p className="text-[14px] font-medium text-foreground">Can&apos;t reach the server</p>
        <p className="max-w-sm text-[13px] text-foreground-muted">
          Nisbat couldn&apos;t load data from the database. Make sure the local Postgres
          container is running (<code className="text-foreground-subtle">npm run db:up</code>)
          and the app server can reach it, then reload.
        </p>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Logo variant="full" />
        <p className="text-[13px] text-foreground-subtle">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
