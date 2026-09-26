"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import { isOrganizationId } from "@/features/foundation/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import {
  approvalRequestSchema,
  bankAccountSchema,
  executionQueueSchema,
  paymentExecutionSchema,
  paymentObligationListSchema,
  paymentOperationsSummarySchema,
  paymentRunItemDetailSchema,
  paymentRunListSchema,
  paymentRunOperationsSchema,
  paymentRunPreviewSchema,
  paymentRunSchema,
  paymentRunTemplateListSchema,
  paymentRunTemplateSchema,
  reconciliationQueueSchema,
  workflowDefinitionDetailSchema,
  workflowDefinitionSchema,
  workflowDeliverySchema,
  workflowTriggerSchema,
  workflowVersionSchema,
  type PaymentRun,
} from "./schema";

const nullableStringSchema = z.string().nullable();

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

function requireOrganizationId(orgId: string): void {
  if (!isOrganizationId(orgId)) {
    throw new Error(
      "Organization context is not available. Select a workspace and try again.",
    );
  }
}

export type PaymentApiError = Error & {
  status?: number;
  code?: string;
  details?: unknown;
  requestId?: string;
};

async function parseResponse<T>(
  response: Response,
  parse: (value: unknown) => T,
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const root =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const nested =
      root.error && typeof root.error === "object"
        ? (root.error as Record<string, unknown>)
        : root;
    throw Object.assign(
      new Error(
        typeof nested.message === "string"
          ? nested.message
          : `Request failed with HTTP ${response.status}`,
      ),
      {
        status: response.status,
        code: typeof nested.code === "string" ? nested.code : undefined,
        details: nested.details,
        requestId:
          typeof nested.request_id === "string" ? nested.request_id : undefined,
      },
    ) as PaymentApiError;
  }
  return parse(body);
}

function jsonHeaders(
  idempotencyKey?: string,
  stepUpToken?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  if (stepUpToken) headers["X-Step-Up-Token"] = stepUpToken;
  return headers;
}

function invalidatePaymentOperations(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["payment-operations", orgId] });
  void queryClient.invalidateQueries({ queryKey: ["payment-runs", orgId] });
  void queryClient.invalidateQueries({
    queryKey: ["payment-obligations", orgId],
  });
}

export function useBankAccounts(orgId: string) {
  return useQuery({
    queryKey: ["bank-accounts", orgId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts`, {
        method: "GET",
      });
      return parseResponse(response, (value) =>
        z.array(bankAccountSchema).parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function usePaymentObligations(
  orgId: string,
  opts: {
    status?: string | null;
    controlStatus?: string | null;
    branchId?: string | null;
    currency?: string | null;
    cursor?: string | null;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: [
      "payment-obligations",
      orgId,
      opts.status ?? null,
      opts.controlStatus ?? null,
      opts.branchId ?? null,
      opts.currency ?? null,
      opts.cursor ?? null,
      opts.limit ?? 50,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams();
      if (opts.status) params.set("status", opts.status);
      if (opts.controlStatus) params.set("control_status", opts.controlStatus);
      if (opts.branchId) params.set("branch_id", opts.branchId);
      if (opts.currency) params.set("currency", opts.currency);
      if (opts.cursor) params.set("cursor", opts.cursor);
      params.set("limit", String(opts.limit ?? 50));
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-obligations?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        paymentObligationListSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
    placeholderData: (previous) => previous,
  });
}

export function usePaymentOperationsSummary(
  orgId: string,
  opts: { currency?: string; branchId?: string | null } = {},
) {
  return useQuery({
    queryKey: [
      "payment-operations",
      orgId,
      "summary",
      opts.currency ?? "NGN",
      opts.branchId ?? null,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams({
        currency: opts.currency ?? "NGN",
      });
      if (opts.branchId) params.set("branch_id", opts.branchId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-operations/summary?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        paymentOperationsSummarySchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function usePaymentRuns(
  orgId: string,
  opts: {
    status?: string | null;
    currency?: string | null;
    fundingBankAccountId?: string | null;
    archiveState?: "active" | "archived" | "all";
    cursor?: string | null;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: [
      "payment-runs",
      orgId,
      opts.status ?? null,
      opts.currency ?? null,
      opts.fundingBankAccountId ?? null,
      opts.archiveState ?? "active",
      opts.cursor ?? null,
      opts.limit ?? 30,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams({
        archive_state: opts.archiveState ?? "active",
        limit: String(opts.limit ?? 30),
      });
      if (opts.status) params.set("status", opts.status);
      if (opts.currency) params.set("currency", opts.currency);
      if (opts.fundingBankAccountId) {
        params.set("funding_bank_account_id", opts.fundingBankAccountId);
      }
      if (opts.cursor) params.set("cursor", opts.cursor);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => paymentRunListSchema.parse(value));
    },
    enabled: isOrganizationId(orgId),
    placeholderData: (previous) => previous,
  });
}

export function usePaymentRunOperations(orgId: string, paymentRunId: string) {
  return useQuery({
    queryKey: ["payment-run", orgId, paymentRunId, "operations"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/operations`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        paymentRunOperationsSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId) && Boolean(paymentRunId),
  });
}

