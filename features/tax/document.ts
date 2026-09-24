import type { CommercialItem } from "@/features/catalog/api";
import type { TaxCode } from "./schema";

export type DocumentDirection = "SELL" | "BUY";

export function documentAttachableTaxCodes(codes: TaxCode[]): TaxCode[] {
  return codes.filter(
    (code) =>
      code.status === "ACTIVE" &&
      code.family !== "WHT" &&
      code.current_version !== null &&
      code.current_version.recognition_rule === "ON_DOCUMENT",
  );
}

export function catalogDefaultTaxCodeId(
  item: CommercialItem | null | undefined,
  direction: DocumentDirection,
): string | null {
  if (!item) return null;
  return direction === "SELL" ? item.sales_tax_code_id : item.purchase_tax_code_id;
}

export function findTaxCode(
  codes: TaxCode[],
  taxCodeId: string | null | undefined,
): TaxCode | null {
  if (!taxCodeId) return null;
  return codes.find((code) => code.id === taxCodeId) ?? null;
}

export function taxCodeDisplay(code: TaxCode | null | undefined): string {
  if (!code) return "No tax";
  const rate = code.current_version?.rate;
  return rate ? code.code + " · " + rate : code.code;
}

export function taxSelectionHint(args: {
  item: CommercialItem | null | undefined;
  direction: DocumentDirection;
  explicitTaxCodeId: string | null | undefined;
  codes: TaxCode[];
}): string {
  const explicit = findTaxCode(args.codes, args.explicitTaxCodeId);
  if (explicit) {
    return "Explicit override: " + taxCodeDisplay(explicit) + ". Ondar resolves the effective TaxCodeVersion on the server.";
  }

  const defaultId = catalogDefaultTaxCodeId(args.item, args.direction);
  const inherited = findTaxCode(args.codes, defaultId);
  if (inherited) {
    return "Inherited from Catalog: " + taxCodeDisplay(inherited) + ". Leave the selector unchanged to keep the Catalog default.";
  }

  if (defaultId) {
    return "This Catalog item references a TaxCode that is not currently attachable. Choose an explicit active document TaxCode before previewing.";
  }

  return args.item
    ? "This Catalog item has no default document TaxCode; the line is untaxed unless you choose an explicit TaxCode."
    : "Free-text lines are untaxed unless you choose an explicit TaxCode.";
}
