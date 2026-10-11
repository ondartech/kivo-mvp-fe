import { describe, expect, it } from "vitest";
import { isPublicOrganizationId, isPublicBranchId, isOrganizationRequestId } from "@/lib/public-resource-id";
import { resolvePublicOrgId } from "@/features/professional-services/identity";

const legacy = "11111111-1111-4111-8111-111111111111";
const pub = "org_" + "0".repeat(20);

describe("PRO-007D public-organization identity handoff", () => {
  it("recognizes correctly typed public organization and branch IDs", () => {
    expect(isPublicOrganizationId(pub)).toBe(true);
    expect(isPublicOrganizationId("brn_" + "0".repeat(20))).toBe(false);
    expect(isPublicBranchId("brn_" + "0".repeat(20))).toBe(true);
    expect(isPublicOrganizationId(legacy)).toBe(false);
    expect(isOrganizationRequestId(pub)).toBe(true);
    expect(isOrganizationRequestId(legacy)).toBe(true);
  });

  it("selects only the active membership matching the legacy UUID", () => {
    const ids = [
      { legacy_organization_id: "22222222-2222-4222-8222-222222222222", organization_public_id: "org_" + "A".repeat(20) },
      { legacy_organization_id: legacy, organization_public_id: pub },
    ];
    expect(resolvePublicOrgId(ids, legacy)).toBe(pub);
    expect(resolvePublicOrgId(ids, "33333333-3333-4333-8333-333333333333")).toBeNull();
  });

  it("rejects untyped/malformed IDs rather than falling back to legacy routing", () => {
    expect(resolvePublicOrgId([{legacy_organization_id: legacy, organization_public_id: legacy}],legacy)).toBeNull();
    expect(resolvePublicOrgId([],pub)).toBe(pub);
  });
});
