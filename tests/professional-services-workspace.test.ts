import { describe, expect, it } from "vitest";

import { assertEffectiveProfessionalWorkspace } from "@/features/professional-services/api";
import type {
  EngagementPattern, ProfessionalAction, ProfessionalEffectiveWorkspace,
} from "@/features/professional-services/api";
import {
  engagementSections, findAuthorizedAction, financialLifecycleNotes,
  relevantProfessionalPattern, safeProfessionalActionHref, terminologyLabel,
} from "@/features/professional-services/workspace";

const orgId = "org_" + "0".repeat(20);
const otherOrgId = "org_" + "A".repeat(20);

function action(overrides: Partial<ProfessionalAction> = {}): ProfessionalAction {
  return {
    key: "create-project", label: "Create project",
    workspace_key: "sales", destination_key: "projects.create",
    organization_public_id: orgId,
    legal_entity_public_id: null, branch_public_id: null,
    project_public_id: null, permission_code: "projects:write",
    ...overrides,
  };
}

function workspace(signals: EngagementPattern[]): ProfessionalEffectiveWorkspace {
  return {
    catalogue: {
      organization_id: orgId, pack_key: "professional_services",
      primary_industry_key: "professional_services",
      composition_registry_version: 1, composition_registry_hash: "a".repeat(64),
      pack_recommendation_state: "AVAILABLE_FOR_PLANNING",
      engagement_patterns: (["PROJECT", "RETAINER", "TIME_BASED"] as EngagementPattern[]).map(key => ({
        key, recommendation_source: signals.includes(key) ? "BIZ_SIGNAL" : "NOT_DETERMINED",
        evidence_signal_keys: signals.includes(key) ? ["source_evidence"] : [],
        suggested_catalogue_modules: [], unsupported_modules: [],
        workflow_pack_status: null,
      })),
      document_families: [],
      installation: {
        state: "AVAILABLE_FOR_PLANNING", preview_token: "cmp-preview",
        plan_path: "/plan", apply_path: "/apply",
        requires_org_write: true, requires_plan_and_transition_tokens: true,
        does_not_auto_activate: true,
      },
    },
    authority_boundary: "PRINCIPAL_READ_PROJECTION_NO_PERMISSION_OR_FINANCIAL_AUTHORITY",
    principal_resolution_hash: "f".repeat(64),
    home_resolution_hash: "e".repeat(64),
    workspace_availability_fingerprint: "d".repeat(64),
    quick_action_resolution_hash: "c".repeat(64),
    guided_setup_resolution_hash: "b".repeat(64),
    authorized_actions: [], sections: [], dashboards: [],
    role_pack: { key: "professional-services", status: "NOT_INSTALLED", installed_version: null, reasons: [] },
    workflow_packs: [], guided_steps: [],
  };
}

describe("PRO-007C authorized actions", () => {
  it("accepts only known implemented destinations and the exact requested tenant", () => {
    expect(safeProfessionalActionHref(action(), orgId, null)).toBe("/app/projects/new");
    expect(safeProfessionalActionHref(action(), otherOrgId, null)).toBeNull();
    expect(safeProfessionalActionHref(action({ destination_key: "invoicing.create" }), orgId, null)).toBeNull();
    expect(safeProfessionalActionHref(action({ key: "create-contract", destination_key: "contracts.create" }), orgId, null)).toBeNull();
    expect(safeProfessionalActionHref(action({ key: "delete-everything" }), orgId, null)).toBeNull();
  });

  it("does not silently change Branch context and never manufactures unauthorized actions", () => {
    const scoped = action({ branch_public_id: "branch_one" });
    expect(safeProfessionalActionHref(scoped, orgId, "branch_two")).toBeNull();
    expect(safeProfessionalActionHref(scoped, orgId, null)).toBeNull();
    expect(safeProfessionalActionHref(scoped, orgId, "branch_one")).toBe("/app/projects/new");
    expect(findAuthorizedAction([], "create-project", orgId, null)).toBeNull();
    expect(findAuthorizedAction([action()], "create-invoice", orgId, null)).toBeNull();
  });
});

describe("PRO-007C engagement presentation", () => {
  it("keeps time/retainer/project models distinct and never treats acceptance as earned revenue", () => {
    const project = engagementSections("PROJECT");
    const retainer = engagementSections("RETAINER");
    const time = engagementSections("TIME_BASED");
    expect(project.some(x => x.key === "review")).toBe(true);
    expect(retainer.some(x => x.key === "retainer")).toBe(true);
    expect(time.some(x => x.key === "delivery" && x.title.includes("Time"))).toBe(true);
    expect(project.every(x => x.owner.length > 0)).toBe(true);
    expect(financialLifecycleNotes()).toContain("Accepted delivery is not automatically earned revenue.");
  });

  it("uses BIZ signals only when unambiguous; user preview is not an activation", () => {
    expect(relevantProfessionalPattern(workspace(["PROJECT"]), null)).toBe("PROJECT");
    expect(relevantProfessionalPattern(workspace(["PROJECT", "RETAINER"]), null)).toBeNull();
    expect(relevantProfessionalPattern(workspace([]), null)).toBeNull();
    expect(relevantProfessionalPattern(workspace(["PROJECT"]), "TIME_BASED")).toBe("TIME_BASED");
  });

  it("uses IUX terminology evidence, falling back to canonical labels only", () => {
    expect(terminologyLabel(undefined, "party.customer", "Customer")).toBe("Customer");
    expect(terminologyLabel({labels: {"party.customer": "Client"}} as never, "party.customer", "Customer")).toBe("Client");
  });
});

describe("PRO-007C effective-contract failure modes", () => {
  it("fails closed for wrong organizations and missing finance/access boundary", () => {
    expect(assertEffectiveProfessionalWorkspace(workspace([]), orgId).catalogue.organization_id).toBe(orgId);
    expect(() => assertEffectiveProfessionalWorkspace(workspace([]), otherOrgId)).toThrow();
    const forged = {
      ...workspace([]), authority_boundary: "CATALOGUE_ONLY",
    } as unknown as ProfessionalEffectiveWorkspace;
    expect(() => assertEffectiveProfessionalWorkspace(forged, orgId)).toThrow();
  });

  it("never accepts an authorized deep link from another organization", () => {
    const altered = { ...workspace([]), authorized_actions: [action({organization_public_id: otherOrgId})] };
    expect(() => assertEffectiveProfessionalWorkspace(altered, orgId)).toThrow();
  });
});
