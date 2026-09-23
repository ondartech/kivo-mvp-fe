export type QuoteBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export type QuoteReadScope = {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
};

export function resolveQuoteReadScope(
  access: QuoteBranchAccess | undefined,
  activeBranchId: string | null,
): QuoteReadScope {
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

export function resolveQuoteCreateBranchId(
  access: QuoteBranchAccess | undefined,
  activeBranchId: string | null,
): string | null {
  if (!access) return null;
  const allowed = new Set(access.branches.map((branch) => branch.id));
  if (activeBranchId && allowed.has(activeBranchId)) return activeBranchId;
  if (access.branches.length === 1) return access.branches[0].id;
  return null;
}

export function buildQuoteListParams(input: {
  branchId?: string | null;
  customerId?: string | null;
  projectId?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.customerId) params.set("customer_id", input.customerId);
  if (input.projectId) params.set("project_id", input.projectId);
  if (input.status) params.set("status", input.status);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 20));
  return params;
}
