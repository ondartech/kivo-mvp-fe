"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

/** Resolves the caller's workspace then lands on the canonical Team route. */
export default function TeamRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? null;

  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/app/${orgId}/settings/team`);
  }, [isLoading, orgId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Team" />
      <EmptyState
        title="No organization"
        description="Join or create an organization to manage its team."
      />
    </div>
  );
}
