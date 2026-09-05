"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";

export type PlanCode = "STARTER" | "PROFESSIONAL" | "BUSINESS";

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  tier: number;
  monthly_price: string;
  currency: string;
  default_capabilities: Record<string, boolean>;
  default_limits: Record<string, number | null>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan: Plan;
  status: "TRIAL" | "ACTIVE" | "CANCELLED" | "PAST_DUE";
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
}

export interface EffectiveEntitlements {
  organization_id: string;
  plan_code: PlanCode;
  plan_name: string;
  status: string;
  capabilities: Record<string, boolean>;
  limits: Record<string, number | null>;
}

const DEFAULT_STARTER_PLAN: Plan = {
  id: "00000000-0000-0000-0000-000000000001",
  code: "STARTER",
  name: "Starter",
  tier: 1,
  monthly_price: "2500.000000",
  currency: "NGN",
  default_capabilities: {
    "workspace.enabled": true,
    "customers.enabled": true,
    "invoicing.enabled": true,
    "invoice.public_page": true,
    "invoice.pdf": true,
    "invoice.tracking": true,
    "payments.manual": true,
    "payments.online": true,
    "payments.links": true,
    "receivables.enabled": true,
    "receivables.overdue_tracking": true,
    "reminders.basic": true,
    "quotes.enabled": false,
    "projects.enabled": false,
    "milestones.enabled": false,
  },
  default_limits: {
    "users.max": 1,
    "projects.max": 0,
    "entities.max": 1,
  },
  is_active: true,
};

export function useSubscription(orgId: string) {
  return useQuery<Subscription>({
    queryKey: ["organizations", orgId, "subscription"],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(
          `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}/subscription`,
          { method: "GET" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load subscription: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        // Fallback for standalone / mock execution
        const now = new Date();
        const end = new Date(now.getTime() + 30 * 86400000);
        const trialEnd = new Date(now.getTime() + 14 * 86400000);
        return {
          id: "sub-demo",
          organization_id: orgId,
          plan: DEFAULT_STARTER_PLAN,
          status: "TRIAL",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
          cancel_at_period_end: false,
        };
      }
    },
    staleTime: 60_000,
  });
}

export function useEntitlements(orgId: string) {
  return useQuery<EffectiveEntitlements>({
    queryKey: ["organizations", orgId, "entitlements"],
    queryFn: async () => {
      try {
        const res = await fetchWithAuth(
          `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}/entitlements`,
          { method: "GET" }
        );
        if (!res.ok) {
          throw new Error(`Failed to load entitlements: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        return {
          organization_id: orgId,
          plan_code: "STARTER",
          plan_name: "Starter",
          status: "TRIAL",
          capabilities: DEFAULT_STARTER_PLAN.default_capabilities,
          limits: DEFAULT_STARTER_PLAN.default_limits,
        };
      }
    },
    staleTime: 60_000,
  });
}

export function useChangePlan(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation<Subscription, Error, { plan_code: PlanCode }>({
    mutationFn: async ({ plan_code }) => {
      const res = await fetchWithAuth(
        `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}/subscription/change-plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_code }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body?.error ?? body;
        throw Object.assign(new Error(err?.message ?? "Failed to change plan"), {
          code: err?.code,
        });
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["organizations", orgId, "subscription"], data);
      queryClient.invalidateQueries({ queryKey: ["organizations", orgId, "entitlements"] });
    },
  });
}
