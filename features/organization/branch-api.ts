"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";

import {
  branchCreateSchema,
  branchPatchSchema,
  branchSchema,
  type Branch,
  type BranchCreateInput,
  type BranchPatchInput,
} from "./branch-schema";

function baseUrl(orgId: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(
  response: Response,
  parse: (value: unknown) => T,
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const envelope =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const nested =
      envelope.error && typeof envelope.error === "object"
        ? (envelope.error as Record<string, unknown>)
        : envelope;
    throw Object.assign(
      new Error(
        typeof nested.message === "string"
          ? nested.message
          : `Request failed ${response.status}`,
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

export function useBranches(orgId: string, includeInactive = false) {
  return useQuery<Branch[]>({
    queryKey: ["branches", orgId, includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInactive) params.set("include_inactive", "true");
      const suffix = params.size ? `?${params.toString()}` : "";
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/branches${suffix}`,
        { method: "GET" },
      );
      return handleRes(response, (value) => branchSchema.array().parse(value));
    },
    enabled: isUuid(orgId),
  });
}

export function useCreateBranch(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BranchCreateInput) => {
      const payload = branchCreateSchema.parse(input);
      const response = await fetchWithAuth(`${baseUrl(orgId)}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return handleRes(response, (value) => branchSchema.parse(value));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", orgId] });
    },
  });
}

export function usePatchBranch(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      branchId,
      input,
    }: {
      branchId: string;
      input: BranchPatchInput;
    }) => {
      const payload = branchPatchSchema.parse(input);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/branches/${branchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return handleRes(response, (value) => branchSchema.parse(value));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", orgId] });
    },
  });
}

function useBranchStatusMutation(
  orgId: string,
  action: "deactivate" | "reactivate",
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (branchId: string) => {
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/branches/${branchId}/${action}`,
        { method: "POST" },
      );
      return handleRes(response, (value) => branchSchema.parse(value));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", orgId] });
    },
  });
}

export function useDeactivateBranch(orgId: string) {
  return useBranchStatusMutation(orgId, "deactivate");
}

export function useReactivateBranch(orgId: string) {
  return useBranchStatusMutation(orgId, "reactivate");
}
