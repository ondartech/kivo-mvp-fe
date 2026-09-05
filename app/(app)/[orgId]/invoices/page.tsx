"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInvoices, type InvoiceRecord } from "@/features/invoices/api";
import { formatMoney } from "@/lib/money";

const fallbackInvoices = [
  { id: "inv-1042", number: "INV-1042", customer: "Acme Ltd.", amount: "2400000", outstanding: "2400000", due: "4 days overdue", doc: "ISSUED", pay: "UNPAID", col: "OVERDUE" },
  { id: "inv-1043", number: "INV-1043", customer: "Bello Consulting", amount: "850000", outstanding: "850000", due: "Due tomorrow", doc: "ISSUED", pay: "UNPAID", col: "DUE_SOON" },
  { id: "inv-1044", number: "INV-1044", customer: "Nova Studio", amount: "450000", outstanding: "0", due: "—", doc: "ISSUED", pay: "PAID", col: "CURRENT" },
  { id: "inv-1045", number: "—", customer: "Maro Ltd", amount: "320000", outstanding: "320000", due: "Draft", doc: "DRAFT", pay: "UNPAID", col: "CURRENT" },
];

export default function InvoicesPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? "org_demo";

  const [activeFilter, setActiveFilter] = React.useState<"ALL" | "DRAFT" | "ISSUED" | "OVERDUE" | "PAID">("ALL");

  const filterDocState = activeFilter === "DRAFT" ? "DRAFT" : activeFilter === "ISSUED" ? "ISSUED" : undefined;
  const { data, isLoading, isError, refetch } = useInvoices(orgId, {
    document_state: filterDocState,
  });

  const apiInvoices = data?.data;
  const hasApiData = apiInvoices && apiInvoices.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Customer · Amount · Outstanding · Due · State — sorted by attention."
        actions={
          <Link href={`/${orgId}/invoices/new`}>
            <Button size="sm">Create invoice</Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(["ALL", "OVERDUE", "DRAFT", "ISSUED", "PAID"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              activeFilter === filter
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-surface text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {filter === "ALL" ? "All Invoices" : filter}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
          ₦ · NGN · No float · Server totals
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError && !hasApiData ? (
        <ErrorState
          title="Could not load invoices"
          description="We were unable to reach the invoice service. Your financial records are secure."
          retry={{ label: "Try again", onClick: () => refetch() }}
        />
      ) : hasApiData ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {apiInvoices.map((inv: InvoiceRecord) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.customer_name || "Customer"}</TableCell>
                <TableCell className="font-mono text-xs">{inv.invoice_number || "—"}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatMoney(inv.grand_total, inv.currency)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums font-semibold">{formatMoney(inv.amount_outstanding, inv.currency)}</TableCell>
                <TableCell className="text-xs">{inv.due_date}</TableCell>
                <TableCell>
                  <span className="inline-flex gap-1">
                    <Badge variant={inv.document_state === "DRAFT" ? "neutral" : inv.payment_state === "PAID" ? "success" : "info"}>
                      {inv.document_state}
                    </Badge>
                    {inv.document_state === "ISSUED" && (
                      <Badge variant={inv.payment_state === "PAID" ? "success" : "warning"}>
                        {inv.payment_state}
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/${orgId}/invoices/${inv.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : fallbackInvoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Your business starts here. Create your first invoice and start tracking what you're owed."
          action={{ label: "Create first invoice", href: `/${orgId}/invoices/new` }}
        />
      ) : (
        /* Operational Fallback View */
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {fallbackInvoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.customer}</TableCell>
                <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatMoney(inv.amount, "NGN")}</TableCell>
                <TableCell className="text-right font-mono tabular-nums font-semibold">{formatMoney(inv.outstanding, "NGN")}</TableCell>
                <TableCell className="text-xs">{inv.due}</TableCell>
                <TableCell>
                  <span className="inline-flex gap-1">
                    <Badge variant={inv.doc === "DRAFT" ? "neutral" : inv.pay === "PAID" ? "success" : "info"}>{inv.doc}</Badge>
                    {inv.doc !== "DRAFT" && (
                      <Badge variant={inv.pay === "PAID" ? "success" : inv.col === "OVERDUE" ? "critical" : "warning"}>
                        {inv.pay}
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/${orgId}/invoices/${inv.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
