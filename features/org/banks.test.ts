import { describe, expect, it } from "vitest";
import { NIGERIAN_BANKS_DEDUPED, findBankByCode } from "./banks";

describe("NIGERIAN_BANKS_DEDUPED — static controlled list (no Paystack live dependency)", () => {
  it("is non-empty and de-duplicated by code", () => {
    expect(NIGERIAN_BANKS_DEDUPED.length).toBeGreaterThan(15);
    const codes = NIGERIAN_BANKS_DEDUPED.map((b) => b.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("contains canonical codes for verification (GTB 058, Access 044, FirstBank 011, Zenith 057, UBA 033, Union 032)", () => {
    for (const code of ["058", "044", "011", "057", "033", "032"]) {
      expect(findBankByCode(code)).toBeDefined();
    }
  });

  it("returns undefined for unknown code (no free-text fallback)", () => {
    expect(findBankByCode("999")).toBeUndefined();
    expect(findBankByCode("")).toBeUndefined();
  });

  it("is sorted by name (deterministic UI)", () => {
    const names = NIGERIAN_BANKS_DEDUPED.map((b) => b.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
