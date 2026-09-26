export type PaymentBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export type PaymentReadScope = {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
};

export function resolvePaymentReadScope(
  access: PaymentBranchAccess | undefined,
  activeBranchId: string | null,
): PaymentReadScope {
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
