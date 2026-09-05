"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { exchangeGoogleCode } from "@/features/auth/api";

export const dynamic = "force-dynamic";

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      if (errorParam) {
        setError(`Google error: ${errorParam}`);
        setStatus("error");
        return;
      }
      if (!code || !state) {
        setError("Missing code or state from Google");
        setStatus("error");
        return;
      }
      const storedState = sessionStorage.getItem("kivo_oauth_state");
      const verifier = sessionStorage.getItem("kivo_oauth_verifier");
      const redirectUri = sessionStorage.getItem("kivo_oauth_redirect") || `${window.location.origin}/auth/callback`;
      if (storedState && storedState !== state) {
        console.warn("State mismatch client-side");
      }
      try {
        const data = await exchangeGoogleCode({
          code,
          state,
          code_verifier: verifier || undefined,
          redirect_uri: redirectUri,
        });
        if (data.access_token) localStorage.setItem("token", data.access_token);
        if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
        sessionStorage.removeItem("kivo_oauth_state");
        sessionStorage.removeItem("kivo_oauth_verifier");
        sessionStorage.removeItem("kivo_oauth_redirect");
        const orgId = (data as unknown as { memberships?: { organization_id: string }[] })?.memberships?.[0]?.organization_id;
        if (orgId) router.replace(`/${orgId}/dashboard`);
        else router.replace("/onboarding");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Google sign-in failed");
        setStatus("error");
      }
    };
    run();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-6 space-y-3 text-center">
          {status === "loading" ? (
            <>
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
              <p className="text-sm text-muted-foreground">Completing Google sign-in…</p>
            </>
          ) : (
            <>
              <p className="text-sm text-red-600" role="alert">{error}</p>
              <a href="/login" className="text-sm underline">
                Back to sign in
              </a>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen grid place-items-center bg-background px-4"><div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" /></div>}>
      <GoogleCallbackInner />
    </React.Suspense>
  );
}
