import { AppShell } from "@/components/kivo/app-shell";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  // In real app: await requireOrgMembership(params.orgId); here demo orgId
  return <AppShell orgId="org_demo">{children}</AppShell>;
}
