import { describe, expect, it } from "vitest";

import type { ProjectMilestone } from "@/features/projects/api";
import {
  canCompleteMilestone,
  canPrepareMilestoneInvoice,
  milestoneBillingLabel,
  milestoneBillingVariant,
  milestonePrepareErrorMessage,
} from "@/features/projects/milestones";

function milestone(
  overrides: Partial<ProjectMilestone> = {},
): ProjectMilestone {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    organization_id: "00000000-0000-0000-0000-000000000002",
    project_id: "00000000-0000-0000-0000-000000000003",
    sequence: 1,
    name: "Technical rehearsal",
    description: null,
    completion_status: "PENDING",
    billing_status: "NOT_BILLABLE",
    billing_type: null,
    billing_percentage: null,
    billing_amount: null,
    due_date: null,
    completed_at: null,
    created_at: "2026-09-23T12:00:00Z",
    updated_at: "2026-09-23T12:00:00Z",
    ...overrides,
  };
}

describe("KIV-FE-140 Milestone operations", () => {
  it("allows completion only while the Milestone is pending", () => {
    expect(canCompleteMilestone(milestone())).toBe(true);
    expect(
      canCompleteMilestone(
        milestone({ completion_status: "COMPLETED" }),
      ),
    ).toBe(false);
  });

  it("allows invoice preparation only for completed ready Milestones", () => {
    const ready = milestone({
      completion_status: "COMPLETED",
      billing_status: "READY",
      billing_type: "FIXED",
      billing_amount: "2500000.00",
    });

    expect(canPrepareMilestoneInvoice(ready)).toBe(true);
    expect(milestoneBillingLabel(ready.billing_status)).toBe("Ready to bill");
    expect(milestoneBillingVariant(ready.billing_status)).toBe("warning");
  });

  it("does not allow another prepare after invoicing", () => {
    expect(
      canPrepareMilestoneInvoice(
        milestone({
          completion_status: "COMPLETED",
          billing_status: "INVOICED",
        }),
      ),
    ).toBe(false);
  });

  it("surfaces acceptance and Order billing gates explicitly", () => {
    expect(
      milestonePrepareErrorMessage(
        Object.assign(new Error("blocked"), { code: "ACCEPTANCE_PENDING" }),
      ),
    ).toContain("acceptance is still pending");

    expect(
      milestonePrepareErrorMessage(
        Object.assign(new Error("blocked"), { code: "ACCEPTANCE_REJECTED" }),
      ),
    ).toContain("acceptance was rejected");

    expect(
      milestonePrepareErrorMessage(
        Object.assign(new Error("blocked"), { code: "ORDER_BILLING_REQUIRED" }),
      ),
    ).toContain("through the Order");
  });
});
