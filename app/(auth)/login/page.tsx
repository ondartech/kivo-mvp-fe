"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { startGoogleOAuth } from "@/features/auth/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const { authorization_url, state, code_verifier } = await startGoogleOAuth(redirectUri);
      sessionStorage.setItem("kivo_oauth_state", state);
      sessionStorage.setItem("kivo_oauth_verifier", code_verifier);
      sessionStorage.setItem("kivo_oauth_redirect", redirectUri);
      window.location.href = authorization_url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start Google sign-in");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message || "Sign in failed");
      }
      if (body.access_token) localStorage.setItem("token", body.access_token);
      if (body.refresh_token) localStorage.setItem("refresh_token", body.refresh_token);
      const orgId = body?.memberships?.[0]?.organization_id;
      if (orgId) router.push(`/${orgId}/dashboard`);
      else if (next) router.push(next);
      else router.push("/onboarding");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-brand text-brand-foreground grid place-items-center font-semibold">K</div>
            <span className="font-semibold">Kivo</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to track what you’re owed.</p>
          </div>

          <GoogleButton onClick={handleGoogle} loading={googleLoading} />

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="sola@acme.ng" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot" className="text-xs text-muted-foreground underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline">
                Create one
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen grid place-items-center bg-background px-4"><div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" /></div>}>
      <LoginInner />
    </React.Suspense>
  );
}
