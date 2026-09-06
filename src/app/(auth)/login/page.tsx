"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const hydrate = useAppStore((s) => s.hydrate);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login(username.trim(), password);
      // populate the store from the now-authenticated session in the same
      // navigation, rather than making /dashboard's first render do it.
      await hydrate();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="login-waves" aria-hidden="true">
        <span />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-2 flex justify-center">
          <Logo variant="full" />
        </div>
        <Card className="shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <CardContent className="pt-5">
            <h1 className="mb-1 text-[16px] font-semibold text-foreground">Sign in</h1>
            <p className="mb-5 text-[13px] text-foreground-muted">Pediatric discharge workspace</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
