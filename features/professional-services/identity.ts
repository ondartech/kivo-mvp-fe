"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/experience/ask-runtime";
import { isPublicOrganizationId } from "@/lib/public-resource-id";

type AuthOrganizationIdentity = {
  legacy_organization_id: string;
  organization_public_id: string;
};

export function resolvePublicOrgId(
  memberships: AuthOrganizationIdentity[],
  legacyId: string,
): string | null {
  if (isPublicOrganizationId(legacyId)) return legacyId;
  const match = memberships.find(item => item.legacy_organization_id === legacyId);
  if (!match) return null;
  return isPublicOrganizationId(match.organization_public_id)
    ? match.organization_public_id
    : null;
}

/**
 * Transitional authenticated identity mapping.
 * The input UUID originates from LoginRes's existing own membership, NOT a
 * caller-chosen organization to enumerate. The backend independently filters
 * only the current user's ACTIVE membership rows.
 */
export function useProfessionalOrganizationIdentity(
  currentMembershipOrgId: string,
) {
  const legacy = isUuid(currentMembershipOrgId);
  const query = useQuery<AuthOrganizationIdentity[]>({
    queryKey: ["my-organization-identities", currentMembershipOrgId],
    enabled: legacy,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const res = await fetchWithAuth(
        `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/auth/organization-identities`,
        { method: "GET" },
      );
      if (!res.ok) {
        throw Object.assign(
          new Error(res.status === 401 || res.status === 403
            ? "Session is not authorized to resolve an organization."
            : "Could not resolve this membership's organization public ID."),
          { status: res.status },
        );
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error("Organization identities response is invalid.");
      return data as AuthOrganizationIdentity[];
    },
  });
  const publicOrganizationId = isPublicOrganizationId(currentMembershipOrgId)
    ? currentMembershipOrgId
    : resolvePublicOrgId(query.data ?? [], currentMembershipOrgId);
  return {
    publicOrganizationId,
    isLoading: legacy && query.isLoading,
    isError: legacy && query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
