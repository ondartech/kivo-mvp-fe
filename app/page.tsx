import { AppShell } from "@/components/kivo/app-shell";
import DashboardPage from "@/app/(app)/dashboard/page";

export default function HomePage() {
  return (
    <AppShell orgId="org_demo">
      <DashboardPage />
    </AppShell>
  );
}
