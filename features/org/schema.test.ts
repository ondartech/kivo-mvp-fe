import { describe, expect, it } from "vitest";
import { bankAccountCreateSchema, businessProfileSchema, cacLookupSchema } from "./schema";
describe("bankAccountCreateSchema — 10-digit NUBAN + zero-BVN strict", () => {
  const valid = {
    bank_code: "058",
    bank_name: "Guaranty Trust Bank",
    account_number: "0123456789",
    account_name: "Maro Labs Ltd",
    currency: "NGN" as const,
    is_default: false,
  };
  it("accepts valid 10-digit NUBAN", () => {
    expect(bankAccountCreateSchema.parse(valid)).toEqual(valid);
  });
  it("rejects non-10-digit account numbers", () => {
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_number: "01234567" })).toThrow();
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_number: "01234567890" })).toThrow();
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_number: "01234abc89" })).toThrow();
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_number: "" })).toThrow();
  });
  it("rejects bvn field (strict — zero-BVN invariant, BE extra=forbid)", () => {
    expect(() => bankAccountCreateSchema.parse({ ...valid, bvn: "12345678901" } as unknown as typeof valid)).toThrow();
  });
  it("rejects unknown fields broadly (extra=forbid mirror)", () => {
    expect(() => bankAccountCreateSchema.parse({ ...valid, extra: "field" } as unknown as typeof valid)).toThrow();
  });
  it("requires bank_code + bank_name pair", () => {
    expect(() => bankAccountCreateSchema.parse({ ...valid, bank_code: "" })).toThrow();
    expect(() => bankAccountCreateSchema.parse({ ...valid, bank_name: "" })).toThrow();
  });
  it("requires account_name", () => {
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_name: "" })).toThrow();
    expect(() => bankAccountCreateSchema.parse({ ...valid, account_name: "A" })).toThrow();
  });
});
describe("businessProfileSchema — KIV-FE-016 extra=forbid, legal_name required", () => {
  const base = {
    legal_name: "Maro Labs Ltd",
    business_structure: "UNREGISTERED" as const,
    trading_name: "Maro",
    email: "hello@maro.ng",
    address: { line1: "1 Marina", city: "Lagos", country_code: "NG" as const },
  };
  it("accepts minimal valid profile (legal_name only)", () => {
    expect(businessProfileSchema.parse({ legal_name: "Maro Labs Ltd" })).toMatchObject({ legal_name: "Maro Labs Ltd" });
  });
  it("accepts full profile with address", () => {
    expect(() => businessProfileSchema.parse(base)).not.toThrow();
  });
  it("rejects empty legal_name", () => {
    expect(() => businessProfileSchema.parse({ legal_name: "" })).toThrow();
  });
  it("rejects registration fields (written only by confirm, extra=forbid)", () => {
    expect(() => businessProfileSchema.parse({ legal_name: "A", registration_type: "RC" } as unknown as Record<string, unknown>)).toThrow();
    expect(() => businessProfileSchema.parse({ legal_name: "A", registration_number: "123" } as unknown as Record<string, unknown>)).toThrow();
  });
  it("rejects unknown fields broadly", () => {
    expect(() => businessProfileSchema.parse({ legal_name: "A", bvn: "123" } as unknown as Record<string, unknown>)).toThrow();
  });
});
describe("cacLookupSchema — RC|BN|IT|LLP|OTHER + identifier 2..100 strict", () => {
  it("accepts RC and BN", () => {
    expect(cacLookupSchema.parse({ identifier_type: "RC", identifier: "1234567" })).toEqual({ identifier_type: "RC", identifier: "1234567" });
    expect(cacLookupSchema.parse({ identifier_type: "BN", identifier: "BN987654" })).toBeTruthy();
  });
  it("rejects unknown identifier_type", () => {
    expect(() => cacLookupSchema.parse({ identifier_type: "XX" as unknown as string, identifier: "123" })).toThrow();
  });
  it("rejects short identifier (<2)", () => {
    expect(() => cacLookupSchema.parse({ identifier_type: "RC", identifier: "1" })).toThrow();
    expect(() => cacLookupSchema.parse({ identifier_type: "RC", identifier: "" })).toThrow();
  });
  it("rejects extra fields (extra=forbid)", () => {
    expect(() => cacLookupSchema.parse({ identifier_type: "RC", identifier: "123", legal_name: "Maro" } as unknown as Record<string, unknown>)).toThrow();
  });
});
