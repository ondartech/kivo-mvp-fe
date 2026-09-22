"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import {
  AuthApiError,
  clearOAuthTransaction,
  exchangeOAuthCode,
  loadOAuthTransaction,
  type OAuthProvider,
} from "@/features/auth/api";

function providerLabel(provider: OAuthProvider | undefined) {
  if (provider === "google") return "Google";
  if (provider === "microsoft") return "Microsoft";
  return "OAuth";
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<"loading" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const providerError = searchParams.get("error");

      const transaction = state ? loadOAuthTransaction(state) : null;
      const label = providerLabel(transaction?.provider);

      if (providerError) {
        if (transaction) clearOAuthTransaction(transaction);
        setError(label + " sign-in was cancelled or denied. Please try again.");
        setStatus("error");
        return;
      }

      if (!code || !state) {
        setError("This sign-in response is incomplete. Start the sign-in flow again.");
        setStatus("error");
        return;
      }

      if (!transaction) {
        setError(
          "We could not verify this sign-in attempt. Start again from the Ondar sign-in page.",
        );
        setStatus("error");
        return;
      }

      try {
        const data = await exchangeOAuthCode(transaction, code);

        if (data.access_token) localStorage.setItem("token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }

        clearOAuthTransaction(transaction);

        const orgId = data.memberships?.[0]?.organization_id;
        if (orgId) router.replace("/" + orgId + "/dashboard");
        else router.replace("/onboarding");
      } catch (e: unknown) {
        clearOAuthTransaction(transaction);

        if (e instanceof AuthApiError && e.code === "ACCOUNT_LINK_REQUIRED") {
          setError(
            "An Ondar account already uses this email. Sign in with your existing method first, then connect Microsoft to that account.",
          );
        } else {
          setError(e instanceof Error ? e.message : label + " sign-in failed");
        }
        setStatus("error");
      }
    };

    void run();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-6 space-y-3 text-center">
          {status === "loading" ? (
            <>
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
              <p className="text-sm text-muted-foreground">Completing sign-in…</p>
            </>
          ) : (
            <>
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
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
