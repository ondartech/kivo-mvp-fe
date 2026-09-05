"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

/** Legacy route without orgId — resolves workspace then redirects to canonical /app/[orgId]/settings/business */
export default function BusinessSettingsRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? null;

  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/app/${orgId}/settings/business`);
  }, [isLoading, orgId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[880px]">
        <PageHeader title="Business Identity" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-[880px]">
      <PageHeader title="Business Identity" description="Business identity used in invoices — name, address, logo. Frozen in snapshots after issue." />
      <EmptyState title="No organization" description="Join or create an organization to manage business identity." />
    </div>
  );
}
