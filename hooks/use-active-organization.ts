"use client";

import { useEffect, useState } from "react";

import { EXPERIENCE_SCOPE_CHANGED_EVENT } from "@/features/organization/branch-context";
import { readExperienceScope } from "@/lib/experience/ask-runtime";

function useExperienceScopeValue(
  select: (scope: ReturnType<typeof readExperienceScope>) => string | null,
): string | null {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setValue(select(readExperienceScope()));
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(EXPERIENCE_SCOPE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(EXPERIENCE_SCOPE_CHANGED_EVENT, refresh);
    };
  }, [select]);

  return value;
}

const selectOrganizationId = (
  scope: ReturnType<typeof readExperienceScope>,
) => scope.organizationId;

const selectBranchId = (
  scope: ReturnType<typeof readExperienceScope>,
) => scope.branchId;

export function useActiveOrganizationId(): string | null {
  return useExperienceScopeValue(selectOrganizationId);
}

export function useActiveBranchId(): string | null {
  return useExperienceScopeValue(selectBranchId);
}
