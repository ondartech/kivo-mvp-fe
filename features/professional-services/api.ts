"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

export type EngagementPattern = "RETAINER" | "PROJECT" | "TIME_BASED";
export type ProfessionalAction = {
  key: string;
  label: string;
  workspace_key: string;
  destination_key: string;
  organization_public_id: string;
  legal_entity_public_id: string | null;
  branch_public_id: string | null;
  project_public_id: string | null;
  permission_code: string;
};
export type InstallationStatus =
  | "NOT_INSTALLED" | "DEACTIVATED" | "INACTIVE" | "DRIFTED"
  | "ORG_INSTALLED_NOT_MEMBER_GRANTED" | "ACTIVE";
export type DashboardStatus =
  | "NOT_INSTALLED" | "RETIRED" | "DRIFTED"
  | "INSTALLED_CONTEXT_BLOCKED" | "AVAILABLE_IN_CONTEXT";

export type ProfessionalEffectiveWorkspace = {
  catalogue: {
    organization_id: string;
    pack_key: "professional_services";
    primary_industry_key: string | null;
    pack_recommendation_state: string;
    composition_registry_version: number;
    composition_registry_hash: string;
    engagement_patterns: Array<{
      key: EngagementPattern;
      recommendation_source: "USER_PREVIEW" | "BIZ_SIGNAL" | "NOT_DETERMINED";
      evidence_signal_keys: string[];
      suggested_catalogue_modules: string[];
      unsupported_modules: string[];
      workflow_pack_status: string | null;
    }>;
    document_families: Array<{
      key: "STATEMENT_OF_WORK" | "ENGAGEMENT_LETTER" | "PROPOSAL";
      label: string;
      source_authority: string;
      state: "SOURCE_GOVERNED_NOT_ISSUED";
    }>;
    installation: {
      state: string;
      preview_token: string | null;
      plan_path: string;
      apply_path: string;
      requires_org_write: boolean;
      requires_plan_and_transition_tokens: boolean;
      does_not_auto_activate: boolean;
    };
  };
  principal_resolution_hash: string;
  workspace_availability_fingerprint: string;
  home_resolution_hash: string;
  quick_action_resolution_hash: string;
  guided_setup_resolution_hash: string;
  sections: Array<{
    workspace_key: string;
    is_default: boolean;
    visible_widget_keys: string[];
  }>;
  authorized_actions: ProfessionalAction[];
  dashboards: Array<{
    key: string;
    version: number;
    status: DashboardStatus;
    visible_widget_keys: string[];
  }>;
  role_pack: {
    key: string; status: InstallationStatus;
    installed_version: number | null; reasons: string[];
  };
  workflow_packs: Array<{
    key: string; status: InstallationStatus;
    installed_version: number | null; reasons: string[];
  }>;
  guided_steps: Array<{
    key: string; title: string; status: string; action_key: string | null;
  }>;
  authority_boundary: "PRINCIPAL_READ_PROJECTION_NO_PERMISSION_OR_FINANCIAL_AUTHORITY";
};
export type ProfessionalTerminology = {
  registry_version: number;
  registry_hash: string;
  labels: Record<string, string>;
  resolution_hash: string;
  primary_industry_key: string | null;
  applied_packs: Array<{pack_key: string; pack_version: number; name: string}>;
};

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}
async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const problem = body?.error ?? body;
    throw Object.assign(
      new Error(problem?.message ?? `Request failed (${res.status})`),
      { status: res.status, code: problem?.code, requestId: problem?.request_id },
    );
  }
  return (await res.json()) as T;
}
export function assertEffectiveProfessionalWorkspace(
  payload: ProfessionalEffectiveWorkspace,
  orgId: string,
): ProfessionalEffectiveWorkspace {
  if (
    payload?.catalogue?.organization_id !== orgId ||
    payload?.catalogue?.pack_key !== "professional_services" ||
    payload?.authority_boundary !== "PRINCIPAL_READ_PROJECTION_NO_PERMISSION_OR_FINANCIAL_AUTHORITY" ||
    !Array.isArray(payload?.authorized_actions) ||
    !Array.isArray(payload?.sections) ||
    !Array.isArray(payload?.dashboards) ||
    !Array.isArray(payload?.guided_steps) ||
    !payload?.principal_resolution_hash
  ) {
    throw new Error("Professional Services workspace contract or organization scope mismatch.");
  }
  if (payload.authorized_actions.some(action => action.organization_public_id !== orgId)) {
    throw new Error("Professional Services action scope mismatch.");
  }
  return payload;
}

export function useProfessionalEffectiveWorkspace(
  orgId: string,
  engagementPattern: EngagementPattern | null = null,
) {
  return useQuery<ProfessionalEffectiveWorkspace>({
    queryKey: ["professional-services-effective", orgId, engagementPattern],
    queryFn: async () => {
      const query = engagementPattern
        ? `?engagement_pattern=${encodeURIComponent(engagementPattern)}`
        : "";
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/industry-packs/professional-services/workspace/effective${query}`,
        { method: "GET" },
      );
      return assertEffectiveProfessionalWorkspace(
        await parseResponse<ProfessionalEffectiveWorkspace>(response), orgId,
      );
    },
    enabled: isUuid(orgId),
    retry: false,
    staleTime: 20_000,
  });
}

export function useProfessionalTerminology(orgId: string, enabled = true) {
  return useQuery<ProfessionalTerminology>({
    queryKey: ["professional-services-terminology", orgId],
    queryFn: async () => parseResponse<ProfessionalTerminology>(
      await fetchWithAuth(`${baseUrl(orgId)}/industry-ux/terminology`, { method: "GET" }),
    ),
    enabled: enabled && isUuid(orgId),
    retry: false,
    staleTime: 60_000,
  });
}
