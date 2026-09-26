"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { PaymentOperationsNav } from "@/components/kivo/payment-operations-nav";
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
import { usePaymentRuns } from "@/features/payment-operations/api";
import type { PaymentRunStatus } from "@/features/payment-operations/types";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function variant(status: PaymentRunStatus) {
  if (status === "SETTLED") return "success" as const;
  if (status === "FAILED" || status === "REJECTED" || status === "CANCELLED") {
    return "critical" as const;
  }
  if (status === "PENDING_APPROVAL" || status === "PARTIALLY_SETTLED") {
    return "warning" as const;
  }
  if (status === "EXECUTING") return "processing" as const;
  if (status === "APPROVED" || status === "READY") return "info" as const;
  return "neutral" as const;
}

export default function PaymentRunsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const [status, setStatus] = useState<PaymentRunStatus | null>(null);
  const runs = usePaymentRuns(orgId, {
    status: status ?? undefined,
    currency: "NGN",
    limit: 100,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Payment Runs."
      />
    );
  }

  const rows = runs.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        title="Payment runs"
        description="Batches of obligations prepared for governed approval and execution. Drafting, approval, execution and settlement remain separate states."
        actions={
          <Button asChild>
            <Link href="/app/payments/runs/new">Create payment run</Link>
          </Button>
        }
      />
      <PaymentOperationsNav />

      <div className="flex flex-wrap gap-2">
        {(
          [
            [null, "All"],
            ["DRAFT", "Draft"],
            ["PENDING_APPROVAL", "Awaiting approval"],
            ["APPROVED", "Approved"],
            ["EXECUTING", "Executing"],
            ["PARTIALLY_SETTLED", "Partially settled"],
            ["SETTLED", "Settled"],
            ["FAILED", "Failed"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={label}
            size="sm"
            variant={status === value ? "primary" : "outline"}
            onClick={() => setStatus(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {runs.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : runs.isError ? (
        <ErrorState
          title="Payment Runs unavailable"
          description={
            runs.error instanceof Error ? runs.error.message : "The request failed."
          }
          retry={{ label: "Retry", onClick: () => void runs.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Payment Runs in this view"
          description="Create a run from eligible obligations or choose another status."
          action={{ label: "Create payment run", href: "/app/payments/runs/new" }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Execution date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Branches</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link
                      href={`/app/payments/runs/${run.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {run.name || run.run_number}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {run.run_number} · v{run.version}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant(run.status)}>
                      {run.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {run.scheduled_execution_date ?? "Not scheduled"}
                  </TableCell>
                  <TableCell className="tabular-nums">{run.item_count}</TableCell>
                  <TableCell className="tabular-nums">
                    {run.branch_ids.length || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount
                      amount={run.total_amount}
                      currency={run.currency}
                      emphasis="table"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/app/payments/runs/${run.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
