import {describe, expect, it} from "vitest";
import {
  financialValue, planningComparison, planningWorkspaceBase, labelState,
  type PlanningAuthoritySlot,
} from "@/features/department-planning/api";

const orgId = "org_" + "0".repeat(20);

function slot(overrides: Partial<PlanningAuthoritySlot> = {}): PlanningAuthoritySlot {
  return {
    status: "NOT_AVAILABLE_UNMAPPED",
    source: "BUD",
    authority: "INDEPENDENT_SOURCE_REQUIRED",
    amount: null,
    currency: null,
    as_of: null,
    ...overrides,
  };
}

describe("DPLAN-016 financial authority display", () => {
  it("never renders missing/unmapped or tampered currency as a zero balance", () => {
    expect(financialValue(slot())).toContain("Not available");
    expect(financialValue(slot({amount:"0.000000"}))).toContain("Not available");
    expect(financialValue(slot({status:"SOURCE_CHANGED",amount:"250.000000",currency:"NGN"}))).toContain("Not available");
    expect(financialValue(slot({status:"SOURCE_VERIFIED",amount:"100.000000",currency:"naira"}))).toContain("Not available");
  });
  it("only renders expressly source-verified amounts without altering Decimal strings", () => {
    expect(financialValue(slot({
      status:"SOURCE_VERIFIED",currency:"NGN",amount:"55000000.000000"
    }))).toBe("NGN 55000000.000000");
  });
  it("distinguishes incompatible comparisons from genuine zero", () => {
    expect(planningComparison(null,"NGN")).toBe("Not comparable");
    expect(planningComparison("0.000000","NGN")).toBe("NGN 0.000000");
  });
});

describe("DPLAN-016 tenant/public resource boundary", () => {
  it("uses the verified public org identity only, not a legacy UUID or guessed ID", () => {
    expect(planningWorkspaceBase(orgId)).toContain("/api/v1/organizations/"+orgId+"/department-planning");
    expect(planningWorkspaceBase("11111111-1111-4111-8111-111111111111")).toBeNull();
    expect(planningWorkspaceBase("org_wrong")).toBeNull();
    expect(planningWorkspaceBase("")).toBeNull();
  });
  it("labels workflow statuses without turning them into spending approvals", () => {
    expect(labelState("SUBMITTED_NOT_APPROVED")).toBe("Submitted Not Approved");
    expect(labelState("SIGNOFF_NOT_BUDGET")).toBe("Signoff Not Budget");
  });
});
