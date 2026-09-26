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
import {
  usePaymentExecutionQueue,
  usePaymentOperationsSummary,
  usePaymentReconciliationQueue,
  usePaymentRuns,
} from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentInstructionStatusVariant,
  paymentRunStatusVariant,
} from "@/features/payments/payment-runs";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function MetricCard({
  label,
  count,
  amount,
  currency,
  emphasis = false,
}: {
  label: string;
  count: number;
  amount: string | null;
  currency: string | null;
  emphasis?: boolean;
}) {
  return (
    <Card className={emphasis ? "border-warning/30" : undefined}>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">
          {amount && currency ? formatMoney(amount, currency) : count}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {amount && currency ? `${count} item${count === 1 ? "" : "s"}` : "items"}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const summary = usePaymentOperationsSummary(orgId, {
    currency: "NGN",
    branchId,
  });
  const runs = usePaymentRuns(orgId, { archiveState: "active", limit: 8 });
  const executions = usePaymentExecutionQueue(orgId, {
    currency: "NGN",
    branchId,
    limit: 8,
  });
  const reconciliation = usePaymentReconciliationQueue(orgId, {
    currency: "NGN",
    branchId,
    attentionOnly: true,
    limit: 8,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Payment Operations."
      />
    );
  }

  if (summary.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (summary.isError) {
    return (
      <ErrorState
        title="Payment Operations unavailable"
        description={
          summary.error instanceof Error
            ? summary.error.message
            : "The operational summary could not be loaded."
        }
        retry={{ label: "Retry", onClick: () => void summary.refetch() }}
      />
    );
  }

  const data = summary.data;
  if (!data) {
    return (
      <EmptyState
        title="Payment Operations unavailable"
        description="No server-authoritative payment summary was returned."
      />
    );
  }

  const recentRuns = runs.data?.data ?? [];
  const executionRows = executions.data?.data ?? [];
  const attentionRows = reconciliation.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={branchId ? "Active branch" : "Organization-wide"}
        title="Payment Operations"
        description="Control what is owed, group obligations into Payment Runs, release approved money movement, and reconcile outcomes without losing the source obligation."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/settings/payments">Configure</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/payments/obligations">Obligations</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/payments/runs">Payment Runs</Link>
            </Button>
            <Button asChild>
              <Link href="/app/payments/runs/new">New Payment Run</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open obligations"
          count={data.open_obligations.count}
          amount={data.open_obligations.amount}
          currency={data.open_obligations.currency}
        />
        <MetricCard
          label="Due this week"
          count={data.due_this_week.count}
          amount={data.due_this_week.amount}
          currency={data.due_this_week.currency}
        />
        <MetricCard
          label="Awaiting approval"
          count={data.awaiting_approval.count}
          amount={data.awaiting_approval.amount}
          currency={data.awaiting_approval.currency}
        />
        <MetricCard
          label="In flight"
          count={data.in_flight.count}
          amount={data.in_flight.amount}
          currency={data.in_flight.currency}
        />
        <MetricCard
          label="Held"
          count={data.held_obligations.count}
          amount={data.held_obligations.amount}
          currency={data.held_obligations.currency}
          emphasis={data.held_obligations.count > 0}
        />
        <MetricCard
          label="Unknown outcome"
          count={data.outcome_unknown.count}
          amount={data.outcome_unknown.amount}
          currency={data.outcome_unknown.currency}
          emphasis={data.outcome_unknown.count > 0}
        />
        <MetricCard
          label="Failed instructions"
          count={data.failed_instructions.count}
          amount={data.failed_instructions.amount}
          currency={data.failed_instructions.currency}
          emphasis={data.failed_instructions.count > 0}
        />
        <MetricCard
          label="Unreconciled"
          count={data.unreconciled.count}
          amount={data.unreconciled.amount}
          currency={data.unreconciled.currency}
          emphasis={data.unreconciled.count > 0}
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-sm font-semibold">Clearing position</div>
              {data.clearing.available && data.clearing.balance && data.clearing.currency ? (
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatMoney(data.clearing.balance, data.clearing.currency)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {humanizePaymentValue(data.clearing.side ?? "ZERO")}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-muted-foreground">
                  Clearing balance is not available
                  {data.clearing.reason_code
                    ? ` · ${humanizePaymentValue(data.clearing.reason_code)}`
                    : ""}.
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/app/payments/executions">Execution queue</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app/payments/reconciliation">
                  Reconciliation
                  {attentionRows.length ? ` · ${attentionRows.length}` : ""}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold">Recent Payment Runs</div>
                <div className="text-xs text-muted-foreground">
                  Commercial obligations grouped for controlled payment.
                </div>
              </div>
              <Link
                href="/app/payments/runs"
                className="text-xs font-medium text-brand hover:underline"
              >
                View all
              </Link>
            </div>
            {runs.isError ? (
              <div className="p-5 text-sm text-muted-foreground">
                Payment Runs are temporarily unavailable.
              </div>
            ) : recentRuns.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No active Payment Runs yet.
              </div>
            ) : (
              <div className="divide-y">
                {recentRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/app/payments/runs/${run.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {run.run_number}
                        {run.name ? ` · ${run.name}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {run.item_count} line{run.item_count === 1 ? "" : "s"} ·{" "}
                        {run.scheduled_execution_date ?? "No execution date"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium tabular-nums">
                        {formatMoney(run.total_amount, run.currency)}
                      </div>
                      <Badge variant={paymentRunStatusVariant(run.status)}>
                        {humanizePaymentValue(run.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold">Execution activity</div>
                <div className="text-xs text-muted-foreground">
                  Prepared and released batches remain distinct from settlement.
                </div>
              </div>
              <Link
                href="/app/payments/executions"
                className="text-xs font-medium text-brand hover:underline"
              >
                Open queue
              </Link>
            </div>
            {executionRows.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No Payment Executions have been prepared.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionRows.map((row) => (
                      <TableRow key={row.execution_id}>
                        <TableCell>
                          <Link
                            href={`/app/payments/runs/${row.payment_run_id}`}
                            className="font-medium hover:underline"
                          >
                            {row.run_number}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {humanizePaymentValue(row.method)} ·{" "}
                            {row.instruction_count} instructions
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
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(row.total_amount, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {attentionRows.length ? (
        <Card className="border-warning/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-semibold">
                  Reconciliation attention
                </div>
                <div className="text-xs text-muted-foreground">
                  These instruction outcomes need evidence or Finance recovery.
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/payments/reconciliation">Resolve</Link>
              </Button>
            </div>
            <div className="divide-y">
              {attentionRows.slice(0, 5).map((row) => (
                <Link
                  key={row.payment_instruction_id}
                  href={`/app/payments/runs/${row.payment_run_id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <div className="text-sm font-medium">{row.run_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {humanizePaymentValue(row.attention_state)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium tabular-nums">
                      {formatMoney(row.amount, row.currency)}
                    </div>
                    <Badge
                      variant={paymentInstructionStatusVariant(
                        row.instruction_status,
                      )}
                    >
                      {humanizePaymentValue(row.instruction_status)}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="text-xs text-muted-foreground">
        As of {new Date(data.as_of).toLocaleString()}. Payment Operations shows
        authoritative backend state; a dispatched or accepted instruction is not
        presented as settled until reconciliation confirms the outcome.
      </div>
    </div>
  );
}
