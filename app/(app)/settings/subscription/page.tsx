import { redirect } from "next/navigation";

export default function SubscriptionRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/settings/subscription`);
}
