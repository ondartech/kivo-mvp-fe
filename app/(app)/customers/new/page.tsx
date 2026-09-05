"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

export default function NewCustomerRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? "org_demo";
  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/${orgId}/customers/new`);
  }, [isLoading, orgId, router]);
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[760px]">
        <PageHeader title="Add customer" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Add customer" />
      <EmptyState title="No organization" description="Join or create an organization to manage customers." />
    </div>
  );
}
