import { describe, expect, it } from "vitest";

import {
  buildFinanceActivityParams,
  resolveFinanceReadScope,
} from "@/features/finance-explorer/branching";

describe("FE-BRN-005 Finance Branch context", () => {
  it("uses an authorized selected Finance Branch", () => {
    expect(
      resolveFinanceReadScope(
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

  it("uses All branches only when Finance access is organization-wide", () => {
    expect(
      resolveFinanceReadScope(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ),
    ).toEqual({
      ready: true,
      branchId: null,
      selectionRequired: false,
    });
  });

  it("auto-resolves a sole Finance Branch", () => {
    expect(
      resolveFinanceReadScope(
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

  it("fails closed when Finance access has multiple Branches and no selection", () => {
    expect(
      resolveFinanceReadScope(
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

  it("rejects a stale global Branch against the Finance-specific access set", () => {
    expect(
      resolveFinanceReadScope(
        {
          organization_wide: false,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "abuja",
      ),
    ).toEqual({
      ready: false,
      branchId: null,
      selectionRequired: true,
    });
  });

  it("adds Branch and cursor to Account Activity requests", () => {
    const params = buildFinanceActivityParams({
      branchId: "lag",
      cursor: "next-page",
      limit: 50,
    });

    expect(params.get("branch_id")).toBe("lag");
    expect(params.get("cursor")).toBe("next-page");
    expect(params.get("limit")).toBe("50");
  });

  it("omits Branch only for an intentional organization-wide read", () => {
    const params = buildFinanceActivityParams({
      branchId: null,
      limit: 50,
    });

    expect(params.has("branch_id")).toBe(false);
    expect(params.get("limit")).toBe("50");
  });
});
