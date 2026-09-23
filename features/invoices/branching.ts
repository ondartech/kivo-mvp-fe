export type InvoiceBranchAccess = {
  organization_wide: boolean;
  branches: Array<{ id: string; code?: string; name?: string }>;
};

export function resolveInvoiceCreateBranchId(
  access: InvoiceBranchAccess | undefined,
  activeBranchId: string | null,
): string | null {
  if (!access) return null;
  const allowed = new Set(access.branches.map((branch) => branch.id));
  if (activeBranchId && allowed.has(activeBranchId)) return activeBranchId;
  if (access.branches.length === 1) return access.branches[0].id;
  return null;
}

export function buildInvoiceListParams(input: {
  branchId?: string | null;
  documentState?: string | null;
  cursor?: string | null;
  limit?: number;
  sort?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.branchId) params.set("branch_id", input.branchId);
  if (input.documentState) params.set("document_state", input.documentState);
  if (input.cursor) params.set("cursor", input.cursor);
  params.set("limit", String(input.limit ?? 20));
  params.set("sort", input.sort ?? "created_at:desc");
  return params;
}
