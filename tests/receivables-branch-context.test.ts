import { describe, expect, it } from "vitest";

import {
  buildReceivableListParams,
  resolveReceivableReadScope,
} from "@/features/receivables/branching";

describe("FE-BRN-003 receivables Branch context", () => {
  it("uses an authorized selected Branch", () => {
    expect(
      resolveReceivableReadScope(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "lag",
      ),
    ).toEqual({
      ready: true,
      branchId: "lag",
      selectionRequired: false,
    });
  });

  it("falls back to organization-wide only when allowed", () => {
    expect(
      resolveReceivableReadScope(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "stale",
      ),
    ).toEqual({
      ready: true,
      branchId: null,
      selectionRequired: false,
    });
  });

  it("auto-resolves a sole Branch-scoped assignment", () => {
    expect(
      resolveReceivableReadScope(
        {
          organization_wide: false,
          branches: [{ id: "hq" }],
        },
        null,
      ),
    ).toEqual({
      ready: true,
      branchId: "hq",
      selectionRequired: false,
    });
  });

  it("fails closed when Branch-scoped access has multiple choices", () => {
    expect(
      resolveReceivableReadScope(
        {
          organization_wide: false,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ),
    ).toEqual({
      ready: false,
      branchId: null,
      selectionRequired: true,
    });
  });

  it("adds Branch and collection filters to list requests", () => {
    const params = buildReceivableListParams({
      branchId: "lag",
      collectionState: "OVERDUE",
      currency: "NGN",
    });
    expect(params.get("branch_id")).toBe("lag");
    expect(params.get("collection_state")).toBe("OVERDUE");
    expect(params.get("currency")).toBe("NGN");
  });
});
