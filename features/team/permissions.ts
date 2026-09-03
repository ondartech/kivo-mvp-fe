import type { MemberRole } from "./api";

/**
 * Display-only gates (KIV-FE-031 FR-002). The backend is authority and still
 * returns 403/409 — hiding controls is UX, never a security boundary.
 */
export function canInvite(role: string | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canChangeRole(role: string | undefined): boolean {
  return role === "OWNER";
}

export function canSuspendRemove(role: string | undefined): boolean {
  return role === "OWNER";
}

/** Roles the invite form may offer. OWNER is granted only via role change. */
export const INVITABLE_ROLES: MemberRole[] = ["ADMIN", "MEMBER"];

type BadgeVariant = "neutral" | "success" | "warning" | "critical" | "info" | "processing";

/**
 * Canonical badge mapping (Updated PRD §12 lifecycle INVITED→ACTIVE→SUSPENDED→REMOVED).
 * - Pending invites (BE PENDING) render as INVITED.
 * - Legacy BE REVOKED renders as Removed (migration 0026 moved rows to REMOVED).
 */
export function roleBadge(role: string): { label: string; variant: BadgeVariant } {
  switch (role) {
    case "OWNER":
      return { label: "Owner", variant: "info" };
    case "ADMIN":
      return { label: "Admin", variant: "processing" };
    default:
      return { label: "Member", variant: "neutral" };
  }
}

export function statusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "PENDING":
      return { label: "Invited", variant: "warning" };
    case "SUSPENDED":
      return { label: "Suspended", variant: "warning" };
    case "REMOVED":
    case "REVOKED":
      return { label: "Removed", variant: "neutral" };
    case "ACCEPTED":
      return { label: "Accepted", variant: "success" };
    case "EXPIRED":
      return { label: "Expired", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}
