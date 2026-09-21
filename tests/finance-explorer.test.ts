import { describe, expect, it } from "vitest";

import {
  accountActivitySchema,
  accountProtectionLabels,
  financeAccountSchema,
  humanize,
  journalEntrySchema,
  journalSourceTraceSchema,
  shortIdentifier,
} from "@/features/finance-explorer/schema";

const ids = {
  org: "11111111-1111-4111-8111-111111111111",
  account: "22222222-2222-4222-8222-222222222222",
  offsetAccount: "99999999-9999-4999-8999-999999999999",
  journal: "33333333-3333-4333-8333-333333333333",
  line: "44444444-4444-4444-8444-444444444444",
  event: "55555555-5555-4555-8555-555555555555",
  source: "66666666-6666-4666-8666-666666666666",
  sourceEvent: "77777777-7777-4777-8777-777777777777",
  ruleVersion: "88888888-8888-4888-8888-888888888888",
};

function systemAccount() {
  return financeAccountSchema.parse({
    id: ids.account,
    organization_id: ids.org,
    code: "1100",
    name: "Accounts Receivable",
    account_class: "ASSET",
    account_type: "ACCOUNTS_RECEIVABLE",
    parent_account_id: null,
    normal_balance: "DEBIT",
    management_type: "SYSTEM",
    system_key: "accounts_receivable",
    template_version: "ng-v1",
    is_control_account: true,
    control_type: "ACCOUNTS_RECEIVABLE",
    allows_manual_posting: false,
    status: "ACTIVE",
    archived_at: null,
    created_at: "2026-09-21T12:00:00+00:00",
    updated_at: "2026-09-21T12:00:00+00:00",
  });
}

const source = {
  source_domain: "BILLING",
  source_type: "INVOICE",
  source_id: ids.source,
  source_event_id: ids.sourceEvent,
  source_event_type: "invoice.posted",
  source_event_version: 1,
  source_aggregate_type: "Invoice",
};

