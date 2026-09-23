export type FinanceBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export type FinanceReadScope = {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
};

export function resolveFinanceReadScope(
  access: FinanceBranchAccess | undefined,
  activeBranchId: string | null,
): FinanceReadScope {
  if (!access) {
    return { ready: false, branchId: null, selectionRequired: false };
  }

  const allowed = new Set(access.branches.map((branch) => branch.id));
  if (activeBranchId && allowed.has(activeBranchId)) {
    return { ready: true, branchId: activeBranchId, selectionRequired: false };
  }

  if (access.organization_wide) {
    return { ready: true, branchId: null, selectionRequired: false };
  }

  if (access.branches.length === 1) {
    return {
      ready: true,
      branchId: access.branches[0].id,
      selectionRequired: false,
    };
  }

  return {
    ready: false,
    branchId: null,
    selectionRequired: access.branches.length > 1,
  };
}

export function buildFinanceActivityParams(input: {
  branchId?: string | null;
  cursor?: string | null;
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("limit", String(input.limit ?? 50));
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.cursor) params.set("cursor", input.cursor);
  return params;
}
