export type BranchAccessLike = {
  organization_wide: boolean;
  branches: Array<{ id: string }>;
};

/**
 * Reconcile browser-local Branch context against the server-authoritative access set.
 *
 * - keep an already-selected Branch only while it remains accessible;
 * - auto-select when a branch-scoped membership has exactly one Branch;
 * - otherwise return null, which means organization-wide context when allowed or
 *   "selection required" for a branch-scoped membership with multiple Branches.
 */
export function reconcileActiveBranchId(
  access: BranchAccessLike,
  currentBranchId: string | null,
): string | null {
  const allowed = new Set(access.branches.map((branch) => branch.id));
  if (currentBranchId && allowed.has(currentBranchId)) {
    return currentBranchId;
  }
  if (!access.organization_wide && access.branches.length === 1) {
    return access.branches[0].id;
  }
  return null;
}
