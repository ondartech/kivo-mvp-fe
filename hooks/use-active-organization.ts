"use client";

import { useEffect, useState } from "react";

import {
  EXPERIENCE_SCOPE_EVENT,
  readExperienceScope,
} from "@/lib/experience/ask-runtime";

export function useActiveOrganizationId(): string | null {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setOrganizationId(readExperienceScope().organizationId);
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(EXPERIENCE_SCOPE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(EXPERIENCE_SCOPE_EVENT, refresh);
    };
  }, []);

  return organizationId;
}
