"use client";

import { useEffect, useState } from "react";

import { useOrganization } from "@/features/organization/api";

export function useOrganizationCurrencySelection(orgId: string) {
  const organization = useOrganization(orgId);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    setCurrency("");
  }, [orgId]);

  useEffect(() => {
    if (!currency && organization.data?.default_currency) {
      setCurrency(organization.data.default_currency);
    }
  }, [currency, organization.data?.default_currency]);

  return {
    currency,
    setCurrency,
    currencyValid: /^[A-Z]{3}$/.test(currency),
    organization,
  };
}
