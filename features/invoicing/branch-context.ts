export function resolveInvoiceCreateBranchId(
  branchIds: string[],
  activeBranchId: string | null,
  currentBranchId: string | null,
): string | null {
  const allowed = new Set(branchIds);

  if (currentBranchId && allowed.has(currentBranchId)) {
    return currentBranchId;
  }
  if (activeBranchId && allowed.has(activeBranchId)) {
    return activeBranchId;
  }
  if (branchIds.length === 1) {
    return branchIds[0];
  }
  return null;
}
