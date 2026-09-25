"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isOrganizationId } from "@/features/foundation/api";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import {
  taxAccountMappingInputSchema,
  taxAccountMappingSchema,
  taxCodeCreateInputSchema,
  taxCodeDetailSchema,
  taxCodeListSchema,
  taxCodeVersionInputSchema,
  taxCodeVersionSchema,
  taxComplianceCalendarSchema,
  taxRegistrationInputSchema,
  taxRegistrationListSchema,
  taxRegistrationSchema,
  taxReserveBankAccountSchema,
  taxReserveInstructionSchema,
  taxReservePolicyInputSchema,
  taxReservePolicySchema,
  taxReservePositionSchema,
  type TaxAccountMappingInput,
  type TaxCodeCreateInput,
  type TaxCodeVersionInput,
  type TaxRegistrationInput,
  type TaxReservePolicyInput,
} from "./schema";

function baseUrl(orgId: string): string {
  return (
    env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") +
    "/api/v1/organizations/" +
    orgId +
    "/tax"
  );
}

function requireOrganizationId(orgId: string): void {
  if (!isOrganizationId(orgId)) {
    throw new Error(
      "Organization context is not available. Select a workspace and try again.",
    );
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
          : "Request failed with HTTP " + response.status,
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

async function responseErrorCode(response: Response): Promise<string | undefined> {
  const body: unknown = await response.clone().json().catch(() => null);
  if (!body || typeof body !== "object") return undefined;
  const root = body as Record<string, unknown>;
  const nested =
    root.error && typeof root.error === "object"
      ? (root.error as Record<string, unknown>)
      : root;
  return typeof nested.code === "string" ? nested.code : undefined;
}

export function useTaxCodes(orgId: string) {
  return useQuery({
    queryKey: ["tax", orgId, "codes"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(baseUrl(orgId) + "/codes", {
        method: "GET",
      });
      return parseResponse(response, (value) => taxCodeListSchema.parse(value));
    },
    enabled: isOrganizationId(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTaxCode(orgId: string, taxCodeId: string | null) {
  return useQuery({
    queryKey: ["tax", orgId, "codes", taxCodeId],
    queryFn: async () => {
      requireOrganizationId(orgId);
      if (!taxCodeId) throw new Error("Tax code is required.");
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/codes/" + taxCodeId,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        taxCodeDetailSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId) && Boolean(taxCodeId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useCreateTaxCode(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxCodeCreateInput) => {
      requireOrganizationId(orgId);
      const payload = taxCodeCreateInputSchema.parse(input);
      const response = await fetchWithAuth(baseUrl(orgId) + "/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseResponse(response, (value) => taxCodeDetailSchema.parse(value));
    },
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tax", orgId, "codes"] }),
        queryClient.setQueryData(
          ["tax", orgId, "codes", created.id],
          created,
        ),
      ]);
    },
  });
}

export function useAddTaxCodeVersion(
  orgId: string,
  taxCodeId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxCodeVersionInput) => {
      requireOrganizationId(orgId);
      if (!taxCodeId) throw new Error("Tax code is required.");
      const payload = taxCodeVersionInputSchema.parse(input);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/codes/" + taxCodeId + "/versions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return parseResponse(response, (value) =>
        taxCodeVersionSchema.parse(value),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tax", orgId, "codes"] }),
        queryClient.invalidateQueries({
          queryKey: ["tax", orgId, "codes", taxCodeId],
        }),
      ]);
    },
  });
}

export function useCreateTaxAccountMapping(
  orgId: string,
  taxCodeId: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxAccountMappingInput) => {
      requireOrganizationId(orgId);
      if (!taxCodeId) throw new Error("Tax code is required.");
      const payload = taxAccountMappingInputSchema.parse(input);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/codes/" + taxCodeId + "/account-mappings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return parseResponse(response, (value) =>
        taxAccountMappingSchema.parse(value),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["tax", orgId, "codes", taxCodeId],
      });
    },
  });
}

