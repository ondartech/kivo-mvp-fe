"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { MicrosoftButton } from "@/components/auth/MicrosoftButton";
import { beginOAuth, type OAuthProvider } from "@/features/auth/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOAuthLoading] = React.useState<OAuthProvider | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    setError(null);
    setOAuthLoading(provider);
    try {
      const authorizationUrl = await beginOAuth(provider);
      window.location.href = authorizationUrl;
    } catch (e: unknown) {
      const providerName = provider === "google" ? "Google" : "Microsoft";
      setError(e instanceof Error ? e.message : `Failed to start ${providerName} sign-up`);
      setOAuthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || "Sign up failed");
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign up failed");
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
            <h1 className="text-lg font-semibold">Create your Kivo account</h1>
            <p className="text-sm text-muted-foreground">Start tracking what you’re owed.</p>
          </div>

          <div className="space-y-2">
            <GoogleButton
              onClick={() => handleOAuth("google")}
              loading={oauthLoading === "google"}
              disabled={oauthLoading !== null}
            />
            {env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED && (
              <MicrosoftButton
                onClick={() => handleOAuth("microsoft")}
                loading={oauthLoading === "microsoft"}
                disabled={oauthLoading !== null}
              />
            )}
          </div>

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="sola@acme.ng"
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