export function usePaymentRunItemDetail(
  orgId: string,
  paymentRunId: string,
  itemId: string,
  opts: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["payment-run", orgId, paymentRunId, "item", itemId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/items/${itemId}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        paymentRunItemDetailSchema.parse(value),
      );
    },
    enabled:
      isOrganizationId(orgId) &&
      Boolean(paymentRunId) &&
      Boolean(itemId) &&
      (opts.enabled ?? true),
  });
}

export function usePaymentExecutionQueue(
  orgId: string,
  opts: { currency?: string; branchId?: string | null; limit?: number } = {},
) {
  return useQuery({
    queryKey: [
      "payment-operations",
      orgId,
      "executions",
      opts.currency ?? "NGN",
      opts.branchId ?? null,
      opts.limit ?? 100,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams({
        currency: opts.currency ?? "NGN",
        limit: String(opts.limit ?? 100),
      });
      if (opts.branchId) params.set("branch_id", opts.branchId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-operations/executions?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => executionQueueSchema.parse(value));
    },
    enabled: isOrganizationId(orgId),
  });
}

export function usePaymentReconciliationQueue(
  orgId: string,
  opts: {
    currency?: string;
    branchId?: string | null;
    attentionOnly?: boolean;
    limit?: number;
  } = {},
) {
  return useQuery({
    queryKey: [
      "payment-operations",
      orgId,
      "reconciliation",
      opts.currency ?? "NGN",
      opts.branchId ?? null,
      opts.attentionOnly ?? true,
      opts.limit ?? 100,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams({
        currency: opts.currency ?? "NGN",
        attention_only: String(opts.attentionOnly ?? true),
        limit: String(opts.limit ?? 100),
      });
      if (opts.branchId) params.set("branch_id", opts.branchId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-operations/reconciliation?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        reconciliationQueueSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function usePreviewPaymentRun(orgId: string) {
  return useMutation({
    mutationFn: async (input: {
      currency: string;
      funding_bank_account_id: string;
      scheduled_execution_date?: string | null;
      items: Array<{ payment_obligation_id: string; amount: string }>;
    }) => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/preview`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify(input),
        },
      );
      return parseResponse(response, (value) =>
        paymentRunPreviewSchema.parse(value),
      );
    },
  });
}

export function useCreatePaymentRun(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      input: {
        name?: string | null;
        currency: string;
        funding_bank_account_id: string;
        scheduled_execution_date?: string | null;
      };
      idempotencyKey: string;
    }) => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(`${baseUrl(orgId)}/payment-runs`, {
        method: "POST",
        headers: jsonHeaders(payload.idempotencyKey),
        body: JSON.stringify(payload.input),
      });
      return parseResponse(response, (value) => paymentRunSchema.parse(value));
    },
    onSuccess: (run) => {
      queryClient.setQueryData(["payment-run", orgId, run.id], run);
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export async function addPaymentRunItemCommand(
  orgId: string,
  paymentRunId: string,
  payload: {
    payment_obligation_id: string;
    amount: string;
    idempotencyKey: string;
  },
) {
  requireOrganizationId(orgId);
  const response = await fetchWithAuth(
    `${baseUrl(orgId)}/payment-runs/${paymentRunId}/items`,
    {
      method: "POST",
      headers: jsonHeaders(payload.idempotencyKey),
      body: JSON.stringify({
        payment_obligation_id: payload.payment_obligation_id,
        amount: payload.amount,
      }),
    },
  );
  return parseResponse(response, (value) => paymentRunSchema.parse(value));
}

export function useAddPaymentRunItem(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      payment_obligation_id: string;
      amount: string;
      idempotencyKey: string;
    }) => addPaymentRunItemCommand(orgId, paymentRunId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useRemovePaymentRunItem(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/items/${itemId}`,
        { method: "DELETE" },
      );
      return parseResponse(response, (value) => paymentRunSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useSetPaymentRunItemDestination(
  orgId: string,
  paymentRunId: string,
  itemId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bank_code: string;
      bank_name: string;
      account_number: string;
      account_name: string;
      currency: string;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/items/${itemId}/destination`,
        {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify({
            type: "BANK_ACCOUNT",
            ...input,
            source: "MANUAL",
          }),
        },
      );
      return parseResponse(response, (value) => paymentRunSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
    },
  });
}

function useRunCommand(
  orgId: string,
  paymentRunId: string,
  command:
    | "submit"
    | "cancel"
    | "archive"
    | "unarchive"
    | "complete-with-exceptions",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      reason: string;
      idempotencyKey: string;
      policyId?: string | null;
    }) => {
      const body =
        command === "submit"
          ? { reason: payload.reason, policy_id: payload.policyId ?? null }
          : { reason: payload.reason };
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/${command}`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey),
          body: JSON.stringify(body),
        },
      );
      const parser = command === "submit" ? approvalRequestSchema : paymentRunSchema;
      return parseResponse(response, (value) => parser.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useSubmitPaymentRun(orgId: string, paymentRunId: string) {
  return useRunCommand(orgId, paymentRunId, "submit");
}

export function useCancelPaymentRun(orgId: string, paymentRunId: string) {
  return useRunCommand(orgId, paymentRunId, "cancel");
}

export function useArchivePaymentRun(orgId: string, paymentRunId: string) {
  return useRunCommand(orgId, paymentRunId, "archive");
}

export function useUnarchivePaymentRun(orgId: string, paymentRunId: string) {
  return useRunCommand(orgId, paymentRunId, "unarchive");
}

export function useCompletePaymentRunWithExceptions(
  orgId: string,
  paymentRunId: string,
) {
  return useRunCommand(orgId, paymentRunId, "complete-with-exceptions");
}

export function useApprovalStepUp(orgId: string, paymentRunId: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/approval-step-up`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({ password }),
        },
      );
      return parseResponse(response, (value) =>
        z
          .object({
            grant_token: z.string(),
            expires_at: z.string(),
            context_hash: z.string(),
            control_mode: z.literal("SINGLE_OPERATOR_CONTROL"),
          })
          .parse(value),
      );
    },
  });
}

export function useDecideApproval(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      approvalRequestId: string;
      decision: "APPROVE" | "REJECT";
      comment?: string | null;
      reasonCode?: string | null;
      idempotencyKey: string;
      stepUpToken?: string | null;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/approval-requests/${payload.approvalRequestId}/decide`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey, payload.stepUpToken),
          body: JSON.stringify({
            decision: payload.decision,
            comment: payload.comment ?? null,
            reason_code: payload.reasonCode ?? null,
          }),
        },
      );
      return parseResponse(response, (value) => approvalRequestSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function usePreparePaymentExecution(orgId: string, paymentRunId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      method: "MANUAL" | "CSV_EXPORT" | "BANK_FILE_EXPORT";
      idempotencyKey: string;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/executions`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey),
          body: JSON.stringify({ method: payload.method }),
        },
      );
      return parseResponse(response, (value) => paymentExecutionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useExecutionStepUp(orgId: string, paymentRunId: string) {
  return useMutation({
    mutationFn: async (payload: {
      password: string;
      instructionId?: string | null;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-runs/${paymentRunId}/execution-step-up`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            password: payload.password,
            instruction_id: payload.instructionId ?? null,
          }),
        },
      );
      return parseResponse(response, (value) =>
        z
          .object({
            required: z.boolean(),
            grant_token: nullableStringSchema,
            method: z.string().nullable(),
            expires_at: nullableStringSchema,
            risk_context_hash: z.string(),
            risk_factors: z.array(z.string()),
          })
          .parse(value),
      );
    },
  });
}

