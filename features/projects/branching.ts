export type ProjectBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export type ProjectReadScope = {
  ready: boolean;
  branchId: string | null;
  selectionRequired: boolean;
};

export function resolveProjectReadScope(
  access: ProjectBranchAccess | undefined,
  activeBranchId: string | null,
): ProjectReadScope {
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

export function resolveProjectCreateBranchId(
  access: ProjectBranchAccess | undefined,
  activeBranchId: string | null,
): string | null {
  if (!access) return null;

  const allowed = new Set(access.branches.map((branch) => branch.id));
  if (activeBranchId && allowed.has(activeBranchId)) return activeBranchId;
  if (access.branches.length === 1) return access.branches[0].id;
  return null;
}

export function buildProjectListParams(input: {
  branchId?: string | null;
  customerId?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
  sort?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.customerId) params.set("customer_id", input.customerId);
  if (input.status) params.set("status", input.status);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 20));
  params.set("sort", input.sort ?? "created_at:desc");
  return params;
}

export function buildProjectDashboardParams(input: {
  recent?: number;
  activityLimit?: number;
} = {}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("recent", String(input.recent ?? 5));
  params.set("activity_limit", String(input.activityLimit ?? 10));
  return params;
}

