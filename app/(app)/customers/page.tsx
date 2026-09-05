"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

/** Legacy redirect — canonical is /[orgId]/customers (decision #1). */
export default function CustomersRedirectPage() {
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? "org_demo";
  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/${orgId}/customers`);
  }, [isLoading, orgId, router]);
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customers" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" />
      <EmptyState title="No organization" description="Join or create an organization to manage customers." />
    </div>
  );
}
