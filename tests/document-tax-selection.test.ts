import { describe, expect, it } from "vitest";

import type { CommercialItem } from "@/features/catalog/api";
import {
  catalogDefaultTaxCodeId,
  documentAttachableTaxCodes,
  taxSelectionHint,
} from "@/features/tax/document";
import type { TaxCode } from "@/features/tax/schema";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const VAT_ID = "22222222-2222-4222-8222-222222222222";
const INPUT_ID = "33333333-3333-4333-8333-333333333333";
const WHT_ID = "44444444-4444-4444-8444-444444444444";

function code(
  id: string,
  family: TaxCode["family"],
  recognitionRule: NonNullable<TaxCode["current_version"]>["recognition_rule"],
  status: TaxCode["status"] = "ACTIVE",
): TaxCode {
  return {
    id,
    organization_id: ORG_ID,
    code: family + "-" + id.slice(0, 4),
    name: family + " test",
    family,
    jurisdiction_country: "NG",
    status,
    created_at: "2026-09-24T00:00:00Z",
    updated_at: "2026-09-24T00:00:00Z",
    current_version: {
      id: "55555555-5555-4555-8555-" + id.slice(-12),
      organization_id: ORG_ID,
      tax_code_id: id,
      version: 1,
      rate: family === "VAT" ? "0.075000" : "0.050000",
      treatment: "TAXABLE",
      recognition_rule: recognitionRule,
      calculation_method: "PERCENT_OF_TAXABLE_BASE",
      effective_from: "2026-01-01",
      effective_to: null,
      authority_reference: null,
      created_by_user_id: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  };
}

const item: CommercialItem = {
  id: "66666666-6666-4666-8666-666666666666",
  organization_id: ORG_ID,
  type: "SERVICE",
  name: "Advisory",
  description: null,
  code: "ADV",
  sku: null,
  status: "ACTIVE",
  default_uom: "EACH",
  default_currency: "NGN",
  sales_enabled: true,
  purchase_enabled: true,
  tax_classification: null,
  sales_tax_code_id: VAT_ID,
  purchase_tax_code_id: INPUT_ID,
  nrs_classification: null,
  version: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("TAX-FE-002 document tax selection", () => {
  it("uses direction-specific Catalog defaults", () => {
    expect(catalogDefaultTaxCodeId(item, "SELL")).toBe(VAT_ID);
    expect(catalogDefaultTaxCodeId(item, "BUY")).toBe(INPUT_ID);
  });

  it("only exposes active ON_DOCUMENT non-WHT TaxCodes for additive document tax", () => {
    const attachable = documentAttachableTaxCodes([
      code(VAT_ID, "VAT", "ON_DOCUMENT"),
      code(WHT_ID, "WHT", "NIGERIA_WHT_CONTEXTUAL"),
      code(INPUT_ID, "LEVY", "ON_DOCUMENT", "ARCHIVED"),
    ]);

    expect(attachable.map((entry) => entry.id)).toEqual([VAT_ID]);
  });

  it("flags a Catalog default that cannot be attached to a new document", () => {
    const archived = code(VAT_ID, "VAT", "ON_DOCUMENT", "ARCHIVED");

    expect(
      taxSelectionHint({
        item,
        direction: "SELL",
        explicitTaxCodeId: null,
        codes: [archived],
      }),
    ).toContain("not currently attachable");
  });
  it("explains inheritance until an explicit line override is selected", () => {
    const codes = [
      code(VAT_ID, "VAT", "ON_DOCUMENT"),
      code(INPUT_ID, "LEVY", "ON_DOCUMENT"),
    ];

    expect(
      taxSelectionHint({
        item,
        direction: "SELL",
        explicitTaxCodeId: null,
        codes,
      }),
    ).toContain("Inherited from Catalog");

    expect(
      taxSelectionHint({
        item,
        direction: "SELL",
        explicitTaxCodeId: INPUT_ID,
        codes,
      }),
    ).toContain("Explicit override");
  });
});
