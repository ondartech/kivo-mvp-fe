"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
import type { InviteInput } from "./schema";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "REMOVED" | "REVOKED";
export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export type OrgMember = {
  id: string;
  user_id: string;
  user: { email?: string };
  role: string;
  status: string;
  joined_at: string;
};

export type OrgInvite = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type ApiError = Error & { status?: number; code?: string };

function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? `Request failed ${res.status}`), {
      status: res.status,
      code: err?.code,
      details: err?.details,
      requestId: err?.request_id,
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type MeMembership = { organization_id: string; role: string; status: string };

export function useMe() {
  return useQuery<{ memberships: MeMembership[] }>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/auth/me`,
        { method: "GET" }
      );
      return handleRes(res);
    },
  });
}

/** The caller's membership row for an org (role drives display-only gates). */
export function useMyMembership(orgId: string) {
  const me = useMe();
  const membership =
    me.data?.memberships?.find(
      (m) => m.organization_id === orgId && m.status === "ACTIVE"
    ) ?? null;
  return {
    role: membership?.role ?? null,
    isLoading: me.isLoading,
    error: me.error as ApiError | null,
  };
}

export function useMembers(orgId: string | null) {
  return useQuery<{ data: OrgMember[]; next_cursor: string | null }>({
    queryKey: ["members", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/memberships`, { method: "GET" });
      return handleRes(res);
    },
    enabled: !!orgId,
  });
}

export function useInvites(orgId: string | null) {
  return useQuery<{ data: OrgInvite[] }>({
    queryKey: ["invites", orgId],
    queryFn: async () => {
      const res = await fetchWithAuth(`${baseUrl(orgId!)}/invites`, { method: "GET" });
      return handleRes(res);
    },
    enabled: !!orgId,
  });
}

export function useInviteMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteInput) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites", orgId] });
    },
  });
}

export function usePatchRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { membershipId: string; role: MemberRole }) => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/memberships/${input.membershipId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: input.role }),
        }
      );
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useSuspendMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/memberships/${membershipId}/suspend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await fetchWithAuth(
        `${baseUrl(orgId)}/memberships/${membershipId}/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      return handleRes(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

// Public — no Authorization (invite token is the auth). KIV-FE-032.
export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (input: { token: string; inviteId?: string }) => {
      const { token, inviteId } = input;
      // Prefer id-scoped when we have it, else public /invites/accept with token lookup
      const url = inviteId
        ? `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/invites/${inviteId}/accept`
        : `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/invites/accept`;
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.set("X-Request-Id", crypto.randomUUID());
      headers.set("X-Correlation-Id", crypto.randomUUID());
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });
      return handleRes<{ organization_id: string; membership_id: string }>(res);
    },
  });
}

export function useDeclineInvite() {
  return useMutation({
    mutationFn: async (input: { token: string; inviteId?: string }) => {
      const { token, inviteId } = input;
      const url = inviteId
        ? `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/invites/${inviteId}/decline`
        : `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/invites/decline`;
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.set("X-Request-Id", crypto.randomUUID());
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      });
      return handleRes(res);
    },
  });
}

export function useInviteByToken(token: string | null) {
  return useQuery<OrgInvite & { organization_name?: string; role_label?: string }>({
    queryKey: ["invite", token],
    queryFn: async () => {
      const headers = new Headers();
      headers.set("X-Request-Id", crypto.randomUUID());
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/invites/${token}`,
        { method: "GET", headers }
      );
      return handleRes(res);
    },
    enabled: !!token,
    retry: false,
  });
}
