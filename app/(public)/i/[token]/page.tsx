import { headers } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { env } from "@/lib/env";
import { publicApiUrl } from "@/lib/public-api";

type PublicInvoiceLine = {
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
};

type PublicInvoice = {
  invoice_number: string;
  seller: Record<string, unknown>;
  buyer: Record<string, unknown>;
  issue_date: string;
  due_date: string;
  currency: string;
  line_items: PublicInvoiceLine[];
  subtotal: string;
  discount_total: string;
  tax_total: string;
  charge_total: string;
  grand_total: string;
  payment_state: string;
  collection_state?: string | null;
  payment_cta_label?: string | null;
  payment_url?: string | null;
  outstanding: string;
  amount_paid?: string | null;
  amount_due?: string | null;
};

function partyName(party: Record<string, unknown>): string {
  for (const key of ["display_name", "legal_name", "name"]) {
    const value = party[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "—";
}

function partySecondary(party: Record<string, unknown>): string | null {
  const values = [
    party.city,
    party.state,
    party.country_code,
  ].filter((value): value is string => typeof value === "string" && !!value.trim());

  return values.length ? values.join(", ") : null;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function paymentBadgeVariant(
  paymentState: string,
): "success" | "warning" | "neutral" {
  if (paymentState === "PAID") return "success";
  if (paymentState === "UNPAID" || paymentState === "PARTIALLY_PAID") {
    return "warning";
  }
  return "neutral";
}

async function fetchInvoice(
  host: string | null,
  token: string,
): Promise<{ invoice: PublicInvoice | null; pdfUrl: string }> {
  const invoiceUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/invoices/${encodeURIComponent(token)}`,
  );
  const pdfUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/invoices/${encodeURIComponent(token)}/pdf`,
  );

  const response = await fetch(invoiceUrl, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return { invoice: null, pdfUrl };
  }
  return {
    invoice: (await response.json()) as PublicInvoice,
    pdfUrl,
  };
}

function UnavailableInvoice() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-[560px]">
        <CardContent className="p-8 text-center">
          <div className="text-lg font-semibold">Invoice link unavailable</div>
          <p className="mt-2 text-sm text-muted-foreground">
            This secure invoice link is invalid, expired, revoked, or no longer available.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ??
    requestHeaders.get("host");

  const { invoice, pdfUrl } = await fetchInvoice(host, token);
  if (!invoice) return <UnavailableInvoice />;

  const sellerName = partyName(invoice.seller);
  const buyerName = partyName(invoice.buyer);
  const sellerSecondary = partySecondary(invoice.seller);
  const amountDue = invoice.amount_due ?? invoice.outstanding;
  const badgeVariant = paymentBadgeVariant(invoice.payment_state);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <header className="text-center">
          <div
            className={
              "mx-auto flex h-8 w-8 items-center justify-center rounded-md " +
              "bg-brand font-semibold text-brand-foreground"
            }
          >
            O
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Ondar · Secure invoice
          </div>
        </header>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div
              className={
                "flex flex-wrap items-center justify-between gap-2 " +
                "text-xs text-muted-foreground"
              }
            >
              <span>
                {invoice.invoice_number} · Issued {formatDate(invoice.issue_date)}
              </span>
              <Badge variant={badgeVariant}>
                {invoice.payment_state.replaceAll("_", " ")}
              </Badge>
            </div>

            <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  From
                </div>
                <div className="font-medium">{sellerName}</div>
                {sellerSecondary ? (
                  <div className="text-muted-foreground">{sellerSecondary}</div>
                ) : null}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Bill to
                </div>
                <div className="font-medium">{buyerName}</div>
              </div>
            </div>

            <div className="mt-6">
              <div
                className={
                  "grid grid-cols-12 gap-2 text-xs uppercase tracking-wide " +
                  "text-muted-foreground"
                }
              >
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-4 text-right">Amount</span>
              </div>
              <div className="mt-2 divide-y">
                {invoice.line_items.map((line, index) => (
                  <div
                    key={`${line.description}-${index}`}
                    className="grid grid-cols-12 gap-2 py-3 text-sm"
                  >
                    <span className="col-span-6">{line.description}</span>
                    <span className="col-span-2 text-right tabular-nums">
                      {line.quantity}
                    </span>
                    <MoneyAmount
                      amount={line.line_total}
                      currency={invoice.currency}
                      emphasis="table"
                      className="col-span-4"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-3">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <MoneyAmount
                    amount={invoice.grand_total}
                    currency={invoice.currency}
                    emphasis="document"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding</span>
                  <MoneyAmount
                    amount={amountDue}
                    currency={invoice.currency}
                    emphasis="table"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border bg-neutral-50 p-3 text-sm">
              <div className="font-medium">
                Due {formatDate(invoice.due_date)}
              </div>
              {invoice.collection_state ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  Collection status: {invoice.collection_state.replaceAll("_", " ")}
                </div>
              ) : null}
            </div>

            {invoice.payment_url && invoice.payment_state !== "PAID" ? (
              <Button className="mt-4 w-full" size="lg" asChild>
                <a href={invoice.payment_url}>
                  {invoice.payment_cta_label ?? "Pay invoice"}
                </a>
              </Button>
            ) : null}

            <Button className="mt-3 w-full" variant="outline" asChild>
              <a href={pdfUrl}>Download PDF</a>
            </Button>
          </CardContent>
        </Card>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Secure invoice delivered with Ondar
        </footer>
      </div>
    </main>
  );
}
