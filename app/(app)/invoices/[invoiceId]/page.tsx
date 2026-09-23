"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/features/customers/api";
import { useInvoice } from "@/features/invoicing/api";
import { useBranches } from "@/features/organization/api";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function displayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function stateVariant(state: string) {
  if (state === "PAID") return "success" as const;
  if (state === "OVERDUE" || state === "VOID") return "critical" as const;
  if (state === "DRAFT") return "neutral" as const;
  if (state === "UNPAID") return "warning" as const;
  return "info" as const;
}

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params.invoiceId;
  const organizationId = useActiveOrganizationId();
  const invoice = useInvoice(organizationId ?? "", invoiceId);
  const customer = useCustomer(
    organizationId ?? "",
    invoice.data?.customer_id ?? "",
  );
  const branches = useBranches(organizationId ?? "", true);

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening this invoice."
      />
    );
  }

  if (invoice.isLoading) {
    return (
      <div className="max-w-[1100px] space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (invoice.isError) {
    return (
      <ErrorState
        title="Invoice unavailable"
        description={invoice.error.message}
        retry={{ label: "Retry", onClick: () => void invoice.refetch() }}
      />
    );
  }

  if (!invoice.data) {
    return (
      <EmptyState
        title="Invoice not found"
        description="The invoice could not be resolved in this Organization."
        action={{ label: "Back to invoices", href: "/app/invoices" }}
      />
    );
  }

  const row = invoice.data;
  const branch =
    branches.data?.find((candidate) => candidate.id === row.branch_id) ?? null;
  const customerName =
    customer.data?.name ?? `Customer ${row.customer_id.slice(0, 8)}…`;

  return (
    <div className="max-w-[1100px] space-y-6">
      <PageHeader
        eyebrow={
          row.invoice_number ? `Invoice ${row.invoice_number}` : "Invoice draft"
        }
        title={customerName}
        description={`${row.document_state} · ${row.payment_state} · Due ${displayDate(
          row.due_date,
        )}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/invoices">Back to invoices</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={stateVariant(row.document_state)}>
          {row.document_state}
        </Badge>
        <Badge variant={stateVariant(row.payment_state)}>
          {row.payment_state}
        </Badge>
        <Badge variant={stateVariant(row.collection_state)}>
          {row.collection_state}
        </Badge>
        <Badge variant="neutral">{row.delivery_state}</Badge>
        <Badge variant="neutral">{row.view_state}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Customer
                  </div>
                  <div className="mt-1 font-medium">{customerName}</div>
                  <div className="text-muted-foreground">
                    {customer.data?.email ??
                      customer.data?.phone ??
                      row.customer_id}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Operating Branch
                  </div>
                  <div className="mt-1 font-medium">
                    {branch
                      ? `${branch.code} · ${branch.name}`
                      : `Branch ${row.branch_id.slice(0, 8)}…`}
                  </div>
                  <div className="text-muted-foreground">
                    {branch
                      ? `${branch.timezone} · ${branch.status}`
                      : "Canonical Branch recorded on invoice"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Issue date</div>
                  <div>{displayDate(row.issue_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Due date</div>
                  <div>{displayDate(row.due_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Currency</div>
                  <div>{row.currency}</div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-4 text-right">Line total</span>
                </div>
                <div className="mt-2 divide-y">
                  {row.line_items.map((line) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-12 gap-2 py-3 text-sm"
                    >
                      <span className="col-span-6">{line.description}</span>
                      <span className="col-span-2 text-right tabular-nums">
                        {line.quantity}
                      </span>
                      <span className="col-span-4 text-right tabular-nums">
                        {formatMoney(line.line_total, row.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatMoney(row.subtotal, row.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tabular-nums">
                    {formatMoney(row.discount_total, row.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">
                    {formatMoney(row.tax_total, row.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charges</span>
                  <span className="tabular-nums">
                    {formatMoney(row.charge_total, row.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <MoneyAmount
                    amount={row.grand_total}
                    currency={row.currency}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Canonical Branch
              </div>
              <div className="mt-2 text-sm font-medium">
                {branch
                  ? `${branch.code} · ${branch.name}`
                  : row.branch_id}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Branch identity is persisted on the Invoice. Issued and void
                invoices cannot be moved to another Branch.
              </p>
              {branch?.status === "INACTIVE" ? (
                <Badge variant="warning" className="mt-3">
                  Historical Branch
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Server total
              </div>
              <div className="mt-2">
                <MoneyAmount
                  amount={row.grand_total}
                  currency={row.currency}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Financial totals shown here are returned by the Invoicing domain;
                the browser does not recalculate them.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
