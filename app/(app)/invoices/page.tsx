import { redirect } from "next/navigation";

export default function InvoicesRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/invoices`);
}
