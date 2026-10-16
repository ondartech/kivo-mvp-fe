"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { MicrosoftButton } from "@/components/auth/MicrosoftButton";
import {
  beginOAuth, startLoginChallenge, completeLoginChallenge,
  type LoginChallengeStart, type OAuthProvider,
} from "@/features/auth/api";
import { LoginChallenge } from "@/features/auth/login-challenge";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { writeExperienceScope } from "@/lib/experience/ask-runtime";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOAuthLoading] = React.useState<OAuthProvider | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [challengeRequired, setChallengeRequired] = React.useState(false);
  const [challenge, setChallenge] = React.useState<LoginChallengeStart | null>(null);
  const [challengeProof, setChallengeProof] = React.useState<string | null>(null);
  const [challengeBusy, setChallengeBusy] = React.useState(false);

  const beginChallenge = async () => {
    setChallengeBusy(true);
    setError(null);
    setChallengeProof(null);
    try {
      setChallenge(await startLoginChallenge(email));
    } catch {
      setError("Verification cannot start right now. Please try again later.");
    } finally {
      setChallengeBusy(false);
    }
  };

  const acceptChallengeResponse = React.useCallback(async (token: string) => {
    if (!challenge) return;
    setChallengeBusy(true);
    try {
      const result = await completeLoginChallenge(email, challenge, token);
      setChallengeProof(result.login_proof);
      setChallengeRequired(false);
      setChallenge(null);
      setError(null);
    } catch {
      setChallenge(null);
      setChallengeRequired(true);
      setError("Verification was unsuccessful. Please start a new challenge.");
    } finally {
      setChallengeBusy(false);
    }
  }, [email, challenge]);

  const failChallenge = React.useCallback(() => {
    setChallenge(null);
    setChallengeProof(null);
    setChallengeRequired(true);
    setError("Verification expired or could not load. Please try again.");
  }, []);

  const handleOAuth = async (provider: OAuthProvider) => {
    setError(null);
    setOAuthLoading(provider);
    try {
      const authorizationUrl = await beginOAuth(provider);
      window.location.href = authorizationUrl;
    } catch (e: any) {
      const providerName = provider === "google" ? "Google" : "Microsoft";
      setError(e?.message || `Failed to start ${providerName} sign-in`);
      setOAuthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const attemptedProof = challengeProof;
      const res = await fetchWithAuth(`${env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: "POST",
        // Required for the backend's account-bound returning-user admission
        // cookie across app.getondar.com and api.getondar.com. Does not grant
        // authentication; the password remains mandatory.
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(attemptedProof ? { "X-Ondar-Login-Proof": attemptedProof } : {}),
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      // Proof is single-use even when the password is wrong.
      if (attemptedProof) {
        setChallengeProof(null);
        setChallengeRequired(!res.ok);
      }
      if (!res.ok) {
        if (res.status === 429 && body?.error?.code === "LOGIN_CHALLENGE_REQUIRED") {
          setChallengeRequired(true);
          throw new Error("Sign-in is busy. Complete a verification challenge to continue.");
        }
        if (body?.error?.code === "LOGIN_CHALLENGE_REPLAYED" ||
            body?.error?.code === "LOGIN_CHALLENGE_INVALID") {
          setChallengeRequired(true);
          throw new Error("Your verification expired. Please complete a new challenge.");
        }
        if (res.status === 429) {
          const seconds = Math.min(
            60,
            Math.max(1, Number.parseInt(res.headers.get("Retry-After") || "1", 10) || 1),
          );
          throw new Error(`Sign-in traffic is unusually high. Try again in ${seconds} seconds.`);
        }
        if (res.status === 503) {
          throw new Error("Sign-in is temporarily unavailable. Please try again shortly.");
        }
        throw new Error(body?.error?.message || "Sign in failed");
      }
      // Persist tokens (BFF httpOnly will be set via Set-Cookie if backend does, but also store for lib/api-client localStorage compat)
      if (body.access_token) localStorage.setItem("token", body.access_token);
      if (body.refresh_token) localStorage.setItem("refresh_token", body.refresh_token);
      const orgId = body?.memberships?.[0]?.organization_id;
      if (orgId) {
        writeExperienceScope({ organizationId: orgId, branchId: null });
        router.push("/app/dashboard");
      }
      else if (next) router.push(next);
      else router.push("/onboarding");
    } catch (e: any) {
      setError(e?.message || "Sign in failed");
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setChallenge(null);
                  setChallengeProof(null);
                  setChallengeRequired(false);
                }
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot" className="text-xs text-muted-foreground underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            {challengeRequired && !challenge && !challengeProof && (
              <Button
                type="button" variant="outline" className="w-full"
                disabled={challengeBusy} onClick={() => void beginChallenge()}
              >
                Verify to continue
              </Button>
            )}
            {challenge && (
              <LoginChallenge
                challenge={challenge}
                onResponse={acceptChallengeResponse}
                onError={failChallenge}
              />
            )}
            {challengeProof && (
              <p className="text-sm" role="status">
                Verification complete. Select Sign in to continue.
              </p>
            )}
            <Button
              type="submit" className="w-full" loading={loading}
              disabled={challengeBusy || Boolean(challenge)}
            >
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
