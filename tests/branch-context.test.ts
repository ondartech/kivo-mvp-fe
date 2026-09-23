import { describe, expect, it } from "vitest";

import { reconcileActiveBranchId } from "@/lib/experience/branch-context";

describe("Branch operating context reconciliation", () => {
  it("keeps an accessible current Branch", () => {
    expect(
      reconcileActiveBranchId(
        {
          organization_wide: false,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "lag",
      ),
    ).toBe("lag");
  });

  it("clears a stale Branch for organization-wide access", () => {
    expect(
      reconcileActiveBranchId(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "abuja",
      ),
    ).toBeNull();
  });

  it("auto-selects the only Branch for a branch-scoped membership", () => {
    expect(
      reconcileActiveBranchId(
        {
          organization_wide: false,
          branches: [{ id: "lag" }],
        },
        null,
      ),
    ).toBe("lag");
  });

  it("requires explicit choice when multiple Branches are allowed", () => {
    expect(
      reconcileActiveBranchId(
        {
          organization_wide: false,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ),
    ).toBeNull();
  });
});
