"use client";

import { useEffect, useState } from "react";

import { readExperienceScope } from "@/lib/experience/ask-runtime";

export function useActiveOrganizationId(): string | null {
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setOrganizationId(readExperienceScope().organizationId);
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return organizationId;
}
