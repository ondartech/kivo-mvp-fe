"use client";

import { isUuid } from "@/lib/experience/ask-runtime";

import type { Branch } from "./branch-schema";

export const EXPERIENCE_SCOPE_CHANGED_EVENT = "ondar:experience-scope-changed";

export function writeActiveBranchId(branchId: string | null): void {
  if (typeof window === "undefined") return;

  if (branchId !== null && !isUuid(branchId)) {
    throw new Error("Active Branch must be a UUID");
  }

  if (branchId) {
    localStorage.setItem("branchId", branchId);
  } else {
    localStorage.removeItem("branchId");
  }
  localStorage.removeItem("branch_id");

  window.dispatchEvent(new Event(EXPERIENCE_SCOPE_CHANGED_EVENT));
}

export function reconcileActiveBranchId(
  activeBranchId: string | null,
  branches: Branch[],
): string | null {
  if (!activeBranchId) return null;
  return branches.some(
    (branch) =>
      branch.id === activeBranchId &&
      branch.status === "ACTIVE",
  )
    ? activeBranchId
    : null;
}

export function branchContextLabel(
  activeBranchId: string | null,
  branches: Branch[],
): string {
  if (!activeBranchId) return "All branches";
  const branch = branches.find((candidate) => candidate.id === activeBranchId);
  return branch ? `${branch.code} · ${branch.name}` : "All branches";
}
