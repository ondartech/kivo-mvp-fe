"use client";

import { useEffect, useState } from "react";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicInvoice, type PublicInvoice } from "@/features/public/api";

function partyName(party: Record<string, unknown>, fallback: string): string {
  for (const key of ["display_name", "name", "legal_name", "business_name"]) {
    const value = party[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export function PublicInvoiceView({ token }: { token: string }) {
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicInvoice(token)
      .then((value) => {
        if (active) setInvoice(value);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load invoice.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (error) {
    return (
      <PublicShell>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium">This invoice is unavailable.</div>
            <div className="mt-2 text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </PublicShell>
    );
  }

  if (!invoice) {
    return (
      <PublicShell>
        <div className="text-sm text-muted-foreground">Loading invoice…</div>
      </PublicShell>
    );
  }

  const sellerName = partyName(invoice.seller, "Seller");
  const buyerName = partyName(invoice.buyer, "Customer");
  const settled = invoice.payment_state === "PAID";
  const amountDue = invoice.amount_due ?? invoice.outstanding;

  return (
    <PublicShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Invoice
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {invoice.invoice_number}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {sellerName} → {buyerName}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Issued {invoice.issue_date} · Due {invoice.due_date} · {invoice.currency}
          </div>
        </div>
        <Badge variant={settled ? "success" : "warning"}>
          {invoice.collection_state ?? invoice.payment_state}
        </Badge>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="space-y-3">
            {invoice.line_items.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 border-b pb-3 text-sm last:border-0"
              >
                <div className="col-span-7">
                  <div className="font-medium">{line.description}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {line.quantity} ·{" "}
                    <MoneyAmount
                      amount={line.unit_price}
                      currency={invoice.currency}
                      emphasis="secondary"
                    />
                  </div>
                </div>
                <div className="col-span-5 text-right">
                  <MoneyAmount
                    amount={line.line_total}
                    currency={invoice.currency}
                    emphasis="table"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
            <SummaryRow label="Subtotal" amount={invoice.subtotal} currency={invoice.currency} />
            {invoice.discount_total !== "0.00" ? (
              <SummaryRow label="Discount" amount={invoice.discount_total} currency={invoice.currency} />
            ) : null}
            {invoice.tax_total !== "0.00" ? (
              <SummaryRow label="Tax" amount={invoice.tax_total} currency={invoice.currency} />
            ) : null}
            {invoice.charge_total !== "0.00" ? (
              <SummaryRow label="Charges" amount={invoice.charge_total} currency={invoice.currency} />
            ) : null}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <MoneyAmount amount={invoice.grand_total} currency={invoice.currency} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Outstanding</span>
              <MoneyAmount amount={amountDue} currency={invoice.currency} emphasis="table" />
            </div>
          </div>

          {!settled && invoice.payment_url ? (
            <Button className="mt-6 w-full" size="lg" asChild>
              <a href={invoice.payment_url}>
                {invoice.payment_cta_label ?? "Pay invoice"} ·{" "}
                <MoneyAmount amount={amountDue} currency={invoice.currency} emphasis="secondary" />
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </PublicShell>
  );
}

function SummaryRow({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: string;
  currency: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <MoneyAmount amount={amount} currency={currency} emphasis="secondary" />
    </div>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[760px] px-4 py-8">
        <div className="text-center text-sm font-semibold">Ondar</div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
