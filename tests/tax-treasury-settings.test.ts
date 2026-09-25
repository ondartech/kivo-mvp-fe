import { describe, expect, it } from "vitest";

import {
  isTaxReserveEligibleBankAccount,
  taxReserveBankAccountSchema,
  taxReservePolicyInputSchema,
  taxReservePositionSchema,
} from "../features/tax/schema";

const ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
const POLICY_ID = "22222222-2222-4222-8222-222222222222";
const BANK_ACCOUNT_ID = "33333333-3333-4333-8333-333333333333";
const INSTRUCTION_ID = "44444444-4444-4444-8444-444444444444";
const EVENT_ID = "55555555-5555-4555-8555-555555555555";

const bankAccount = {
  id: BANK_ACCOUNT_ID,
  organization_id: ORGANIZATION_ID,
  bank_code: "058",
  bank_name: "Example Bank",
  account_number_masked: "******1234",
  account_number_last4: "1234",
  account_name: "Ondar Example Ltd",
  currency: "NGN",
  verification_status: "VERIFIED",
  verification_match_type: "MATCH",
  verified_at: "2026-09-25T08:00:00Z",
  is_default: false,
  status: "ACTIVE",
  created_at: "2026-09-25T07:00:00Z",
  updated_at: "2026-09-25T08:00:00Z",
};

describe("tax treasury reserve contracts", () => {
  it("requires an explicit destination and runtime policy state", () => {
    const parsed = taxReservePolicyInputSchema.parse({
      destination_bank_account_id: BANK_ACCOUNT_ID,
      status: "ACTIVE",
    });

    expect(parsed.status).toBe("ACTIVE");
    expect(() =>
      taxReservePolicyInputSchema.parse({
        destination_bank_account_id: BANK_ACCOUNT_ID,
        status: "ENABLED",
      }),
    ).toThrow();
  });

  it("only treats active verified bank accounts as activation-ready", () => {
    const parsed = taxReserveBankAccountSchema.parse(bankAccount);
    expect(isTaxReserveEligibleBankAccount(parsed)).toBe(true);
    expect(
      isTaxReserveEligibleBankAccount({
        ...parsed,
        verification_status: "PENDING",
      }),
    ).toBe(false);
    expect(
      isTaxReserveEligibleBankAccount({ ...parsed, status: "INACTIVE" }),
    ).toBe(false);
  });

  it("preserves exact reserve money and the external execution boundary", () => {
    const parsed = taxReservePositionSchema.parse({
      organization_id: ORGANIZATION_ID,
      base_currency: "NGN",
      as_of_date: "2026-09-25",
      reserve_basis: "GROSS_POSITIVE_LIABILITY",
      target_reserve_balance: "15000.250000",
      policy: {
        id: POLICY_ID,
        organization_id: ORGANIZATION_ID,
        status: "ACTIVE",
        reserve_basis: "GROSS_POSITIVE_LIABILITY",
        destination: {
          bank_account_id: BANK_ACCOUNT_ID,
          bank_name: "Example Bank",
          account_name: "Ondar Example Ltd",
          account_number_last4: "1234",
          currency: "NGN",
          verification_status: "VERIFIED",
        },
        created_by_user_id: null,
        updated_by_user_id: null,
        created_at: "2026-09-25T07:00:00Z",
        updated_at: "2026-09-25T08:00:00Z",
      },
      calculation_hash: "hash-v1",
      latest_instruction: {
        id: INSTRUCTION_ID,
        organization_id: ORGANIZATION_ID,
        policy_id: POLICY_ID,
        status: "PENDING_EXTERNAL_EXECUTION",
        reserve_basis: "GROSS_POSITIVE_LIABILITY",
        execution_semantics: "ENSURE_MINIMUM_BALANCE",
        execution_authority: "EXTERNAL_TREASURY_REQUIRED",
        releases_authorized: false,
        as_of_date: "2026-09-25",
        position_from_date: "2026-09-01",
        position_to_date: "2026-09-25",
        target_reserve_balance: "15000.250000",
        currency: "NGN",
        destination_bank_account_id: BANK_ACCOUNT_ID,
        calculation_hash: "hash-v1",
        event_id: EVENT_ID,
        superseded_at: null,
        superseded_by_instruction_id: null,
        created_by_user_id: null,
        created_at: "2026-09-25T08:30:00Z",
      },
      instruction_current: true,
      execution_semantics: "ENSURE_MINIMUM_BALANCE",
      execution_authority: "EXTERNAL_TREASURY_REQUIRED",
      releases_authorized: false,
      coverage: {
        ledger_authority: "POSTED_GENERAL_LEDGER",
        finance_cutover_date: "2026-09-01",
        posting_coverage: "COMPLETE",
        unposted_tax_event_count: 0,
        accepted_tax_event_count: 2,
        posting_tax_event_count: 0,
        posting_failed_tax_event_count: 0,
        unattributed_mapped_account_line_count: 0,
        remittance_coverage: "NOT_IMPLEMENTED",
        warning_codes: [],
        warnings: [],
      },
    });

    expect(parsed.target_reserve_balance).toBe("15000.250000");
    expect(parsed.execution_authority).toBe("EXTERNAL_TREASURY_REQUIRED");
    expect(parsed.releases_authorized).toBe(false);
    expect(parsed.latest_instruction?.target_reserve_balance).toBe("15000.250000");

    expect(() =>
      taxReservePositionSchema.parse({
        ...parsed,
        target_reserve_balance: 15000.25,
      }),
    ).toThrow();

    expect(() =>
      taxReservePositionSchema.parse({
        ...parsed,
        releases_authorized: true,
      }),
    ).toThrow();
  });
});
