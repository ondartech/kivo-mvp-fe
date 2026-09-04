"use client";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
export type MeMembership = { organization_id: string; role: string; status: string };
export function useMe() {
  return useQuery<{ memberships: MeMembership[] }>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetchWithAuth(`${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/auth/me`, { method: "GET" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body?.error ?? body;
        throw Object.assign(new Error(err?.message ?? `Request failed ${res.status}`), { status: res.status, code: err?.code });
      }
      return res.json();
    },
  });
}
export function useMyMembership(orgId: string) {
  const me = useMe();
  const membership = me.data?.memberships?.find((m) => m.organization_id === orgId && m.status === "ACTIVE") ?? null;
  return { role: membership?.role ?? null, isLoading: me.isLoading, error: me.error as Error & { status?: number; code?: string } | null };
}
