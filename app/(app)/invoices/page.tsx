"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoices } from "@/features/invoices/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type DocumentState = "DRAFT" | "ISSUED" | "VOID" | null;

function shortId(value: string) {
  return value.slice(0, 8);
}

export default function InvoicesPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const [documentState, setDocumentState] = useState<DocumentState>(null);

  const invoices = useInvoices(orgId, {
    branchId,
    documentState,
    limit: 50,
  });
  const branchAccess = useOperatingBranches(orgId);

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );
  const selectedBranch = branchId ? branchById.get(branchId) : null;
  const scopeLabel = selectedBranch
    ? `${selectedBranch.code} · ${selectedBranch.name}`
    : "All branches";

  const rows = invoices.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Invoices"
        description={
          branchId
            ? "Showing invoices attributed to the selected operating Branch."
            : "Organization-wide invoice view across authorized Branches."
        }
        actions={
          <Link href="/app/invoices/new">
            <Button>Create invoice</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            [null, "All"],
            ["DRAFT", "Draft"],
            ["ISSUED", "Issued"],
            ["VOID", "Void"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={label}
            size="sm"
            variant={documentState === value ? "primary" : "secondary"}
            onClick={() => setDocumentState(value)}
          >
            {label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {scopeLabel}
        </span>
      </div>

      {invoices.isLoading ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Loading invoices…
          </CardContent>
        </Card>
      ) : invoices.isError ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Could not load invoices</div>
            <div className="mt-1 text-muted-foreground">
              {invoices.error instanceof Error
                ? invoices.error.message
                : "The invoice request failed."}
            </div>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No invoices match this Branch and state.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </tr>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => {
                  const branch = branchById.get(invoice.branch_id);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium tabular-nums">
                        {invoice.invoice_number ?? "Draft"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {shortId(invoice.customer_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          {branch?.code ?? shortId(invoice.branch_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(invoice.grand_total, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-xs">{invoice.due_date}</TableCell>
                      <TableCell>
                        <span className="inline-flex gap-1">
                          <Badge
                            variant={
                              invoice.document_state === "DRAFT"
                                ? "neutral"
                                : invoice.document_state === "VOID"
                                  ? "critical"
                                  : "info"
                            }
                          >
                            {invoice.document_state}
                          </Badge>
                          <Badge
                            variant={
                              invoice.payment_state === "PAID"
                                ? "success"
                                : "neutral"
                            }
                          >
                            {invoice.payment_state}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/app/invoices/${invoice.id}`}>
                          <Button size="sm" variant="ghost">
                            Open
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((invoice) => {
              const branch = branchById.get(invoice.branch_id);
              return (
                <Link
                  key={invoice.id}
                  href={`/app/invoices/${invoice.id}`}
                  className="block rounded-lg border bg-surface p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {invoice.invoice_number ?? "Draft invoice"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {branch?.code ?? shortId(invoice.branch_id)} · Due{" "}
                        {invoice.due_date}
                      </div>
                    </div>
                    <div className="tabular-nums font-semibold">
                      {formatMoney(invoice.grand_total, invoice.currency)}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge>{invoice.document_state}</Badge>
                    <Badge
                      variant={
                        invoice.payment_state === "PAID" ? "success" : "neutral"
                      }
                    >
                      {invoice.payment_state}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
