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
  taxRegistrationInputSchema,
  taxRegistrationListSchema,
  taxRegistrationSchema,
  type TaxAccountMappingInput,
  type TaxCodeCreateInput,
  type TaxCodeVersionInput,
  type TaxRegistrationInput,
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
      await queryClient.invalidateQueries({
        queryKey: ["tax", orgId, "registrations"],
      });
    },
  });
}
