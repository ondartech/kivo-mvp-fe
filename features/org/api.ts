"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
import type { BankAccountCreateInput, BusinessProfileInput, CacLookupInput } from "./schema";
export type BankAccount = {
  id: string;
  organization_id: string;
  bank_code: string;
  bank_name: string;
  account_number_masked: string;
  account_number_last4: string;
  account_name: string;
  currency: string;
  verification_status: string;
  verification_match_type: string | null;
  verified_at: string | null;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};
export type BankAccountVerifyOut = {
  account_id: string;
  verification_status: string;
  verification_match_type: string;
  resolved_account_name: string;
  verified_at: string;
};
export type MerchantPaymentSettings = {
  organization_id: string;
  enabled: boolean;
  default_provider: string;
  settlement_bank_account_id: string | null;
  provider_subaccount_id: string | null;
  onboarding_status: string;
  fee_payer: string;
  created_at: string;
  updated_at: string;
};
export type BusinessProfile = {
  id: string;
  organization_id: string;
  legal_name: string;
  business_structure: string | null;
  trading_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: { line1: string | null; line2: string | null; city: string | null; state: string | null; postal_code: string | null; country_code: string | null };
  website: string | null;
  tax_identifier: string | null;
  verification_status: string;
  registration: BusinessRegistration | null;
  logo_url: string | null;
  invoice_prefix: string | null;
  default_currency: string | null;
  created_at: string;
  updated_at: string;
};
export type BusinessRegistration = {
  id: string;
  organization_id: string;
  registration_type: string;
  registration_number: string;
  registered_name: string;
  registry_status: string | null;
  jurisdiction: string;
  latest_verification_id: string;
  created_at: string;
  updated_at: string;
};
export type BusinessVerificationLookupOut = {
  verification_id: string;
  found: boolean;
  registered_name: string | null;
  registry_status: string | null;
  identifier_type: string;
  identifier: string;
  source: string;
  evidence_hash: string;
  expires_at: string;
};
export type BusinessVerificationConfirmOut = {
  registration: BusinessRegistration;
  profile_verification_status: string;
};
export type BusinessVerification = {
  id: string;
  organization_id: string;
  identifier_type: string;
  identifier: string;
  lookup_result: string;
  returned_name: string | null;
  returned_status: string | null;
  source: string;
  status: string;
  evidence_hash: string;
  confirmed_legal_name: string | null;
  confirmed_at: string | null;
  expires_at: string;
  created_at: string;
};
export type ApiError = Error & { status?: number; code?: string; details?: unknown; requestId?: string };
function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}
async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? `Request failed ${res.status}`), { status: res.status, code: err?.code, details: err?.details, requestId: err?.request_id });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export function useBankAccounts(orgId: string | null) {
  return useQuery<BankAccount[]>({
    queryKey: ["bank-accounts", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/bank-accounts`, { method: "GET" });
      const data = await handleRes<BankAccount[] | { data: BankAccount[] }>(res);
      return Array.isArray(data) ? data : (data as { data: BankAccount[] }).data ?? [];
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
export function useAddBankAccount(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BankAccountCreateInput) => {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(input),
      });
      return handleRes<BankAccount>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts", orgId] });
    },
  });
}
export function useVerifyBankAccount(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts/${accountId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({}),
      });
      return handleRes<BankAccountVerifyOut>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts", orgId] });
      qc.invalidateQueries({ queryKey: ["merchant-payment-settings", orgId] });
    },
  });
}
export function useSetDefaultBankAccount(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts/${accountId}/set-default`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({}),
      });
      return handleRes<BankAccount>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts", orgId] });
    },
  });
}
export function useDeactivateBankAccount(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/bank-accounts/${accountId}`, { method: "DELETE" });
      return handleRes<BankAccount>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts", orgId] });
    },
  });
}
export function useMerchantPaymentSettings(orgId: string | null) {
  return useQuery<MerchantPaymentSettings | null>({
    queryKey: ["merchant-payment-settings", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/merchant-payment-settings`, { method: "GET" });
      if (res.status === 404) return null;
      return handleRes<MerchantPaymentSettings | null>(res);
    },
    enabled: !!orgId,
  });
}
export function usePutMerchantPaymentSettings(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { enabled: boolean; settlement_bank_account_id: string | null }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/merchant-payment-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<MerchantPaymentSettings>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-payment-settings", orgId] });
    },
  });
}
export function useBusinessProfile(orgId: string | null) {
  return useQuery<BusinessProfile>({
    queryKey: ["business-profile", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/business-profile`, { method: "GET" });
      return handleRes<BusinessProfile>(res);
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}
export function usePutBusinessProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BusinessProfileInput) => {
      const body: Record<string, unknown> = { ...input };
      if (!body.business_structure) body.business_structure = "UNREGISTERED";
      for (const k of ["email", "phone", "website", "tax_identifier", "trading_name", "display_name", "logo_url", "invoice_prefix", "default_currency"] as const) {
        if (body[k] === "") body[k] = null;
      }
      const addr = body.address as Record<string, unknown> | null | undefined;
      if (addr) {
        for (const k of ["line1", "line2", "city", "state", "postal_code", "country_code"] as const) {
          if (addr[k] === "") addr[k] = null;
        }
      }
      const res = await fetchWithAuth(`${baseUrl(orgId)}/business-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleRes<BusinessProfile>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-profile", orgId] });
    },
  });
}
export function usePatchBusinessProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BusinessProfileInput>) => {
      const body: Record<string, unknown> = { ...input };
      for (const k of Object.keys(body) as (keyof BusinessProfileInput)[]) {
        if (body[k] === "") body[k] = null as unknown as string;
      }
      const res = await fetchWithAuth(`${baseUrl(orgId)}/business-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return handleRes<BusinessProfile>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-profile", orgId] });
    },
  });
}
export function useBusinessVerifications(orgId: string | null) {
  return useQuery<BusinessVerification[]>({
    queryKey: ["business-verifications", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/business-verifications`, { method: "GET" });
      const data = await handleRes<BusinessVerification[] | { data: BusinessVerification[] }>(res);
      return Array.isArray(data) ? data : (data as { data: BusinessVerification[] }).data ?? [];
    },
    enabled: !!orgId,
    staleTime: 15_000,
  });
}
export function useLookupBusinessVerification(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CacLookupInput) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/business-verifications/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes<BusinessVerificationLookupOut>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-verifications", orgId] });
    },
  });
}
export function useConfirmBusinessVerification(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (verificationId: string) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/business-verifications/${verificationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return handleRes<BusinessVerificationConfirmOut>(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-profile", orgId] });
      qc.invalidateQueries({ queryKey: ["business-verifications", orgId] });
    },
  });
}