export function useSubmitPaymentExecution(
  orgId: string,
  paymentRunId: string,
  executionId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      externalBatchReference: string;
      evidence?: Record<string, unknown>;
      idempotencyKey: string;
      stepUpToken?: string | null;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-executions/${executionId}/submit`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey, payload.stepUpToken),
          body: JSON.stringify({
            external_batch_reference: payload.externalBatchReference,
            evidence: payload.evidence ?? {},
          }),
        },
      );
      return parseResponse(response, (value) => paymentExecutionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useExportPaymentExecution(orgId: string, executionId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-executions/${executionId}/export`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        z
          .object({
            payment_execution_id: z.string().uuid(),
            payment_run_id: z.string().uuid(),
            filename: z.string(),
            media_type: z.literal("text/csv"),
            content: z.string(),
          })
          .parse(value),
      );
    },
  });
}

export function useRecordInstructionResult(
  orgId: string,
  paymentRunId: string,
  executionId: string,
  instructionId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      status:
        | "DISPATCHED"
        | "ACCEPTED"
        | "IN_TRANSIT"
        | "FAILED"
        | "REJECTED"
        | "OUTCOME_UNKNOWN";
      evidence_type?: string | null;
      external_reference?: string | null;
      failure_code?: string | null;
      failure_reason?: string | null;
      evidence?: Record<string, unknown>;
      idempotencyKey: string;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-executions/${executionId}/instructions/${instructionId}/result`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey),
          body: JSON.stringify({
            status: payload.status,
            evidence_type: payload.evidence_type ?? null,
            external_reference: payload.external_reference ?? null,
            failure_code: payload.failure_code ?? null,
            failure_reason: payload.failure_reason ?? null,
            evidence: payload.evidence ?? {},
          }),
        },
      );
      return parseResponse(response, (value) => paymentExecutionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useReconcileInstruction(
  orgId: string,
  paymentRunId: string,
  executionId: string,
  instructionId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      outcome: "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED";
      evidence_type: string;
      external_reference: string;
      evidence_at: string;
      settlement_reference?: string | null;
      settled_at?: string | null;
      evidence?: Record<string, unknown>;
      idempotencyKey: string;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-executions/${executionId}/instructions/${instructionId}/reconcile`,
        {
          method: "POST",
          headers: jsonHeaders(payload.idempotencyKey),
          body: JSON.stringify({
            outcome: payload.outcome,
            evidence_type: payload.evidence_type,
            external_reference: payload.external_reference,
            evidence_at: payload.evidence_at,
            settlement_reference: payload.settlement_reference ?? null,
            settled_at: payload.settled_at ?? null,
            evidence: payload.evidence ?? {},
          }),
        },
      );
      return parseResponse(response, (value) => paymentExecutionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run", orgId, paymentRunId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function usePaymentRunTemplates(orgId: string, active?: boolean) {
  return useQuery({
    queryKey: ["payment-run-templates", orgId, active ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (active !== undefined) params.set("active", String(active));
      const query = params.toString();
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-run-templates${query ? `?${query}` : ""}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        paymentRunTemplateListSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export type PaymentRunTemplateInput = {
  name: string;
  cadence: "WEEKLY" | "MONTHLY";
  generation_rule: {
    timezone: string | null;
    hour: number;
    minute: number;
    weekday: number | null;
    day_of_month: number | null;
  };
  planned_execution_rule: { offset_days: number };
  funding_bank_account_id: string;
  currency: string;
  source_filters: {
    obligation_types: string[];
    source_types: string[];
    branch_id: string | null;
    due_on_or_before_execution: boolean;
    include_undated: boolean;
    max_items: number;
  };
  approval_policy_id?: string | null;
};

export function useCreatePaymentRunTemplate(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentRunTemplateInput) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-run-templates`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify(input),
        },
      );
      return parseResponse(response, (value) => paymentRunTemplateSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run-templates", orgId],
      });
    },
  });
}

function useTemplateStateCommand(
  orgId: string,
  command: "suspend" | "resume",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-run-templates/${templateId}/${command}`,
        { method: "POST" },
      );
      return parseResponse(response, (value) => paymentRunTemplateSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run-templates", orgId],
      });
    },
  });
}