describe("Finance Explorer contracts", () => {
  it("parses protected account metadata without client inference", () => {
    const account = systemAccount();
    expect(accountProtectionLabels(account)).toEqual([
      "System",
      "Control",
      "Manual posting blocked",
    ]);
  });

  it("parses account activity including authoritative running balance and source", () => {
    const parsed = accountActivitySchema.parse({
      organization_id: ids.org,
      account_id: ids.account,
      account_code: "1100",
      account_name: "Accounts Receivable",
      account_class: "ASSET",
      account_type: "ACCOUNTS_RECEIVABLE",
      normal_balance: "DEBIT",
      account_status: "ACTIVE",
      base_currency: "NGN",
      from_date: "2026-09-01",
      to_date: "2026-09-21",
      branch_id: null,
      project_id: null,
      opening_debit: "0.000000",
      opening_credit: "0.000000",
      activity_debit: "1250000.000000",
      activity_credit: "0.000000",
      closing_debit: "1250000.000000",
      closing_credit: "0.000000",
      data: [{
        line_id: ids.line,
        accounting_date: "2026-09-21",
        journal_entry_id: ids.journal,
        entry_number: "JRN-000001",
        entry_type: "SYSTEM",
        journal_status: "POSTED",
        posted_at: "2026-09-21T12:00:03+00:00",
        line_number: 1,
        description: "Invoice receivable",
        debit_base: "1250000.000000",
        credit_base: "0.000000",
        running_debit: "1250000.000000",
        running_credit: "0.000000",
        running_balance: "1250000.000000",
        running_balance_side: "DEBIT",
        branch_id: null,
        project_id: null,
        customer_id: null,
        vendor_id: null,
        order_id: null,
        commercial_item_id: null,
        inventory_location_id: null,
        dimensions: {},
        reversal_of_entry_id: null,
        reversed_by_entry_id: null,
        financial_event_id: ids.event,
        financial_event_status: "POSTED",
        posting_profile_key: "SALE",
        posting_rule_key: "sale.invoice",
        posting_rule_version: 1,
        correlation_id: "corr-1",
        source,
      }],
      next_cursor: null,
      has_more: false,
    });
    expect(parsed.data[0].running_balance_side).toBe("DEBIT");
    expect(parsed.data[0].source.source_type).toBe("INVOICE");
  });

  it("keeps accounting date distinct from created and posted timestamps", () => {
    const parsed = journalEntrySchema.parse({
      id: ids.journal,
      organization_id: ids.org,
      entry_number: "JRN-000001",
      entry_type: "SYSTEM",
      status: "POSTED",
      accounting_date: "2026-09-21",
      occurred_at: "2026-09-21T11:59:59+00:00",
      created_at: "2026-09-21T12:00:01+00:00",
      posted_at: "2026-09-21T12:00:03+00:00",
      source_domain: "BILLING",
      source_type: "INVOICE",
      source_id: ids.source,
      source_event_id: ids.sourceEvent,
      financial_event_id: ids.event,
      posting_profile_key: "SALE",
      posting_rule_key: "sale.invoice",
      posting_rule_version: 1,
      posting_rule_version_id: ids.ruleVersion,
      transaction_currency: "NGN",
      base_currency: "NGN",
      fx_rate: null,
      total_debit_base: "1250000.000000",
      total_credit_base: "1250000.000000",
      reversal_of_entry_id: null,
      reversed_by_entry_id: null,
      memo: null,
      reason: null,
      created_by_principal: "system:finance",
      correlation_id: "corr-1",
      causation_id: null,
      lines: [{
        id: ids.line,
        organization_id: ids.org,
        journal_entry_id: ids.journal,
        line_number: 1,
        account_id: ids.account,
        description: "Invoice receivable",
        debit_transaction: "1250000.000000",
        credit_transaction: "0.000000",
        debit_base: "1250000.000000",
        credit_base: "0.000000",
        branch_id: null,
        project_id: null,
        customer_id: null,
        vendor_id: null,
        order_id: null,
        commercial_item_id: null,
        inventory_location_id: null,
        dimensions: {},
      }, {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        organization_id: ids.org,
        journal_entry_id: ids.journal,
        line_number: 2,
        account_id: ids.offsetAccount,
        description: "Revenue",
        debit_transaction: "0.000000",
        credit_transaction: "1250000.000000",
        debit_base: "0.000000",
        credit_base: "1250000.000000",
        branch_id: null,
        project_id: null,
        customer_id: null,
        vendor_id: null,
        order_id: null,
        commercial_item_id: null,
        inventory_location_id: null,
        dimensions: {},
      }],
    });
    expect(parsed.accounting_date).toBe("2026-09-21");
    expect(parsed.created_at).not.toBe(parsed.posted_at);
  });

  it("parses the journal-to-source trace chain", () => {
    const parsed = journalSourceTraceSchema.parse({
      organization_id: ids.org,
      journal_entry_id: ids.journal,
      entry_number: "JRN-000001",
      entry_type: "SYSTEM",
      journal_status: "POSTED",
      accounting_date: "2026-09-21",
      reversal_of_entry_id: null,
      reversed_by_entry_id: null,
      financial_event_id: ids.event,
      financial_event_status: "POSTED",
      event_type: "InvoicePosted",
      posting_profile_key: "SALE",
      posting_rule_key: "sale.invoice",
      posting_rule_version: 1,
      posting_rule_version_id: ids.ruleVersion,
      correlation_id: "corr-1",
      causation_id: null,
      source,
    });
    expect(parsed.source.source_id).toBe(ids.source);
  });

  it("has stable read-only presentation helpers", () => {
    expect(shortIdentifier(ids.journal)).toBe("33333333…3333");
    expect(humanize("ACCOUNTS_RECEIVABLE")).toBe("Accounts Receivable");
  });
});
