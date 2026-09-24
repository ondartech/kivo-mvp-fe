"use client";

import { useMemo } from "react";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomer } from "@/features/customers/api";
import { useInvoice } from "@/features/invoices/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useTaxCodes } from "@/features/tax/api";
import { findTaxCode } from "@/features/tax/document";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function InvoiceDetailPage({
  params,
}: {
  params: { invoiceId: string };
}) {
  const orgId = useActiveOrganizationId() ?? "";
  const invoice = useInvoice(orgId, params.invoiceId);
  const customer = useCustomer(orgId, invoice.data?.customer_id ?? "");
  const branchAccess = useOperatingBranches(orgId);
  const taxCodes = useTaxCodes(orgId);

  const branch = useMemo(
    () =>
      branchAccess.data?.branches.find(
        (item) => item.id === invoice.data?.branch_id,
      ) ?? null,
    [branchAccess.data?.branches, invoice.data?.branch_id],
  );

  if (invoice.isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading invoice…
        </CardContent>
      </Card>
    );
  }

  if (invoice.isError || !invoice.data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm">
          <div className="font-medium">Could not load invoice</div>
          <div className="mt-1 text-muted-foreground">
            {invoice.error instanceof Error
              ? invoice.error.message
              : "Invoice not found."}
          </div>
        </CardContent>
      </Card>
    );
  }

  const row = invoice.data;
  const customerName = customer.data?.name ?? row.customer_id.slice(0, 8);

  return (
    <div className="max-w-[1100px] space-y-6">
      <PageHeader
        eyebrow={[
          row.invoice_number ?? "Draft invoice",
          branch?.code ?? row.branch_id.slice(0, 8),
        ].join(" · ")}
        title={customerName}
        description={`${row.document_state} · Issue ${row.issue_date} · Due ${row.due_date}`}
      />

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={
            row.document_state === "DRAFT"
              ? "neutral"
              : row.document_state === "VOID"
                ? "critical"
                : "info"
          }
        >
          {row.document_state}
        </Badge>
        <Badge variant={row.payment_state === "PAID" ? "success" : "warning"}>
          {row.payment_state}
        </Badge>
        <Badge variant="neutral">
          {branch ? `${branch.code} · ${branch.name}` : "Branch"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Customer
                  </div>
                  <div className="font-medium">{customerName}</div>
                  <div className="text-muted-foreground">
                    {customer.data?.email ?? "No customer email"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Operating Branch
                  </div>
                  <div className="font-medium">
                    {branch?.name ?? row.branch_id}
                  </div>
                  <div className="text-muted-foreground">
                    {branch?.timezone ?? "Branch identity persisted on invoice"}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-4 text-right">Amount</span>
                </div>
                <div className="mt-2 divide-y">
                  {row.line_items.map((line) => (
                    <div
                      key={line.id}
                      className="grid grid-cols-12 gap-2 py-3 text-sm"
                    >
                      <span className="col-span-6">
                        <span className="block">{line.description}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {findTaxCode(
                            taxCodes.data?.data ?? [],
                            line.tax_code_id,
                          )?.code ?? "No TaxCode"}
                          {line.tax_rate ? " · rate " + line.tax_rate : ""}
                          {" · tax "}
                          <MoneyAmount
                            amount={line.tax_amount}
                            currency={row.currency}
                            emphasis="table"
                          />
                        </span>
                      </span>
                      <span className="col-span-2 text-right tabular-nums">
                        {line.quantity}
                      </span>
                      <span className="col-span-4 text-right tabular-nums">
                        <MoneyAmount
                          amount={line.line_total}
                          currency={row.currency}
                          emphasis="table"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Grand total
              </div>
              <div className="mt-2">
                <MoneyAmount amount={row.grand_total} currency={row.currency} />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{row.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{row.tax_total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charges</span>
                  <span className="tabular-nums">{row.charge_total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
