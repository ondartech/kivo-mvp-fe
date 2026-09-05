import { redirect } from "next/navigation";

/**
 * Redirect from un-scoped /dashboard to active tenant /[orgId]/dashboard.
 */
export default function DashboardRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/dashboard`);
}
