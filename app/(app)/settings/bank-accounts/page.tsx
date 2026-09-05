"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

/** Resolves caller's workspace then lands on canonical Payout Accounts route. */
export default function BankAccountsRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? null;

  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/app/${orgId}/settings/bank-accounts`);
  }, [isLoading, orgId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[960px]">
        <PageHeader title="Payout Accounts" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-[960px]">
      <PageHeader title="Payout Accounts" />
      <EmptyState title="No organization" description="Join or create an organization to manage payout accounts." />
    </div>
  );
}
