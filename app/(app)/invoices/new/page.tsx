import { redirect } from "next/navigation";

export default function NewInvoiceRedirect() {
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/invoices/new`);
}