export function useArchiveTaxCode(orgId: string, taxCodeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      requireOrganizationId(orgId);
      if (!taxCodeId) throw new Error("Tax code is required.");
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/codes/" + taxCodeId + "/archive",
        { method: "POST" },
      );
      return parseResponse(response, (value) => taxCodeDetailSchema.parse(value));
    },
    onSuccess: async (archived) => {
      queryClient.setQueryData(
        ["tax", orgId, "codes", archived.id],
        archived,
      );
      await queryClient.invalidateQueries({ queryKey: ["tax", orgId, "codes"] });
    },
  });
}

export function useTaxComplianceCalendar(
  orgId: string,
  params?: {
    from?: string;
    to?: string;
    asOf?: string;
  },
) {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.asOf) query.set("as_of", params.asOf);
  const queryString = query.toString();
  const suffix = queryString ? "?" + queryString : "";

  return useQuery({
    queryKey: [
      "tax",
      orgId,
      "compliance-calendar",
      params?.from ?? null,
      params?.to ?? null,
      params?.asOf ?? null,
    ],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/compliance-calendar" + suffix,
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        taxComplianceCalendarSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}


export function useTaxRegistrations(orgId: string) {
  return useQuery({
    queryKey: ["tax", orgId, "registrations"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/registrations",
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        taxRegistrationListSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCreateTaxRegistration(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxRegistrationInput) => {
      requireOrganizationId(orgId);
      const payload = taxRegistrationInputSchema.parse(input);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/registrations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return parseResponse(response, (value) =>
        taxRegistrationSchema.parse(value),
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["tax", orgId, "registrations"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["tax", orgId, "compliance-calendar"],
        }),
      ]);
    },
  });
}

function organizationBaseUrl(orgId: string): string {
  return (
    env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") +
    "/api/v1/organizations/" +
    orgId
  );
}

export function useTaxReserveBankAccounts(orgId: string) {
  return useQuery({
    queryKey: ["tax", orgId, "treasury", "bank-accounts"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        organizationBaseUrl(orgId) + "/bank-accounts",
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        taxReserveBankAccountSchema.array().parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTaxReservePolicy(orgId: string) {
  return useQuery({
    queryKey: ["tax", orgId, "treasury", "reserve-policy"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/treasury/reserve-policy",
        { method: "GET" },
      );
      if (
        response.status === 404 &&
        (await responseErrorCode(response)) === "TAX_RESERVE_POLICY_NOT_CONFIGURED"
      ) {
        return null;
      }
      return parseResponse(response, (value) =>
        taxReservePolicySchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useTaxReservePosition(orgId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["tax", orgId, "treasury", "reserve-position"],
    queryFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/treasury/reserve-position",
        { method: "GET" },
      );
      return parseResponse(response, (value) =>
        taxReservePositionSchema.parse(value),
      );
    },
    enabled: isOrganizationId(orgId) && enabled,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useUpsertTaxReservePolicy(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TaxReservePolicyInput) => {
      requireOrganizationId(orgId);
      const payload = taxReservePolicyInputSchema.parse(input);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/treasury/reserve-policy",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return parseResponse(response, (value) => taxReservePolicySchema.parse(value));
    },
    onSuccess: async (policy) => {
      queryClient.setQueryData(
        ["tax", orgId, "treasury", "reserve-policy"],
        policy,
      );
      await queryClient.invalidateQueries({
        queryKey: ["tax", orgId, "treasury", "reserve-position"],
      });
    },
  });
}

export function useReconcileTaxReserve(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      requireOrganizationId(orgId);
      const response = await fetchWithAuth(
        baseUrl(orgId) + "/treasury/reconcile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ as_of_date: null }),
        },
      );
      return parseResponse(response, (value) =>
        taxReserveInstructionSchema.parse(value),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["tax", orgId, "treasury", "reserve-position"],
      });
    },
  });
}

