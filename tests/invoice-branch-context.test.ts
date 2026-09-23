import { describe, expect, it } from "vitest";

import {
  buildInvoiceListParams,
  resolveInvoiceCreateBranchId,
} from "@/features/invoices/branching";

describe("FE-BRN-002 invoice Branch context", () => {
  it("filters invoice lists only when a Branch is selected", () => {
    expect(
      buildInvoiceListParams({ branchId: "branch-hq" }).get("branch_id"),
    ).toBe("branch-hq");
    expect(
      buildInvoiceListParams({ branchId: null }).has("branch_id"),
    ).toBe(false);
  });

  it("uses the selected Branch for creation", () => {
    expect(
      resolveInvoiceCreateBranchId(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "lag",
      ),
    ).toBe("lag");
  });

  it("rejects a stale selected Branch", () => {
    expect(
      resolveInvoiceCreateBranchId(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        "abuja",
      ),
    ).toBeNull();
  });

  it("defaults creation only when exactly one Branch exists", () => {
    expect(
      resolveInvoiceCreateBranchId(
        {
          organization_wide: true,
          branches: [{ id: "hq" }],
        },
        null,
      ),
    ).toBe("hq");

    expect(
      resolveInvoiceCreateBranchId(
        {
          organization_wide: true,
          branches: [{ id: "hq" }, { id: "lag" }],
        },
        null,
      ),
    ).toBeNull();
  });
});
