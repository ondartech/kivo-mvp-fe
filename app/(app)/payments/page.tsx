import { redirect } from "next/navigation";

export default function PaymentsRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/payments`);
}
