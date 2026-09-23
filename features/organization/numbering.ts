import type {
  NumberingDocumentType,
  NumberingPolicy,
} from "@/features/organization/api";

export const NUMBERING_DOCUMENT_LABELS: Record<NumberingDocumentType, string> = {
  INVOICE: "Invoices",
  QUOTE: "Quotes",
  ORDER: "Orders",
  SUPPLIER_BILL: "Supplier bills",
};

export function numberingReferenceExample(
  policy: Pick<NumberingPolicy, "prefix" | "width" | "scope">,
  branchCode = "LAG",
): string {
  const serial = `${"0".repeat(Math.max(policy.width - 1, 0))}1`;
  return policy.scope === "BRANCH"
    ? `${policy.prefix}-${branchCode}-${serial}`
    : `${policy.prefix}-${serial}`;
}
