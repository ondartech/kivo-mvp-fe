import { headers } from "next/headers";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPublic } from "@/lib/api-client";
import { env } from "@/lib/env";
import { publicApiUrl } from "@/lib/public-api";

type PublicQuoteLine = {
  description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
};

type PublicQuote = {
  quote_number: string;
  quote_version: number;
  status: string;
  status_label: string;
  seller_name: string;
  customer_name: string;
  currency: string;
  valid_until?: string | null;
  sent_at?: string | null;
  line_items: PublicQuoteLine[];
  subtotal: string;
  discount_total: string;
  tax_total: string;
  charge_total: string;
  grand_total: string;
  notes?: string | null;
  terms?: string | null;
  project_name?: string | null;
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function statusVariant(
  status: string,
): "success" | "warning" | "neutral" | "critical" | "info" {
  if (status === "ACCEPTED") return "success";
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") {
    return "critical";
  }
  if (status === "SENT") return "info";
  if (status === "UNDER_REVIEW") return "warning";
  return "neutral";
}

async function fetchQuote(
  host: string | null,
  token: string,
): Promise<{ quote: PublicQuote | null; pdfUrl: string }> {
  const quoteUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/quotes/${encodeURIComponent(token)}`,
  );
  const pdfUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/public/quotes/${encodeURIComponent(token)}/pdf`,
  );

  const response = await fetchPublic(quoteUrl, {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return { quote: null, pdfUrl };
  return { quote: (await response.json()) as PublicQuote, pdfUrl };
}

function UnavailableQuote() {
  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-[560px]">
        <CardContent className="p-8 text-center">
          <div className="text-lg font-semibold">Quote link unavailable</div>
          <p className="mt-2 text-sm text-muted-foreground">
            This secure quote link is invalid, expired, revoked, or no longer available.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ??
    requestHeaders.get("host");
  const { quote, pdfUrl } = await fetchQuote(host, token);

  if (!quote) return <UnavailableQuote />;

  const validUntil = formatDate(quote.valid_until);
  const sentAt = formatDate(quote.sent_at);

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
            Ondar · Secure quote
          </div>
        </header>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Quote
                </div>
                <div className="font-semibold">
                  {quote.quote_number} · Version {quote.quote_version}
                </div>
              </div>
              <Badge variant={statusVariant(quote.status)}>
                {quote.status_label}
              </Badge>
            </div>

            <div className="mt-5 grid gap-6 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  From
                </div>
                <div className="font-medium">{quote.seller_name}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Prepared for
                </div>
                <div className="font-medium">{quote.customer_name}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border bg-neutral-50 p-3 text-sm sm:grid-cols-2">
              {sentAt ? (
                <div>
                  <span className="text-muted-foreground">Sent </span>
                  {sentAt}
                </div>
              ) : null}
              {validUntil ? (
                <div>
                  <span className="text-muted-foreground">Valid until </span>
                  {validUntil}
                </div>
              ) : null}
              {quote.project_name ? (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Project </span>
                  {quote.project_name}
                </div>
              ) : null}
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
                {quote.line_items.map((line, index) => (
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
                      currency={quote.currency}
                      emphasis="table"
                      className="col-span-4"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <MoneyAmount
                  amount={quote.grand_total}
                  currency={quote.currency}
                  emphasis="document"
                />
              </div>
            </div>

            {quote.notes ? (
              <section className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">{quote.notes}</p>
              </section>
            ) : null}

            {quote.terms ? (
              <section className="mt-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Terms
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm">{quote.terms}</p>
              </section>
            ) : null}

            <Button className="mt-6 w-full" variant="outline" asChild>
              <a href={pdfUrl}>Download PDF</a>
            </Button>
          </CardContent>
        </Card>

        <footer className="mt-6 text-center text-xs text-muted-foreground">
          Secure quote delivered with Ondar
        </footer>
      </div>
    </main>
  );
}
