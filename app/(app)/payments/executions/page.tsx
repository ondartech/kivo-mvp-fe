"use client";

import Link from "next/link";

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
import { usePaymentExecutionQueue } from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentInstructionStatusVariant,
} from "@/features/payments/payment-runs";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

export default function PaymentExecutionsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const executions = usePaymentExecutionQueue(orgId, {
    currency: "NGN",
    branchId,
    limit: 100,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening the execution queue."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment Operations"
        title="Execution queue"
        description="Prepared and released batches. This surface distinguishes instruction dispatch and acceptance from authoritative settlement."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/payments">Operations</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/payments/reconciliation">Reconciliation</Link>
            </Button>
          </>
        }
      />

      {executions.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : executions.isError ? (
        <ErrorState
          title="Execution queue unavailable"
          description={
            executions.error instanceof Error
              ? executions.error.message
              : "Payment Executions could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void executions.refetch() }}
        />
      ) : (executions.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No Payment Executions"
          description="An approved Payment Run appears here after its execution is prepared."
          action={{ label: "Open Payment Runs", href: "/app/payments/runs" }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Instructions</TableHead>
                <TableHead>Control state</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.data?.data.map((row) => (
                <TableRow key={row.execution_id}>
                  <TableCell>
                    <Link
                      href={`/app/payments/runs/${row.payment_run_id}`}
                      className="font-medium hover:underline"
                    >
                      {row.run_number}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Run {humanizePaymentValue(row.run_status)}
                    </div>
                  </TableCell>
                  <TableCell>{humanizePaymentValue(row.method)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{row.instruction_count} total</div>
                    <div className="text-xs text-muted-foreground">
                      {row.settled_count} settled · {row.in_flight_count} in flight
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={paymentInstructionStatusVariant(
                        row.execution_status,
                      )}
                    >
                      {humanizePaymentValue(row.execution_status)}
                    </Badge>
                    {row.outcome_unknown_count || row.failed_count ? (
                      <div className="mt-1 text-xs text-warning">
                        {row.outcome_unknown_count
                          ? `${row.outcome_unknown_count} unknown`
                          : ""}
                        {row.outcome_unknown_count && row.failed_count ? " · " : ""}
                        {row.failed_count ? `${row.failed_count} failed` : ""}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(row.total_amount, row.currency)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.updated_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          CSV and bank-file export are dispatch mechanisms, not settlement evidence.
          A released file can remain dispatched without an acceptance signal; the
          reconciliation queue is where authoritative outcome evidence is recorded.
        </CardContent>
      </Card>
    </div>
  );
}
