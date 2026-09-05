"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/kivo/empty-state";
import { useMe } from "@/features/team/api";

export default function CustomerDetailRedirectPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const { data, isLoading } = useMe();
  const orgId = data?.memberships?.find((m) => m.status === "ACTIVE")?.organization_id ?? "org_demo";
  useEffect(() => {
    if (!isLoading && orgId) router.replace(`/${orgId}/customers/${params.customerId}`);
  }, [isLoading, orgId, router, params.customerId]);
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1100px]">
        <PageHeader title="Customer" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-[1100px]">
      <PageHeader title="Customer" />
      <EmptyState title="No organization" description="Join or create an organization to view this customer." />
    </div>
  );
}
