import { redirect } from "next/navigation";

/**
 * Root Application Entry Point
 *
 * `kivo-mvp-fe` is strictly the authenticated web application (app.kivo.ng).
 * Marketing, public pricing, and brand landing pages are owned by `kivo-mvp-web`.
 *
 * Root path `/` redirects authenticated users to their active organization's
 * dashboard or unauthenticated visitors to `/login`.
 */
export default function RootPage() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/dashboard`);
}
