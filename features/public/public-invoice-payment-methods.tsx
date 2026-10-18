"use client";

import { useEffect, useRef, useState } from "react";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { Button } from "@/components/ui/button";
import {
  acknowledgePublicInvoicePspFees,
  choosePublicInvoicePsp,
  getPublicInvoicePaymentOptions,
  getPublicInvoicePaymentSession,
  getPublicInvoicePspFeePreview,
  getPublicInvoiceCheckoutStatus,
  initiatePublicInvoiceCheckout,
  certifiedPspCheckoutPath,
  type PublicInvoiceCheckoutStatus,
  type PublicInvoiceFeePreview,
  type PublicInvoicePaymentOptions,
  type PublicInvoicePaymentSession,
} from "@/features/public/api";

type Props = {
  token: string;
  amountDue: string;
  currency: string;
};

type PendingState = "selecting" | "consenting" | "initiating" | "refreshing" | null;

export function PublicInvoicePaymentMethods({ token, amountDue, currency }: Props) {
  const [available, setAvailable] = useState<PublicInvoicePaymentOptions | null>(null);
  const [session, setSession] = useState<PublicInvoicePaymentSession | null>(null);
  const [quote, setQuote] = useState<PublicInvoiceFeePreview | null>(null);
  const [pending, setPending] = useState<PendingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [checkout, setCheckout] = useState<PublicInvoiceCheckoutStatus | null>(null);
  // Keep the same idempotency key through network failure and retry.
  const attemptKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPublicInvoicePaymentOptions(token),
      getPublicInvoicePaymentSession(token),
      getPublicInvoiceCheckoutStatus(token).catch(() => null),
    ])
      .then(([options, currentSession, currentCheckout]) => {
        if (!active) return;
        setAvailable(options);
        setSession(currentSession);
        setCheckout(currentCheckout);
      })
      .catch(() => {
        if (active) {
          // Older API deployments may not expose the new choice projection.
          // Preserve legacy invoice payment behavior in that case.
          setAvailable(null);
          setSession(null);
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!available || !session || available.options.length === 0) {
    return null;
  }

  // Only server-confirmed and independently certified accounts become interactive.
  const paymentExecutable =
    available.checkout_enabled && session.checkout_enabled;
  const selected = session.selected_connection_id;
  const canAcknowledge =
    paymentExecutable &&
    quote !== null &&
    quote.checkout_enabled &&
    quote.choice_version === session.version &&
    !acknowledged;

  async function selectConnection(connectionId: string): Promise<void> {
    if (!paymentExecutable || pending) return;
    const option = available?.options.find((item) => item.connection_id === connectionId);
    if (!option?.checkout_enabled || !session) return;
    setPending("selecting");
    setError(null);
    setQuote(null);
    setAcknowledged(false);
    attemptKey.current = null;
    try {
      const chosen = await choosePublicInvoicePsp(
        token,
        connectionId,
        session.version,
        crypto.randomUUID(),
      );
      setSession(chosen);
      if (chosen.fee_quote_available) {
        const nextQuote = await getPublicInvoicePspFeePreview(token);
        if (nextQuote.connection_id !== connectionId ||
            nextQuote.choice_version !== chosen.version) {
          throw new Error("Payment fees changed. Refresh your invoice options.");
        }
        setQuote(nextQuote);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to select that payment provider. Try again.",
      );
    } finally {
      setPending(null);
    }
  }

  async function acknowledgeFeeQuote(): Promise<void> {
    if (!canAcknowledge || !quote || pending) return;
    setPending("consenting");
    setError(null);
    try {
      const result = await acknowledgePublicInvoicePspFees(
        token, quote, crypto.randomUUID(),
      );
      if (result.state !== "ACKNOWLEDGED_NO_CHECKOUT") {
        throw new Error("Payment-fee acknowledgement could not be confirmed.");
      }
      // Fee acknowledgement is NOT a PSP payment and NOT proof of settlement.
      setAcknowledged(true);
      const progress = await getPublicInvoiceCheckoutStatus(token);
      setCheckout(progress);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to confirm the displayed payment fees.",
      );
    } finally {
      setPending(null);
    }
  }

  async function initiateCheckout(): Promise<void> {
    if (
      pending !== null || !acknowledged || !quote ||
      !paymentExecutable || !quote.checkout_enabled ||
      checkout?.checkout_enabled !== true ||
      quote.choice_version !== session.version
    ) return;
    setPending("initiating");
    setError(null);
    try {
      attemptKey.current ??= crypto.randomUUID();
      const result = await initiatePublicInvoiceCheckout(
        token, quote, attemptKey.current,
      );
      setCheckout(result);
      // A PSP payment can still be pending after a hosted checkout exists.
      // No browser status may mark the invoice paid by itself.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message :
        "Unable to prepare secure checkout. Check payment status before retrying.");
      try {
        setCheckout(await getPublicInvoiceCheckoutStatus(token));
      } catch {
        // Retain the original initiation error; never choose another PSP.
      }
    } finally {
      setPending(null);
    }
  }

  async function refreshCheckoutStatus(): Promise<void> {
    if (pending !== null) return;
    setPending("refreshing");
    setError(null);
    try {
      setCheckout(await getPublicInvoiceCheckoutStatus(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message :
        "Unable to verify payment progress. Refresh the invoice.");
    } finally {
      setPending(null);
    }
  }

  const checkoutDescription: Record<PublicInvoiceCheckoutStatus["state"], string> = {
    CHOOSE_PROVIDER: "Choose a processor to review its fees.",
    REVIEW_FEES: "Review the current processor charges before continuing.",
    CONSENT_ACKNOWLEDGED: "Payment charges acknowledged. No payment has been made.",
    AWAITING_INITIATION: "Your payment request is reserved. Awaiting secure checkout.",
    INITIATION_IN_PROGRESS: "Connecting to the processor. Do not retry payment.",
    CHECKOUT_PREPARED: "A hosted checkout was prepared. Payment is not yet confirmed.",
    REVIEW_REQUIRED: "Your previous payment attempt needs review. Do not pay again.",
    PAYMENT_CONFIRMED: "Payment confirmed from Ondar's invoice records.",
  };

  return (
    <section aria-labelledby="invoice-payment-methods" className="mt-6 border-t pt-5">
      <h2 id="invoice-payment-methods" className="font-semibold">
        Pay online
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Payment providers connected by the seller. Choose a provider before
        continuing to its secure checkout.
      </p>
      <div role="group" aria-label="Available payment processors" className="mt-3 grid gap-2 sm:grid-cols-2">
        {available.options.map((option, index) => {
          const matchingAccounts = available.options.filter(
            (item) => item.provider_key === option.provider_key,
          );
          const accountOrdinal = available.options.slice(0, index + 1).filter(
            (item) => item.provider_key === option.provider_key,
          ).length;
          const publicLabel = matchingAccounts.length > 1
            ? `${option.provider_name} · Account option ${accountOrdinal}`
            : option.provider_name;
          const enabled = paymentExecutable && option.checkout_enabled;
          const chosen = selected === option.connection_id;
          return (
            <button
              key={option.connection_id}
              type="button"
              disabled={!enabled || pending !== null}
              aria-pressed={chosen}
              onClick={() => void selectConnection(option.connection_id)}
              className={[
                "rounded-lg border p-3 text-left transition-colors",
                chosen ? "border-foreground" : "border-border",
                enabled
                  ? "cursor-pointer hover:border-foreground focus-visible:outline focus-visible:outline-2"
                  : "cursor-not-allowed opacity-65",
              ].join(" ")}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{publicLabel}</span>
                {option.is_preferred ? (
                  <span className="text-xs text-muted-foreground">Seller preferred</span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {enabled
                  ? chosen ? "Selected" : "Select provider"
                  : "Not yet available for online checkout"}
              </span>
            </button>
          );
        })}
      </div>
      {!paymentExecutable ? (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          These connected processors are being prepared for secure checkout.
          Online selection will be enabled after payment verification is certified.
        </p>
      ) : null}
      {quote && quote.connection_id === selected ? (
        <div className="mt-4 rounded-lg border p-4 text-sm">
          <div className="mb-2 font-medium">Review payment charges</div>
          <div className="flex justify-between gap-4">
            <span>Invoice balance</span>
            <MoneyAmount amount={quote.invoice_amount} currency={quote.currency} />
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span>Processor charge</span>
            <MoneyAmount amount={quote.provider_fee} currency={quote.currency} />
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span>Ondar charge</span>
            <MoneyAmount amount={quote.ondar_fee} currency={quote.currency} />
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span>Fees payable by {quote.fee_payer === "BUYER" ? "you" : "seller"}</span>
            <MoneyAmount amount={quote.buyer_fee} currency={quote.currency} />
          </div>
          <div className="mt-3 flex justify-between gap-4 border-t pt-3 font-semibold">
            <span>Total to pay</span>
            <MoneyAmount amount={quote.buyer_total} currency={quote.currency} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Charges may change when this quote expires. No payment has been taken.
          </p>
          {canAcknowledge ? (
            <Button
              type="button"
              className="mt-3 w-full"
              onClick={() => void acknowledgeFeeQuote()}
              disabled={pending !== null}
            >
              Confirm payment charges
            </Button>
          ) : null}
        </div>
      ) : null}
      {acknowledged ? (
        <p role="status" className="mt-3 text-sm">
          Fee acknowledgement recorded. No payment has been initiated.
        </p>
      ) : null}
      {acknowledged && quote && paymentExecutable &&
       checkout?.checkout_enabled === true &&
       quote.checkout_enabled && quote.choice_version === session.version &&
       checkout.state === "CONSENT_ACKNOWLEDGED" ? (
        <Button className="mt-3 w-full" type="button"
          disabled={pending !== null}
          onClick={() => void initiateCheckout()}>
          Continue to secure checkout
        </Button>
      ) : null}
      {checkout && !["CHOOSE_PROVIDER", "REVIEW_FEES"].includes(checkout.state) ? (
        <div className="mt-3 space-y-2 text-sm" aria-live="polite">
          <p role="status">{checkoutDescription[checkout.state]}</p>
          {checkout.state !== "PAYMENT_CONFIRMED" ? (
            <Button type="button" variant="outline" size="sm"
              disabled={pending !== null}
              onClick={() => void refreshCheckoutStatus()}>
              Check payment status
            </Button>
          ) : null}
          {checkout.state === "CHECKOUT_PREPARED" &&
           checkout.checkout_enabled && checkout.redirect_available &&
           paymentExecutable ? (
            <Button type="button" asChild>
              <a href={certifiedPspCheckoutPath(token)} rel="noreferrer">
                Open verified processor checkout
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Invoice balance: <MoneyAmount amount={amountDue} currency={currency} />.
        A payment is confirmed only after Ondar independently verifies the processor.
      </p>
    </section>
  );
}
