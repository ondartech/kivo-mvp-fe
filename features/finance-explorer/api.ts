"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { isOrganizationId } from "@/features/foundation/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import {
  accountActivitySchema,
  financeAccountListSchema,
  financeAccountSchema,
  journalEntrySchema,
  journalSourceTraceSchema,
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

export function useFinanceAccounts(orgId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "accounts"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(`${baseUrl(orgId)}/finance/accounts`, {
        method: "GET",
      });
      return parseResponse(response, (value) => financeAccountListSchema.parse(value));
    },
    enabled: isOrganizationId(orgId),
  });
}

export function useFinanceAccount(orgId: string, accountId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "accounts", accountId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/accounts/${accountId}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => financeAccountSchema.parse(value));
    },
    enabled: isOrganizationId(orgId) && Boolean(accountId),
  });
}

export function useAccountActivity(orgId: string, accountId: string) {
  return useInfiniteQuery({
    queryKey: ["finance", orgId, "accounts", accountId, "activity"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      requireOrganizationId(orgId);
      const params = new URLSearchParams({ limit: "50" });
      if (pageParam) params.set("cursor", pageParam);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/accounts/${accountId}/activity?${params.toString()}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => accountActivitySchema.parse(value));
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: isOrganizationId(orgId) && Boolean(accountId),
  });
}

export function useJournalEntry(orgId: string, journalId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "journals", journalId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/journals/${journalId}`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => journalEntrySchema.parse(value));
    },
    enabled: isOrganizationId(orgId) && Boolean(journalId),
  });
}

export function useJournalSourceTrace(orgId: string, journalId: string) {
  return useQuery({
    queryKey: ["finance", orgId, "journals", journalId, "source"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        `${baseUrl(orgId)}/finance/journals/${journalId}/source`,
        { method: "GET" },
      );
      return parseResponse(response, (value) => journalSourceTraceSchema.parse(value));
    },
    enabled: isOrganizationId(orgId) && Boolean(journalId),
  });
}
