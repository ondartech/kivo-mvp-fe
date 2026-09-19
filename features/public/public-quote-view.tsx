"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { getPublicQuote, type PublicQuote } from "@/features/public/api";

export function PublicQuoteView({ token }: { token: string }) {
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicQuote(token)
      .then((value) => {
        if (active) setQuote(value);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load quote.");
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
            <div className="text-sm font-medium">This quote is unavailable.</div>
            <div className="mt-2 text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </PublicShell>
    );
  }

  if (!quote) {
    return (
      <PublicShell>
        <div className="text-sm text-muted-foreground">Loading quote…</div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Quote</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{quote.quote_number}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {quote.seller_name} → {quote.customer_name}
          </div>
        </div>
        <Badge>{quote.status_label}</Badge>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          {quote.project_name ? (
            <div className="mb-5 text-sm">
              <span className="text-muted-foreground">Project · </span>
              <span className="font-medium">{quote.project_name}</span>
            </div>
          ) : null}

          <div className="space-y-3">
            {quote.line_items.map((line, index) => (
              <div
                className="grid grid-cols-12 gap-3 border-b pb-3 text-sm last:border-0"
                key={index}
              >
                <div className="col-span-7">
                  <div className="font-medium">{line.description}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {line.quantity} · <MoneyAmount amount={line.unit_price} currency={quote.currency} emphasis="secondary" />
                  </div>
                </div>
                <div className="col-span-5 text-right">
                  <MoneyAmount amount={line.line_total} currency={quote.currency} emphasis="table" />
                </div>
              </div>
            ))}
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
            <SummaryRow label="Subtotal" amount={quote.subtotal} currency={quote.currency} />
            {quote.discount_total !== "0.00" ? (
              <SummaryRow label="Discount" amount={quote.discount_total} currency={quote.currency} />
            ) : null}
            {quote.tax_total !== "0.00" ? (
              <SummaryRow label="Tax" amount={quote.tax_total} currency={quote.currency} />
            ) : null}
            {quote.charge_total !== "0.00" ? (
              <SummaryRow label="Charges" amount={quote.charge_total} currency={quote.currency} />
            ) : null}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <MoneyAmount amount={quote.grand_total} currency={quote.currency} />
            </div>
          </div>

          {quote.notes ? (
            <section className="mt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{quote.notes}</p>
            </section>
          ) : null}

          {quote.terms ? (
            <section className="mt-6">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Terms</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{quote.terms}</p>
            </section>
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
