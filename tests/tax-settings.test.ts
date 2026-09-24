import { describe, expect, it } from "vitest";

import {
  defaultRecognitionRuleForFamily,
  financeAccountClassForTaxRole,
  taxCodeCreateInputSchema,
  taxCodeDetailSchema,
  taxRegistrationInputSchema,
  taxRegistrationSchema,
  taxRolesForFamily,
} from "../features/tax/schema";

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const TAX_CODE_ID = "22222222-2222-4222-8222-222222222222";
const VERSION_ID = "33333333-3333-4333-8333-333333333333";

describe("tax administration contracts", () => {
  it("keeps tax rates as exact decimal strings", () => {
    const parsed = taxCodeDetailSchema.parse({
      id: TAX_CODE_ID,
      organization_id: ORGANIZATION_ID,
      code: "VAT-STD",
      name: "VAT Standard",
      family: "VAT",
      jurisdiction_country: "NG",
      status: "ACTIVE",
      created_at: "2026-09-24T00:00:00Z",
      updated_at: "2026-09-24T00:00:00Z",
      current_version: {
        id: VERSION_ID,
        organization_id: ORGANIZATION_ID,
        tax_code_id: TAX_CODE_ID,
        version: 1,
        rate: "0.075000",
        treatment: "TAXABLE",
        recognition_rule: "ON_DOCUMENT",
        calculation_method: "PERCENT_OF_TAXABLE_BASE",
        effective_from: "2026-01-01",
        effective_to: null,
        authority_reference: "Nigeria statutory authority",
        created_by_user_id: null,
        created_at: "2026-09-24T00:00:00Z",
      },
      versions: [
        {
          id: VERSION_ID,
          organization_id: ORGANIZATION_ID,
          tax_code_id: TAX_CODE_ID,
          version: 1,
          rate: "0.075000",
          treatment: "TAXABLE",
          recognition_rule: "ON_DOCUMENT",
          calculation_method: "PERCENT_OF_TAXABLE_BASE",
          effective_from: "2026-01-01",
          effective_to: null,
          authority_reference: "Nigeria statutory authority",
          created_by_user_id: null,
          created_at: "2026-09-24T00:00:00Z",
        },
      ],
      account_mappings: [],
    });

    expect(parsed.current_version?.rate).toBe("0.075000");
    expect(() =>
      taxCodeDetailSchema.parse({
        ...parsed,
        current_version: parsed.current_version
          ? { ...parsed.current_version, rate: 0.075 }
          : null,
      }),
    ).toThrow();
  });

  it("validates tax-code creation without converting rates to numbers", () => {
    const valid = taxCodeCreateInputSchema.parse({
      code: "VAT-STD",
      name: "VAT Standard",
      family: "VAT",
      jurisdiction_country: "NG",
      initial_version: {
        rate: "0.075000",
        treatment: "TAXABLE",
        recognition_rule: "ON_DOCUMENT",
        effective_from: "2026-01-01",
        effective_to: null,
        authority_reference: null,
      },
    });

    expect(valid.initial_version.rate).toBe("0.075000");

    expect(() =>
      taxCodeCreateInputSchema.parse({
        ...valid,
        initial_version: { ...valid.initial_version, rate: "1.000001" },
      }),
    ).toThrow();

    expect(() =>
      taxCodeCreateInputSchema.parse({
        ...valid,
        initial_version: {
          ...valid.initial_version,
          treatment: "ZERO_RATED",
          rate: "0.075000",
        },
      }),
    ).toThrow();
  });

  it("preserves family-specific role and recognition defaults", () => {
    expect(taxRolesForFamily("VAT")).toEqual(["OUTPUT_TAX", "INPUT_TAX"]);
    expect(taxRolesForFamily("WHT")).toEqual([
      "WITHHOLDING_PAYABLE",
      "WITHHOLDING_RECEIVABLE",
    ]);
    expect(taxRolesForFamily("LEVY")).toEqual([
      "TAX_PAYABLE",
      "TAX_RECEIVABLE",
    ]);

    expect(defaultRecognitionRuleForFamily("VAT")).toBe("ON_DOCUMENT");
    expect(defaultRecognitionRuleForFamily("WHT")).toBe(
      "NIGERIA_WHT_CONTEXTUAL",
    );
    expect(financeAccountClassForTaxRole("INPUT_TAX")).toBe("ASSET");
    expect(financeAccountClassForTaxRole("OUTPUT_TAX")).toBe("LIABILITY");
  });

  it("accepts both pre-calendar and calendar registration response shapes", () => {
    const base = {
      id: "44444444-4444-4444-8444-444444444444",
      organization_id: ORGANIZATION_ID,
      authority_code: "NRS",
      registration_type: "VAT",
      registration_number: null,
      remittance_frequency: "MONTHLY" as const,
      effective_from: "2026-01-01",
      effective_to: null,
      status: "ACTIVE" as const,
      created_at: "2026-09-24T00:00:00Z",
    };

    const legacy = taxRegistrationSchema.parse(base);
    expect(legacy.filing_deadline_rule).toBe("UNSPECIFIED");
    expect(legacy.filing_due_day).toBeNull();
    expect(legacy.period_end_month).toBe(12);

    const calendar = taxRegistrationSchema.parse({
      ...base,
      filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
      filing_due_day: 21,
      filing_due_month_offset: 1,
      period_end_month: 12,
      deadline_authority_reference: "Nigeria Tax Administration Act 2025",
    });
    expect(calendar.filing_due_day).toBe(21);
  });

  it("rejects invalid registration effective ranges", () => {
    expect(() =>
      taxRegistrationInputSchema.parse({
        authority_code: "NRS",
        registration_type: "VAT",
        registration_number: null,
        remittance_frequency: "MONTHLY",
        effective_from: "2026-09-24",
        effective_to: "2026-09-23",
      }),
    ).toThrow();
  });
});
