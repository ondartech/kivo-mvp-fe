"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentRuns } from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentRunStatusVariant,
} from "@/features/payments/payment-runs";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

const selectClassName =
  "rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function PaymentRunsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const [status, setStatus] = useState("");
  const [archiveState, setArchiveState] = useState<
    "active" | "archived" | "all"
  >("active");

  const runs = usePaymentRuns(orgId, {
    status: status || null,
    archiveState,
    limit: 50,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Payment Runs."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money out"
        title="Payment Runs"
        description="A Payment Run is the controlled batch that turns payable obligations into approved, executable payment instructions."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/payments">Operations</Link>
            </Button>
            <Button asChild>
              <Link href="/app/payments/runs/new">New Payment Run</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor="payment-run-status"
              className="text-xs font-medium text-muted-foreground"
            >
              Lifecycle status
            </label>
            <select
              id="payment-run-status"
              className={selectClassName + " mt-1 min-w-52"}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {[
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "READY",
                "EXECUTING",
                "PARTIALLY_SETTLED",
                "SETTLED",
                "REJECTED",
                "CANCELLED",
                "FAILED",
                "COMPLETED_WITH_EXCEPTIONS",
              ].map((value) => (
                <option key={value} value={value}>
                  {humanizePaymentValue(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="payment-run-archive"
              className="text-xs font-medium text-muted-foreground"
            >
              Archive
            </label>
            <select
              id="payment-run-archive"
              className={selectClassName + " mt-1 min-w-40"}
              value={archiveState}
              onChange={(event) =>
                setArchiveState(
                  event.target.value as "active" | "archived" | "all",
                )
              }
            >
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
              <option value="all">All</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {runs.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : runs.isError ? (
        <ErrorState
          title="Payment Runs unavailable"
          description={
            runs.error instanceof Error
              ? runs.error.message
              : "The Payment Run list could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void runs.refetch() }}
        />
      ) : (runs.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No Payment Runs in this view"
          description={
            archiveState === "active"
              ? "Create a Payment Run when you are ready to group available obligations for controlled payment."
              : "No Payment Runs match the selected lifecycle and archive filters."
          }
          action={
            archiveState === "active"
              ? { label: "Create Payment Run", href: "/app/payments/runs/new" }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Execution date</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Archive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data?.data.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link
                      href={`/app/payments/runs/${run.id}`}
                      className="font-medium hover:underline"
                    >
                      {run.run_number}
                    </Link>
                    {run.name ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {run.name}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {run.scheduled_execution_date ?? "Not scheduled"}
                  </TableCell>
                  <TableCell>{run.item_count}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(run.total_amount, run.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentRunStatusVariant(run.status)}>
                      {humanizePaymentValue(run.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {run.archived_at ? (
                      <Badge variant="neutral">Archived</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Active history
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Payment Runs are never deleted after they become financially or
          operationally meaningful. Terminal runs may be archived for operational
          hygiene while remaining available as historical evidence.
        </CardContent>
      </Card>
    </div>
  );
}
