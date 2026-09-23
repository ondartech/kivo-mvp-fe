"use client";

import { useEffect, useState } from "react";

import {
  EXPERIENCE_SCOPE_EVENT,
  readExperienceScope,
} from "@/lib/experience/ask-runtime";

export function useActiveBranchId(): string | null {
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setBranchId(readExperienceScope().branchId);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(EXPERIENCE_SCOPE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(EXPERIENCE_SCOPE_EVENT, refresh);
    };
  }, []);

  return branchId;
}