export function useSuspendPaymentRunTemplate(orgId: string) {
  return useTemplateStateCommand(orgId, "suspend");
}

export function useResumePaymentRunTemplate(orgId: string) {
  return useTemplateStateCommand(orgId, "resume");
}

export function useGeneratePaymentRunTemplate(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      templateId: string;
      occurrenceAt: string;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/payment-run-templates/${payload.templateId}/generate`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({ occurrence_at: payload.occurrenceAt }),
        },
      );
      return parseResponse(response, (value) =>
        z
          .object({
            id: z.string().uuid(),
            payment_run_template_id: z.string().uuid(),
            payment_run_id: z.string().uuid(),
            occurrence_at: z.string(),
            planned_execution_date: z.string(),
            template_version: z.number().int(),
            template_snapshot: z.record(z.unknown()),
            item_count: z.number().int(),
            total_amount: z.string(),
            generated_at: z.string(),
            run: paymentRunSchema,
          })
          .parse(value),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["payment-run-templates", orgId],
      });
      invalidatePaymentOperations(queryClient, orgId);
    },
  });
}

export function useWorkflowDefinitions(orgId: string, domain = "PAYMENTS") {
  return useQuery({
    queryKey: ["workflows", orgId, domain],
    queryFn: async () => {
      const params = new URLSearchParams({ domain });
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflows?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        z.array(workflowDefinitionSchema).parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function useWorkflowDefinition(orgId: string, definitionId: string) {
  return useQuery({
    queryKey: ["workflow", orgId, definitionId],
    queryFn: async () => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflows/${definitionId}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        workflowDefinitionDetailSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId) && Boolean(definitionId),
  });
}

export function useWorkflowTriggers(orgId: string, definitionId?: string | null) {
  return useQuery({
    queryKey: ["workflow-triggers", orgId, definitionId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (definitionId) params.set("definition_id", definitionId);
      const query = params.toString();
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflow-triggers${query ? `?${query}` : ""}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        z.array(workflowTriggerSchema).parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function useWorkflowDeliveries(
  orgId: string,
  opts: { triggerId?: string | null; status?: string | null; limit?: number } = {},
) {
  return useQuery({
    queryKey: [
      "workflow-trigger-deliveries",
      orgId,
      opts.triggerId ?? null,
      opts.status ?? null,
      opts.limit ?? 50,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(opts.limit ?? 50) });
      if (opts.triggerId) params.set("trigger_id", opts.triggerId);
      if (opts.status) params.set("status", opts.status);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflow-trigger-deliveries?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        z.array(workflowDeliverySchema).parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function useCreateWorkflowDefinition(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      workflow_key: string;
      domain: string;
      workflow_type?: string | null;
      name: string;
      description?: string | null;
    }) => {
      const response = await fetchWithAuth(`${baseUrl(orgId)}/workflows`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(input),
      });
      return parseResponse(response, (value) => workflowDefinitionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
    },
  });
}

export function useCreateWorkflowVersion(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      definitionId: string;
      steps: Array<Record<string, unknown>>;
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflows/${payload.definitionId}/versions`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({ steps: payload.steps }),
        },
      );
      return parseResponse(response, (value) => workflowVersionSchema.parse(value));
    },
    onSuccess: (_version, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["workflow", orgId, variables.definitionId],
      });
    },
  });
}

