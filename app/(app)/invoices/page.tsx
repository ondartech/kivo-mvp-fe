"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/features/customers/api";
import {
  useInvoices,
  type InvoiceDocumentState,
} from "@/features/invoicing/api";
import { useBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type StateFilter = "ALL" | InvoiceDocumentState;

function shortId(value: string): string {
  return `${value.slice(0, 8)}…`;
}

function documentVariant(state: string) {
  if (state === "DRAFT") return "neutral" as const;
  if (state === "VOID") return "critical" as const;
  return "info" as const;
}

function paymentVariant(state: string) {
  if (state === "PAID") return "success" as const;
  if (state === "PARTIALLY_PAID") return "info" as const;
  return "warning" as const;
}

function dueLabel(dueDate: string): string {
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return dueDate;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(due);
}

export default function InvoicesPage() {
  const organizationId = useActiveOrganizationId();
  const activeBranchId = useActiveBranchId();
  const [documentState, setDocumentState] = useState<StateFilter>("ALL");
  const [cursor, setCursor] = useState<string | null>(null);

  const invoices = useInvoices(organizationId ?? "", {
    branchId: activeBranchId,
    documentState: documentState === "ALL" ? undefined : documentState,
    cursor,
    limit: 20,
  });
  const branches = useBranches(organizationId ?? "", true);
  const customers = useCustomers(organizationId ?? "", { limit: 100 });

  useEffect(() => {
    setCursor(null);
  }, [activeBranchId, documentState]);

  const branchById = useMemo(
    () => new Map((branches.data ?? []).map((branch) => [branch.id, branch])),
    [branches.data],
  );
  const customerById = useMemo(
    () =>
      new Map(
        (customers.data?.data ?? []).map((customer) => [
          customer.id,
          customer.name,
        ]),
      ),
    [customers.data?.data],
  );

  const activeBranch = activeBranchId
    ? branchById.get(activeBranchId) ?? null
    : null;
  const rows = invoices.data?.data ?? [];

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening invoices."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Server-authoritative invoices scoped to the current operating context."
        actions={
          <Button asChild>
            <Link href="/app/invoices/new">Create invoice</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Operating context
        </span>
        <Badge variant={activeBranch ? "info" : "neutral"}>
          {activeBranch
            ? `${activeBranch.code} · ${activeBranch.name}`
            : activeBranchId
              ? `Branch ${shortId(activeBranchId)}`
              : "All branches"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Change Branch from the shell context selector.
        </span>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Invoice state filter">
        {(["ALL", "DRAFT", "ISSUED", "VOID"] as StateFilter[]).map((state) => (
          <Button
            key={state}
            size="sm"
            variant={documentState === state ? "primary" : "outline"}
            onClick={() => setDocumentState(state)}
          >
            {state === "ALL" ? "All states" : state}
          </Button>
        ))}
      </div>

      {invoices.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : invoices.isError ? (
        <ErrorState
          title="Invoices unavailable"
          description={invoices.error.message}
          retry={{ label: "Retry", onClick: () => void invoices.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No invoices in this context"
          description={
            activeBranch
              ? `No invoices match ${activeBranch.code} and the selected state filter.`
              : "No invoices match the selected state filter."
          }
          action={{ label: "Create invoice", href: "/app/invoices/new" }}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => {
                  const branchRow = branchById.get(invoice.branch_id);
                  const customer =
                    customerById.get(invoice.customer_id) ??
                    `Customer ${shortId(invoice.customer_id)}`;
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{customer}</TableCell>
                      <TableCell className="tabular-nums">
                        {invoice.invoice_number ?? "Draft"}
                      </TableCell>
                      <TableCell>
                        {branchRow
                          ? `${branchRow.code} · ${branchRow.name}`
                          : shortId(invoice.branch_id)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatMoney(invoice.grand_total, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {dueLabel(invoice.due_date)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex flex-wrap gap-1">
                          <Badge variant={documentVariant(invoice.document_state)}>
                            {invoice.document_state}
                          </Badge>
                          <Badge variant={paymentVariant(invoice.payment_state)}>
                            {invoice.payment_state}
                          </Badge>
                          {invoice.collection_state === "OVERDUE" ? (
                            <Badge variant="critical">OVERDUE</Badge>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/app/invoices/${invoice.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((invoice) => {
              const branchRow = branchById.get(invoice.branch_id);
              const customer =
                customerById.get(invoice.customer_id) ??
                `Customer ${shortId(invoice.customer_id)}`;
              return (
                <Link
                  key={invoice.id}
                  href={`/app/invoices/${invoice.id}`}
                  className="block rounded-lg border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{customer}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {invoice.invoice_number ?? "Draft"} ·{" "}
                        {branchRow?.code ?? shortId(invoice.branch_id)}
                      </div>
                    </div>
                    <div className="tabular-nums font-semibold">
                      {formatMoney(invoice.grand_total, invoice.currency)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant={documentVariant(invoice.document_state)}>
                      {invoice.document_state}
                    </Badge>
                    <Badge variant={paymentVariant(invoice.payment_state)}>
                      {invoice.payment_state}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {invoices.isFetching ? "Updating…" : `${rows.length} invoices`}
            </div>
            <div className="flex gap-2">
              {cursor ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCursor(null)}
                  disabled={invoices.isFetching}
                >
                  First page
                </Button>
              ) : null}
              {invoices.data?.next_cursor ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCursor(invoices.data?.next_cursor ?? null)}
                  disabled={invoices.isFetching}
                >
                  Next
                </Button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
