import { redirect } from "next/navigation";

export default function ReceivablesRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/receivables`);
}
