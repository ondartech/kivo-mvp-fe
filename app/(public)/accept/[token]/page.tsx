import { headers } from "next/headers";

import { Card, CardContent } from "@/components/ui/card";
import { fetchPublic } from "@/lib/api-client";
import { env } from "@/lib/env";
import { publicApiUrl } from "@/lib/public-api";

import {
  AcceptanceCard,
  type PublicAcceptance,
} from "./acceptance-card";

async function fetchAcceptance(
  host: string | null,
  token: string,
): Promise<{
  acceptance: PublicAcceptance | null;
  acceptUrl: string;
  rejectUrl: string;
}> {
  const resourceUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/acceptances/${encodeURIComponent(token)}`,
  );
  const acceptUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/acceptances/${encodeURIComponent(token)}/accept`,
  );
  const rejectUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/acceptances/${encodeURIComponent(token)}/reject`,
  );

  const response = await fetchPublic(resourceUrl, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return { acceptance: null, acceptUrl, rejectUrl };
  }

  return {
    acceptance: (await response.json()) as PublicAcceptance,
    acceptUrl,
    rejectUrl,
  };
}

function UnavailableAcceptance() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-[560px]">
        <CardContent className="p-8 text-center">
          <div className="text-lg font-semibold">
            Acceptance link unavailable
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This secure acceptance link is invalid, expired, revoked, or no longer
            available.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function PublicAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ??
    requestHeaders.get("host");

  const { acceptance, acceptUrl, rejectUrl } = await fetchAcceptance(
    host,
    token,
  );

  if (!acceptance) return <UnavailableAcceptance />;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <header className="mb-6 text-center">
          <div
            className={
              "mx-auto flex h-8 w-8 items-center justify-center rounded-md " +
              "bg-brand font-semibold text-brand-foreground"
            }
          >
            O
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Ondar · Secure acceptance
          </div>
        </header>

        <AcceptanceCard
          initialAcceptance={acceptance}
          acceptUrl={acceptUrl}
          rejectUrl={rejectUrl}
        />

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Secure customer acceptance delivered with Ondar
        </footer>
      </div>
    </main>
  );
}
