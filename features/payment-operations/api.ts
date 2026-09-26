"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

import type {
  ApprovalPolicy,
  ApprovalRequest,
  BankAccount,
  PaymentExecution,
  PaymentExecutionQueueItem,
  PaymentObligation,
  PaymentOperationsSummary,
  PaymentReconciliationQueueItem,
  PaymentRun,
  PaymentRunOperations,
  PaymentRunTemplate,
  PaymentSafetyControl,
  TenantEmergencyPosture,
} from "./types";

function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(
      new Error(err?.message ?? `Request failed ${res.status}`),
      {
        status: res.status,
        code: err?.code,
        details: err?.details,
        requestId: err?.request_id,
      },
    );
  }
  return res.json() as Promise<T>;
}

function queryString(input: Record<string, string | number | boolean | null | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function usePaymentOperationsSummary(
  orgId: string,
  input: { currency?: string; branchId?: string | null } = {},
) {
  return useQuery<PaymentOperationsSummary>({
    queryKey: [
      "payment-operations-summary",
      orgId,
      input.currency ?? "NGN",
      input.branchId ?? null,
    ],
    queryFn: async () => {
      const suffix = queryString({
        currency: input.currency ?? "NGN",
        branch_id: input.branchId,
      });
      return handleRes<PaymentOperationsSummary>(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-operations/summary${suffix}`, {
          method: "GET",
        }),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 20_000,
    retry: 1,
  });
}

export function usePaymentObligations(
  orgId: string,
  input: {
    status?: string;
    controlStatus?: string;
    branchId?: string | null;
    currency?: string;
    obligationType?: string;
    sourceType?: string;
    limit?: number;
  } = {},
) {
  return useQuery<{ data: PaymentObligation[]; next_cursor: string | null }>({
    queryKey: ["payment-obligations", orgId, input],
    queryFn: async () => {
      const suffix = queryString({
        status: input.status,
        control_status: input.controlStatus,
        branch_id: input.branchId,
        currency: input.currency,
        obligation_type: input.obligationType,
        source_type: input.sourceType,
        limit: input.limit ?? 100,
      });
      return handleRes(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-obligations${suffix}`, {
          method: "GET",
        }),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function usePaymentRuns(
  orgId: string,
  input: {
    status?: string;
    currency?: string;
    fundingBankAccountId?: string;
    limit?: number;
  } = {},
) {
  return useQuery<{ data: PaymentRun[]; next_cursor: string | null }>({
    queryKey: ["payment-runs", orgId, input],
    queryFn: async () => {
      const suffix = queryString({
        status: input.status,
        currency: input.currency,
        funding_bank_account_id: input.fundingBankAccountId,
        limit: input.limit ?? 100,
      });
      return handleRes(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-runs${suffix}`, {
          method: "GET",
        }),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function usePaymentRunOperations(orgId: string, paymentRunId: string) {
  return useQuery<PaymentRunOperations>({
    queryKey: ["payment-run-operations", orgId, paymentRunId],
    queryFn: async () =>
      handleRes(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-runs/${paymentRunId}/operations`,
          { method: "GET" },
        ),
      ),
    enabled: isUuid(orgId) && isUuid(paymentRunId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function usePaymentExecutionQueue(
  orgId: string,
  input: { currency?: string; branchId?: string | null; limit?: number } = {},
) {
  return useQuery<{ data: PaymentExecutionQueueItem[] }>({
    queryKey: ["payment-execution-queue", orgId, input],
    queryFn: async () => {
      const suffix = queryString({
        currency: input.currency,
        branch_id: input.branchId,
        limit: input.limit ?? 100,
      });
      return handleRes(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-operations/executions${suffix}`,
          { method: "GET" },
        ),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function usePaymentReconciliationQueue(
  orgId: string,
  input: {
    currency?: string;
    branchId?: string | null;
    attentionOnly?: boolean;
    limit?: number;
  } = {},
) {
  return useQuery<{ data: PaymentReconciliationQueueItem[] }>({
    queryKey: ["payment-reconciliation-queue", orgId, input],
    queryFn: async () => {
      const suffix = queryString({
        currency: input.currency,
        branch_id: input.branchId,
        attention_only: input.attentionOnly ?? false,
        limit: input.limit ?? 100,
      });
      return handleRes(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-operations/reconciliation${suffix}`,
          { method: "GET" },
        ),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function usePaymentRunTemplates(orgId: string, active?: boolean) {
  return useQuery<{ data: PaymentRunTemplate[] }>({
    queryKey: ["payment-run-templates", orgId, active ?? null],
    queryFn: async () => {
      const suffix = queryString({ active });
      return handleRes(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-run-templates${suffix}`,
          { method: "GET" },
        ),
      );
    },
    enabled: isUuid(orgId),
    staleTime: 20_000,
    retry: 1,
  });
}

export function useBankAccounts(orgId: string) {
  return useQuery<BankAccount[]>({
    queryKey: ["bank-accounts", orgId],
    queryFn: async () =>
      handleRes(
        await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts`, {
          method: "GET",
        }),
      ),
    enabled: isUuid(orgId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePaymentApprovalPolicies(orgId: string) {
  return useQuery<{ data: ApprovalPolicy[]; next_cursor: string | null; has_more: boolean }>({
    queryKey: ["payment-run-approval-policies", orgId],
    queryFn: async () =>
      handleRes(
        await fetchWithAuth(
          `${baseUrl(orgId)}/approval-policies?active=true&object_type=PAYMENT_RUN&limit=100`,
          { method: "GET" },
        ),
      ),
    enabled: isUuid(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePendingPaymentApprovals(orgId: string) {
  return useQuery<{ data: ApprovalRequest[]; next_cursor: string | null; has_more: boolean }>({
    queryKey: ["pending-payment-run-approvals", orgId],
    queryFn: async () => {
      const result = await handleRes<{
        data: ApprovalRequest[];
        next_cursor: string | null;
        has_more: boolean;
      }>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/approval-requests/pending?limit=100`,
          { method: "GET" },
        ),
      );
      return {
        ...result,
        data: result.data.filter((item) => item.object_type === "PAYMENT_RUN"),
      };
    },
    enabled: isUuid(orgId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useTenantEmergencyPosture(orgId: string) {
  return useQuery<TenantEmergencyPosture>({
    queryKey: ["tenant-emergency-posture", orgId],
    queryFn: async () =>
      handleRes(
        await fetchWithAuth(`${baseUrl(orgId)}/safety/tenant-emergency`, {
          method: "GET",
        }),
      ),
    enabled: isUuid(orgId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function usePaymentSafetyControls(orgId: string) {
  return useQuery<{ data: PaymentSafetyControl[] }>({
    queryKey: ["payment-safety-controls", orgId],
    queryFn: async () =>
      handleRes(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-safety-controls`, {
          method: "GET",
        }),
      ),
    enabled: isUuid(orgId),
    staleTime: 10_000,
    retry: 1,
  });
}

function invalidatePayments(queryClient: ReturnType<typeof useQueryClient>, orgId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["payment-operations-summary", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["payment-obligations", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["payment-runs", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["payment-run-operations", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["payment-execution-queue", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["payment-reconciliation-queue", orgId] }),
    queryClient.invalidateQueries({ queryKey: ["pending-payment-run-approvals", orgId] }),
  ]);
}

export function useCreatePaymentRun(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name?: string;
      currency: string;
      funding_bank_account_id: string;
      scheduled_execution_date?: string;
    }) =>
      handleRes<PaymentRun>(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-runs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function useAddPaymentRunItem(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { payment_obligation_id: string; amount: string }) =>
      handleRes<PaymentRun>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-runs/${paymentRunId}/items`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function useSubmitPaymentRun(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { policy_id?: string | null; reason: string }) =>
      handleRes<ApprovalRequest>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-runs/${paymentRunId}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function usePreparePaymentExecution(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { method: "MANUAL" | "CSV_EXPORT" }) =>
      handleRes<PaymentExecution>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-runs/${paymentRunId}/executions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function useSubmitPaymentExecution(orgId: string, executionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      external_batch_reference: string;
      evidence?: Record<string, unknown>;
    }) =>
      handleRes<PaymentExecution>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-executions/${executionId}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function useReconcilePaymentInstruction(
  orgId: string,
  executionId: string,
  instructionId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      outcome: "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED";
      evidence_type: string;
      external_reference: string;
      evidence_at: string;
      settlement_reference?: string | null;
      settled_at?: string | null;
      evidence?: Record<string, unknown>;
    }) =>
      handleRes<PaymentExecution>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-executions/${executionId}/instructions/${instructionId}/reconcile`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
      ),
    onSuccess: async () => {
      await invalidatePayments(queryClient, orgId);
    },
  });
}

export function useCreatePaymentRunTemplate(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      cadence: "WEEKLY" | "MONTHLY";
      generation_rule: {
        timezone?: string;
        hour: number;
        minute: number;
        weekday?: number;
        day_of_month?: number;
      };
      planned_execution_rule?: { offset_days: number };
      funding_bank_account_id: string;
      currency: string;
      source_filters?: {
        obligation_types?: string[];
        source_types?: string[];
        branch_id?: string | null;
        due_on_or_before_execution?: boolean;
        include_undated?: boolean;
        max_items?: number;
      };
      approval_policy_id?: string | null;
    }) =>
      handleRes<PaymentRunTemplate>(
        await fetchWithAuth(`${baseUrl(orgId)}/payment-run-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["payment-run-templates", orgId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["payment-operations-summary", orgId],
      });
    },
  });
}

export function useSetPaymentRunTemplateActive(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { templateId: string; active: boolean }) =>
      handleRes<PaymentRunTemplate>(
        await fetchWithAuth(
          `${baseUrl(orgId)}/payment-run-templates/${input.templateId}/${input.active ? "resume" : "suspend"}`,
          { method: "POST" },
        ),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["payment-run-templates", orgId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["payment-operations-summary", orgId],
      });
    },
  });
}
