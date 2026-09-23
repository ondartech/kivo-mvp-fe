import { describe, expect, it } from "vitest";

import {
  buildDashboardParams,
  resolveDashboardReadScope,
} from "@/features/dashboard/branching";

describe("FE-BRN-004 dashboard Branch context", () => {
  it("uses an authorized selected Branch", () => {
    expect(
      resolveDashboardReadScope(
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

  it("allows Organization-wide dashboard only when server access permits it", () => {
    expect(
      resolveDashboardReadScope(
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

  it("auto-resolves one Branch-scoped assignment", () => {
    expect(
      resolveDashboardReadScope(
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

  it("fails closed for multiple Branch-scoped choices", () => {
    expect(
      resolveDashboardReadScope(
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

  it("does not send branch_id for an Organization-wide dashboard", () => {
    const all = buildDashboardParams({ branchId: null, currency: "NGN" });
    expect(all.get("currency")).toBe("NGN");
    expect(all.has("branch_id")).toBe(false);

    const lag = buildDashboardParams({ branchId: "lag", currency: "NGN" });
    expect(lag.get("branch_id")).toBe("lag");
  });
});
