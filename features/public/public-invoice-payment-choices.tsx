"use client";

import { useEffect, useState } from "react";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { Button } from "@/components/ui/button";
import {
  getPublicInvoicePaymentOptions,
  type PublicMerchantPaymentOptions,
} from "@/features/public/api";

// Deployment of the options API and customer-specific PSP execution is not
// certified. Existing production invoice payment links stay unchanged until
// this deliberate source gate is promoted with the backend safety controls.
const PUBLIC_MULTI_PSP_DISCOVERY_ENABLED = false;

type Props = {
  token: string;
  currency: string;
  amountDue: string;
  paymentUrl: string | null | undefined;
  paymentLabel: string | null | undefined;
};

export function PublicInvoicePaymentChoices({
  token,
  currency,
  amountDue,
  paymentUrl,
  paymentLabel,
}: Props) {
  const [options, setOptions] = useState<PublicMerchantPaymentOptions | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!PUBLIC_MULTI_PSP_DISCOVERY_ENABLED) return;
    let active = true;
    getPublicInvoicePaymentOptions(token)
      .then((data) => {
        if (!active) return;
        setOptions(data);
        const preferred = data.options.find((choice) => choice.preferred);
        setSelected(preferred?.connection_id ?? data.options[0]?.connection_id ?? null);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [token]);

  if (!PUBLIC_MULTI_PSP_DISCOVERY_ENABLED) {
    return paymentUrl ? (
      <Button className="mt-6 w-full" size="lg" asChild>
        <a href={paymentUrl}>
          {paymentLabel ?? "Pay invoice"} ·{" "}
          <MoneyAmount amount={amountDue} currency={currency} emphasis="secondary" />
        </a>
      </Button>
    ) : null;
  }

  if (error) {
    return (
      <div className="mt-6 rounded-md border p-4 text-sm" role="status">
        Online payment options are temporarily unavailable. Please contact the seller.
      </div>
    );
  }

  if (!options) {
    return <div className="mt-6 text-sm text-muted-foreground">Checking payment options…</div>;
  }

  if (options.options.length === 0) {
    return (
      <div className="mt-6 rounded-md border p-4 text-sm" role="status">
        No connected online payment providers are available for this invoice.
        Please contact the seller for other payment arrangements.
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-md border p-4" aria-label="Choose payment provider">
      <h2 className="text-base font-semibold">Pay online</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose any payment provider connected by this merchant.
      </p>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Payment providers</legend>
        {options.options.map((choice) => (
          <label
            key={choice.connection_id}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="merchant-psp-connection"
                value={choice.connection_id}
                checked={selected === choice.connection_id}
                disabled={!options.chooser_enabled || !choice.selectable}
                onChange={() => setSelected(choice.connection_id)}
                aria-label={choice.provider_name}
              />
              <span className="text-sm font-medium">{choice.provider_name}</span>
              {choice.preferred && (
                <span className="text-xs text-muted-foreground">Merchant preferred</span>
              )}
            </span>
            {!choice.selectable && (
              <span className="text-xs text-muted-foreground">Not yet available</span>
            )}
          </label>
        ))}
      </fieldset>
      {!options.chooser_enabled && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Payment-provider selection is being enabled. No payment will be initiated here.
        </p>
      )}
      {/*
        A future certified selection endpoint will resolve the selected
        connection under one invoice-level transaction and return an authorized
        checkout session. Deliberately no fallback to a single PSP URL here.
      */}
    </section>
  );
}
