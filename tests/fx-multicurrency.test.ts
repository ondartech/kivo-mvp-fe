// FX-013G canonical roadmap conformance.
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { buildDashboardParams } from "@/features/dashboard/branching";
import { buildFinanceActivityParams } from "@/features/finance-explorer/branching";
import { buildPaymentOperationsParams } from "@/features/payments/payment-runs";
import { buildReceivableCurrencyParams } from "@/features/receivables/branching";
import {
  reportTranslationContextSchema,
  reportingRateEvidenceSchema,
} from "@/features/finance-explorer/schema";
import { formatCompactMoney, formatMoney } from "@/lib/money";

describe("FX-013G multi-currency presentation conformance", () => {
  it.each([
    ["NGN", "1.235"],
    ["USD", "1.235"],
    ["EUR", "1.235"],
    ["GBP", "1.235"],
    ["JPY", "1.5"],
    ["XOF", "1.5"],
    ["XAF", "1.5"],
    ["KWD", "1.2345"],
    ["BHD", "1.2345"],
    ["JOD", "1.2345"],
    ["OMR", "1.2345"],
    ["TND", "1.2345"],
  ])("delegates %s minor-unit formatting to Intl", (currency, amount) => {
    expect(formatMoney(amount, currency)).toBe(
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).format(Number(amount)),
    );
  });

  it("preserves decimal-string precision beyond JavaScript safe integers", () => {
    expect(formatMoney("999999999999999999.99", "USD")).toBe(
      "$999,999,999,999,999,999.99",
    );
  });

  it("rejects non-canonical money display input", () => {
    expect(() => formatMoney("1,000.00", "USD")).toThrow(/canonical decimal string/);
  });

  it("does not hard-code the naira symbol in compact formatting", () => {
    const usd = formatCompactMoney("2500000", "USD");
    const jpy = formatCompactMoney("2500000", "JPY");

    expect(usd).not.toContain("₦");
    expect(jpy).not.toContain("₦");
    expect(usd).toBe(
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(2500000),
    );
  });

  it("keeps Finance reports functional by default and translates only on request", () => {
    const functional = buildFinanceActivityParams({
      branchId: "lag",
      presentationCurrency: null,
    });
    expect(functional.get("branch_id")).toBe("lag");
    expect(functional.has("presentation_currency")).toBe(false);

    const translated = buildFinanceActivityParams({
      branchId: "lag",
      presentationCurrency: "USD",
    });
    expect(translated.get("presentation_currency")).toBe("USD");
    expect(() =>
      buildFinanceActivityParams({
        presentationCurrency: "US",
      }),
    ).toThrow(/three-letter ISO code/);
  });

  it("preserves an explicit Dashboard presentation currency", () => {
    const params = buildDashboardParams({
      branchId: null,
      currency: "EUR",
    });
    expect(params.get("currency")).toBe("EUR");
    expect(params.has("branch_id")).toBe(false);
    expect(() =>
      buildDashboardParams({ branchId: null, currency: "" }),
    ).toThrow(/explicit ISO currency/);
  });

  it("preserves explicit Receivables reporting currency and branch scope", () => {
    const params = buildReceivableCurrencyParams({
      branchId: "lag",
      currency: "GBP",
    });
    expect(params.get("currency")).toBe("GBP");
    expect(params.get("branch_id")).toBe("lag");
    expect(() =>
      buildReceivableCurrencyParams({ currency: "" }),
    ).toThrow(/explicit ISO currency/);
  });

  it("preserves Payment Operations execution/reporting currency", () => {
    const params = buildPaymentOperationsParams({
      branchId: "hq",
      currency: "USD",
      attentionOnly: true,
      limit: 25,
    });
    expect(params.get("currency")).toBe("USD");
    expect(params.get("branch_id")).toBe("hq");
    expect(params.get("attention_only")).toBe("true");
    expect(params.get("limit")).toBe("25");
    expect(() =>
      buildPaymentOperationsParams({ currency: "US" }),
    ).toThrow(/explicit ISO currency/);
  });

  it("parses reporting FX evidence without collapsing functional and presentation currency", () => {
    const evidence = reportingRateEvidenceSchema.parse({
      legal_entity_id: "11111111-1111-4111-8111-111111111111",
      functional_currency: "NGN",
      presentation_currency: "USD",
      basis: "CLOSING",
      translated: true,
      reporting_rate_snapshot_id: "22222222-2222-4222-8222-222222222222",
      effective_rate: "0.000625",
      policy_version: "FX_REPORTING_V1_WEEKDAY_MEAN",
      constituent_rate_hash: "abc123",
    });
    expect(evidence.functional_currency).toBe("NGN");
    expect(evidence.presentation_currency).toBe("USD");

    const context = reportTranslationContextSchema.parse({
      id: "33333333-3333-4333-8333-333333333333",
      report_type: "ACCOUNT_ACTIVITY",
      report_classification: "PRESENTATION_REPORT",
      presentation_currency: "USD",
      translation_basis: "CLOSING",
      translated: true,
      from_date: "2026-10-01",
      to_date: "2026-10-04",
      source_report_hash: "source",
      rate_set_hash: "rates",
      context_hash: "context",
      scope_payload: {},
      rate_snapshot_ids: [evidence.reporting_rate_snapshot_id],
      legal_entity_ids: [evidence.legal_entity_id],
      functional_currencies: ["NGN"],
      policy_versions: ["FX_REPORTING_V1_WEEKDAY_MEAN"],
      rate_evidence: [evidence],
      created_by_user_id: null,
      created_at: "2026-10-04T12:00:00Z",
    });
    expect(context.translated).toBe(true);
    expect(context.rate_evidence[0].effective_rate).toBe("0.000625");
  });

  it("keeps the runtime source free of implicit NGN fallbacks", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/check-fx-conformance.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});
