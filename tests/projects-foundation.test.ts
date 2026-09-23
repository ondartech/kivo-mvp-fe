import { describe, expect, it } from "vitest";

import {
  buildProjectDashboardParams,
  buildProjectListParams,
  resolveProjectCreateBranchId,
  resolveProjectReadScope,
} from "@/features/projects/branching";

describe("KIV-FE-121 Project Branch behavior", () => {
  it("uses an authorized selected Branch for Project reads", () => {
    expect(
      resolveProjectReadScope(
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

  it("allows All branches only for organization-wide Project reads", () => {
    expect(
      resolveProjectReadScope(
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

  it("auto-resolves a sole Branch-scoped Project read", () => {
    expect(
      resolveProjectReadScope(
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

  it("fails closed for multiple Branch-scoped Project reads", () => {
    expect(
      resolveProjectReadScope(
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

  it("requires a concrete Branch for creation", () => {
    const access = {
      organization_wide: true,
      branches: [{ id: "hq" }, { id: "lag" }],
    };

    expect(resolveProjectCreateBranchId(access, null)).toBeNull();
    expect(resolveProjectCreateBranchId(access, "lag")).toBe("lag");
  });

  it("auto-resolves the only available Branch for creation", () => {
    expect(
      resolveProjectCreateBranchId(
        {
          organization_wide: false,
          branches: [{ id: "hq" }],
        },
        null,
      ),
    ).toBe("hq");
  });

  it("omits a currency override from the one-call Project dashboard", () => {
    const params = buildProjectDashboardParams();

    expect(params.get("recent")).toBe("5");
    expect(params.get("activity_limit")).toBe("10");
    expect(params.has("currency")).toBe(false);
  });

  it("builds Project list filters without inventing Branch scope", () => {
    const params = buildProjectListParams({
      branchId: "lag",
      status: "ACTIVE",
      limit: 50,
      sort: "created_at:desc",
    });

    expect(params.get("branch_id")).toBe("lag");
    expect(params.get("status")).toBe("ACTIVE");
    expect(params.get("limit")).toBe("50");
    expect(params.get("sort")).toBe("created_at:desc");
  });
});
