"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isPublicOrganizationId } from "@/lib/public-resource-id";

export type PlanningAuthoritySlot = {
  status: "NOT_AVAILABLE_UNMAPPED" | "SOURCE_VERIFIED" | "SOURCE_CHANGED";
  source: string;
  authority: string;
  amount: string | null;
  currency: string | null;
  as_of: string | null;
};

export type PlanningUnit = {
  unit_id: string;
  unit_name: string;
  legal_entity_id: string;
  manager_user_id: string;
  plan_packs: Array<{
    id: string;
    scenario_id: string | null;
    plan_id: string | null;
    source_integrity: string;
    authority: string;
  }>;
  target_issues: Array<{
    id: string;
    target_key: string;
    version: number;
    authority: string;
    source_integrity: string;
    lines: Array<{
      category_key: string;
      period_key: string;
      currency: string;
      amount: string;
    }>;
  }>;
  submissions: Array<{
    id: string;
    version: number;
    status: string;
    submitted_at: string;
  }>;
  manager_reviews: Array<{id: string; status: string; authority: string}>;
  finance_reviews: Array<{id: string; status: string; authority: string}>;
  consolidation: {id: string; status: string; authority: string} | null;
  replanning: Array<{
    id: string;
    status: string;
    effective_date: string;
    baseline_signoff_id: string;
    authority: string;
  }>;
  planning_target_variances: Array<{
    unit_id: string;
    category_key: string;
    period_key: string;
    currency: string;
    target_amount: string | null;
    proposed_amount: string | null;
    variance_amount: string | null;
    status: string;
    authority: string;
  }>;
  initiatives: Array<{id: string; version: number; status: string; authority: string}>;
  dependencies: Array<{id: string; dependency_key: string; revision: number; status: string; authority: string}>;
  discussions: Array<{id: string; topic: string; status: string; authority: string}>;
  blockers: string[];
  outstanding_actions: string[];
  source_integrity: "SNAPSHOT_VERIFIED" | "SOURCE_CHANGED" | "NOT_VERIFIED";
};

export type PlanningWorkspace = {
  campaign_id: string;
  campaign_status: string;
  campaign_kind: string;
  cycle_id: string;
  campaign_as_of: string;
  submission_due_at: string;
  review_due_at: string;
  roster_hash: string;
  viewed_as: "DEPARTMENT_MANAGER" | "FINANCE_REVIEWER" | "CORPORATE_APPROVER";
  units: PlanningUnit[];
  financial_sources: Record<string, PlanningAuthoritySlot>;
  corporate_signoff: {id: string; status: string; quorum: number; authority: string} | null;
  generated_at: string;
  authority: "WORKSPACE_PROJECTION_NO_SPEND_AUTHORITY";
};

export type PlanningInbox = {
  items: Array<{
    campaign_id: string;
    unit_ids: string[];
    viewed_as: string;
    submission_due_at: string;
    review_due_at: string;
  }>;
  has_more: boolean;
  next_cursor: string | null;
};

export function planningWorkspaceBase(orgPublicId: string) {
  if (!isPublicOrganizationId(orgPublicId)) return null;
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${encodeURIComponent(orgPublicId)}/department-planning`;
}

async function response<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? `Planning request failed (${res.status})`), {
      status: res.status,
      code: err?.code,
    });
  }
  return (await res.json()) as T;
}

export function usePlanningInbox(orgPublicId: string, cursor: string | null = null) {
  const base = planningWorkspaceBase(orgPublicId);
  return useQuery<PlanningInbox>({
    queryKey: ["dplan-workspace-inbox", orgPublicId, cursor],
    enabled: Boolean(base),
    queryFn: async () => response<PlanningInbox>(
      await fetchWithAuth(`${base}/workspace/inbox?limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, {method: "GET", cache: "no-store"}),
    ),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function usePlanningWorkspace(orgPublicId: string, campaignId: string) {
  const base = planningWorkspaceBase(orgPublicId);
  return useQuery<PlanningWorkspace>({
    queryKey: ["dplan-campaign-workspace", orgPublicId, campaignId],
    enabled: Boolean(base && campaignId),
    queryFn: async () => response<PlanningWorkspace>(
      await fetchWithAuth(
        `${base}/campaigns/${encodeURIComponent(campaignId)}/workspace`,
        {method: "GET", cache: "no-store"},
      ),
    ),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// A financial slot lacking a certified source is never a zero amount.
export function financialValue(slot: PlanningAuthoritySlot | undefined): string {
  if (!slot || slot.status !== "SOURCE_VERIFIED" ||
      slot.amount == null || !/^[A-Z]{3}$/.test(slot.currency ?? "")) {
    return "Not available — source mapping required";
  }
  return `${slot.currency} ${slot.amount}`;
}

export function planningComparison(
  amount: string | null,
  currency: string,
): string {
  return amount === null ? "Not comparable" : `${currency} ${amount}`;
}

export function labelState(code: string): string {
  return code.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase());
}
