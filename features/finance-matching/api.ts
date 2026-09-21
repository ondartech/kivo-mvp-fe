"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isOrganizationId } from "@/features/foundation/api";
import {
  matchEvaluationListSchema,
  matchEvaluationSchema,
  matchExceptionListSchema,
  matchExceptionSchema,
  matchResolutionCodeSchema,
  matchReviewQueueSchema,
  type MatchResolutionCode,
} from "./schema";

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

function requireOrganizationId(orgId: string): void {
  if (!isOrganizationId(orgId)) {
    throw new Error("Organization context is not available.");
  }
}

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
        requestId:
          typeof nested.request_id === "string" ? nested.request_id : undefined,
      },
    );
  }
  return parse(body);
}

export function useMatchReviewQueue(orgId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "supplier-bill-match-reviews"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/supplier-bill-match-reviews`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        matchReviewQueueSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
  });
}

export function useMatchEvaluations(orgId: string, billId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "supplier-bill", billId, "match-evaluations"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/supplier-bills/${billId}/match-evaluations`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        matchEvaluationListSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId) && Boolean(billId),
  });
}

export function useMatchExceptions(
  orgId: string,
  billId: string,
  evaluationId?: string,
) {
  return useQuery({
    queryKey: [
      "finance",
      orgId,
      "supplier-bill",
      billId,
      "match-exceptions",
      evaluationId ?? "all",
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams();
      if (evaluationId) params.set("evaluation_id", evaluationId);
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/supplier-bills/${billId}/match-exceptions${suffix}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        matchExceptionListSchema.parse(value),
      );
    },
    enabled:
      isOrganizationId(orgId) &&
      Boolean(billId) &&
      Boolean(evaluationId),
  });
}

export function useEvaluateSupplierBillMatch(orgId: string, billId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expectedBillVersion: number) => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/supplier-bills/${billId}/match-evaluations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expected_bill_version: expectedBillVersion,
          }),
        },
      );
      return parseResponse(response, (value) => matchEvaluationSchema.parse(value));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["finance", orgId, "supplier-bill", billId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["finance", orgId, "supplier-bill-match-reviews"],
        }),
      ]);
    },
  });
}

export function useResolveMatchException(orgId: string, billId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      exceptionId: string;
      expectedBillVersion: number;
      expectedEvaluationHash: string;
      resolutionCode: MatchResolutionCode;
      reason: string;
    }) => {
      requireOrganizationId(orgId);
      const resolutionCode = matchResolutionCodeSchema.parse(
        input.resolutionCode,
      );
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/supplier-bills/${billId}/` +
          `match-exceptions/${input.exceptionId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expected_bill_version: input.expectedBillVersion,
            expected_evaluation_hash: input.expectedEvaluationHash,
            resolution_code: resolutionCode,
            reason: input.reason.trim(),
          }),
        },
      );
      return parseResponse(response, (value) => matchExceptionSchema.parse(value));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["finance", orgId, "supplier-bill", billId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["finance", orgId, "supplier-bill-match-reviews"],
        }),
      ]);
    },
  });
}