export function usePublishWorkflowVersion(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflow-versions/${versionId}/publish`,
        { method: "POST" },
      );
      return parseResponse(response, (value) => workflowVersionSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
    },
  });
}

export function useCreateWorkflowTrigger(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      definitionId: string;
      input: {
        trigger_key: string;
        event_type: string;
        scope: "ORGANIZATION" | "BRANCH";
        branch_id: string | null;
        conditions: Array<{
          path: string;
          operator: "EQ" | "NE" | "IN" | "NOT_IN" | "EXISTS";
          value?: unknown;
        }>;
        input_mapping: Record<string, string>;
      };
    }) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflows/${payload.definitionId}/triggers`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify(payload.input),
        },
      );
      return parseResponse(response, (value) => workflowTriggerSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workflow-triggers", orgId],
      });
      void queryClient.invalidateQueries({ queryKey: ["workflows", orgId] });
    },
  });
}

function useWorkflowTriggerStateCommand(
  orgId: string,
  command: "enable" | "disable",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (triggerId: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/workflow-triggers/${triggerId}/${command}`,
        { method: "POST" },
      );
      return parseResponse(response, (value) => workflowTriggerSchema.parse(value));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["workflow-triggers", orgId],
      });
    },
  });
}

export function useEnableWorkflowTrigger(orgId: string) {
  return useWorkflowTriggerStateCommand(orgId, "enable");
}

export function useDisableWorkflowTrigger(orgId: string) {
  return useWorkflowTriggerStateCommand(orgId, "disable");
}

export function paymentRunFromUnknown(value: unknown): PaymentRun {
  return paymentRunSchema.parse(value);
}
