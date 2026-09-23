export type ReceivableBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export function resolveReceivableReadScope(
  access: ReceivableBranchAccess | undefined,
  activeBranchId: string | null,
): {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
} {
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

export function buildReceivableListParams(input: {
  branchId?: string | null;
  collectionState?: string | null;
  paymentState?: string | null;
  overdue?: boolean | null;
  currency?: string;
  cursor?: string | null;
  limit?: number;
  sort?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.collectionState) params.set("collection_state", input.collectionState);
  if (input.paymentState) params.set("payment_state", input.paymentState);
  if (input.overdue !== null && input.overdue !== undefined) {
    params.set("overdue", String(input.overdue));
  }
  if (input.currency) params.set("currency", input.currency);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 20));
  params.set("sort", input.sort ?? "due_date:asc");
  return params;
}
