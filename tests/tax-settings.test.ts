import { describe, expect, it } from "vitest";

import {
  defaultRecognitionRuleForFamily,
  financeAccountClassForTaxRole,
  taxCodeCreateInputSchema,
  taxCodeDetailSchema,
  taxComplianceCalendarSchema,
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

  it("accepts strict registration deadline fields and rejects incomplete rules", () => {
    const parsed = taxRegistrationSchema.parse({
      id: "44444444-4444-4444-8444-444444444444",
      organization_id: ORGANIZATION_ID,
      authority_code: "NRS",
      registration_type: "VAT",
      registration_number: "VAT-001",
      remittance_frequency: "MONTHLY",
      filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
      filing_due_day: 21,
      filing_due_month_offset: 1,
      period_end_month: 12,
      deadline_authority_reference:
        "Nigeria Tax Administration Act 2025 — VAT filing deadline",
      effective_from: "2026-01-01",
      effective_to: null,
      status: "ACTIVE",
      created_at: "2026-09-24T00:00:00Z",
    });

    expect(parsed.filing_due_day).toBe(21);

    expect(() =>
      taxRegistrationInputSchema.parse({
        authority_code: "NRS",
        registration_type: "VAT",
        registration_number: null,
        remittance_frequency: "MONTHLY",
        filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
        filing_due_day: 21,
        filing_due_month_offset: null,
        period_end_month: 12,
        deadline_authority_reference: "Nigeria Tax Administration Act 2025",
        effective_from: "2026-01-01",
        effective_to: null,
      }),
    ).toThrow();

    expect(() =>
      taxRegistrationInputSchema.parse({
        authority_code: "NRS",
        registration_type: "VAT",
        registration_number: null,
        remittance_frequency: "MONTHLY",
        filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
        filing_due_day: 21,
        filing_due_month_offset: 0,
        period_end_month: 12,
        deadline_authority_reference: "Invalid same-period deadline",
        effective_from: "2026-01-01",
        effective_to: null,
      }),
    ).toThrow();

    expect(() =>
      taxRegistrationInputSchema.parse({
        authority_code: "NRS",
        registration_type: "STAMP_DUTY",
        registration_number: null,
        remittance_frequency: "ON_DEMAND",
        filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
        filing_due_day: 21,
        filing_due_month_offset: 1,
        period_end_month: 12,
        deadline_authority_reference: "Invalid recurring rule",
        effective_from: "2026-01-01",
        effective_to: null,
      }),
    ).toThrow();
  });

  it("parses the compliance calendar without inventing filing completion", () => {
    const parsed = taxComplianceCalendarSchema.parse({
      organization_id: ORGANIZATION_ID,
      from_date: "2026-09-01",
      to_date: "2026-11-30",
      as_of_date: "2026-09-24",
      generated_at: "2026-09-24T12:00:00Z",
      item_count: 1,
      items: [
        {
          registration_id: "44444444-4444-4444-8444-444444444444",
          authority_code: "NRS",
          registration_type: "VAT",
          registration_number: "VAT-001",
          remittance_frequency: "MONTHLY",
          period_start: "2026-09-01",
          period_end: "2026-09-30",
          due_date: "2026-10-21",
          deadline_state: "UPCOMING",
          completion_state: "UNTRACKED",
          filing_deadline_rule: "DAY_OF_MONTH_AFTER_PERIOD",
          deadline_authority_reference:
            "Nigeria Tax Administration Act 2025 — VAT filing deadline",
        },
      ],
      gaps: [
        {
          registration_id: "55555555-5555-4555-8555-555555555555",
          authority_code: "NRS",
          registration_type: "WHT",
          registration_number: null,
          remittance_frequency: "MONTHLY",
          reason: "DEADLINE_RULE_MISSING",
        },
      ],
      coverage: {
        schedule_coverage: "INCOMPLETE",
        recurring_registration_count: 2,
        scheduled_registration_count: 1,
        unscheduled_registration_count: 1,
        completion_tracking: "NOT_IMPLEMENTED",
        warning_codes: ["TAX_CALENDAR_DEADLINE_RULES_INCOMPLETE"],
        warnings: ["One recurring registration has no filing deadline rule."],
      },
    });

    expect(parsed.items[0]?.completion_state).toBe("UNTRACKED");
    expect(parsed.coverage.schedule_coverage).toBe("INCOMPLETE");
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
