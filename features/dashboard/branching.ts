export type DashboardBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export type DashboardReadScope = {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
};

export function resolveDashboardReadScope(
  access: DashboardBranchAccess | undefined,
  activeBranchId: string | null,
): DashboardReadScope {
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

export function buildDashboardParams(input: {
  branchId?: string | null;
  currency?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("currency", input.currency ?? "NGN");
  if (input.branchId) params.set("branch_id", input.branchId);
  return params;
}
