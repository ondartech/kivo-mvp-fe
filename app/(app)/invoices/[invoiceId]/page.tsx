import { redirect } from "next/navigation";

export default async function InvoiceDetailRedirect({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const defaultOrgId = "org_demo";
  redirect(`/${defaultOrgId}/invoices/${invoiceId}`);
}
