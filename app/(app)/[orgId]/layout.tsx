import * as React from "react";
import { AppShell } from "@/components/kivo/app-shell";
import { requireOrgMembership } from "@/lib/auth";

export default async function OrgLayout(props: {
  children: React.ReactNode;
  params: Promise<any>;
}) {
  const resolvedParams = await props.params;
  const orgId = typeof resolvedParams?.orgId === "string" ? resolvedParams.orgId : "org_demo";
  await requireOrgMembership(orgId);

  return <AppShell orgId={orgId}>{props.children}</AppShell>;
}
