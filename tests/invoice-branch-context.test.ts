import { describe, expect, it } from "vitest";

import { buildInvoiceListSearchParams } from "@/features/invoicing/api";
import { resolveInvoiceCreateBranchId } from "@/features/invoicing/branch-context";

describe("FE-BRN-002 Invoice Branch consumption", () => {
  it("uses the current valid form Branch before other defaults", () => {
    expect(
      resolveInvoiceCreateBranchId(["hq", "lag"], "hq", "lag"),
    ).toBe("lag");
  });

  it("defaults a new Invoice to the active operating Branch", () => {
    expect(
      resolveInvoiceCreateBranchId(["hq", "lag"], "lag", null),
    ).toBe("lag");
  });

  it("defaults the only accessible Branch even in Organization-wide context", () => {
    expect(resolveInvoiceCreateBranchId(["hq"], null, null)).toBe("hq");
  });

  it("requires explicit selection when several Branches exist and none is active", () => {
    expect(
      resolveInvoiceCreateBranchId(["hq", "lag"], null, null),
    ).toBeNull();
  });

  it("drops a stale current Branch and falls back to the active Branch", () => {
    expect(
      resolveInvoiceCreateBranchId(["hq", "lag"], "hq", "old"),
    ).toBe("hq");
  });

  it("adds branch_id to Invoice list queries only for a concrete Branch context", () => {
    const scoped = buildInvoiceListSearchParams({
      branchId: "11111111-1111-4111-8111-111111111111",
      documentState: "ISSUED",
      limit: 20,
    });
    expect(scoped.get("branch_id")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(scoped.get("document_state")).toBe("ISSUED");

    const organizationWide = buildInvoiceListSearchParams({
      branchId: null,
      limit: 20,
    });
    expect(organizationWide.has("branch_id")).toBe(false);
  });
});
