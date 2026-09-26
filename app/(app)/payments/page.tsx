"use client";

import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { PaymentOperationsNav } from "@/components/kivo/payment-operations-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePaymentOperationsSummary,
  usePaymentSafetyControls,
  useTenantEmergencyPosture,
} from "@/features/payment-operations/api";
import { resolvePaymentReadScope } from "@/features/payment-operations/branching";
import type { PaymentOperationsMetric } from "@/features/payment-operations/types";
import { useOperatingBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function MetricCard({
  label,
  metric,
  href,
  loading,
  tone = "neutral",
}: {
  label: string;
  metric?: PaymentOperationsMetric;
  href: string;
  loading: boolean;
  tone?: "neutral" | "warning" | "critical";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          {tone !== "neutral" && (metric?.count ?? 0) > 0 ? (
            <Badge variant={tone}>{metric?.count}</Badge>
          ) : null}
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-28" />
        ) : metric?.amount != null && metric.currency ? (
          <>
            <MoneyAmount
              amount={metric.amount}
              currency={metric.currency}
              emphasis="primary"
              className="mt-2 block"
            />
            <div className="mt-1 text-xs text-muted-foreground">
              {metric.count} {metric.count === 1 ? "record" : "records"}
            </div>
          </>
        ) : (
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {metric?.count ?? 0}
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-3 -ml-3" asChild>
          <Link href={href}>Open view</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId, {
    permissionCode: "payment_runs:read",
  });
  const scope = resolvePaymentReadScope(branchAccess.data, activeBranchId);
  const summary = usePaymentOperationsSummary(orgId, {
    currency: "NGN",
    branchId: scope.branchId,
  });
  const emergency = useTenantEmergencyPosture(orgId);
  const safety = usePaymentSafetyControls(orgId);

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Payment Operations."
      />
    );
  }

  if (scope.selectionRequired) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Payments"
          title="Payment Operations"
          description="Choose an authorized operating Branch to load payment authority and operational state."
        />
        <PaymentOperationsNav />
        <EmptyState
          title="Choose an operating Branch"
          description="Your Payment access is Branch-scoped. Select one from the app context before continuing."
        />
      </div>
    );
  }

  const activeSafetyControls = (safety.data?.data ?? []).filter(
    (control) =>
      control.mode !== "ENABLED" &&
      (!control.branch_id || control.branch_id === scope.branchId),
  );
  const emergencyActive = (emergency.data?.active_controls.length ?? 0) > 0;
  const safetyBlocked = emergencyActive || activeSafetyControls.length > 0;
  const branch = branchAccess.data?.branches.find(
    (item) => item.id === scope.branchId,
  );
  const scopeLabel = branch
    ? `${branch.code} · ${branch.name}`
    : "Organization-wide";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Payment Operations"
        description="Prepare, govern, execute and reconcile outbound payments without collapsing approval, bank execution, settlement or accounting into one status."
        actions={
          <Button asChild>
            <Link href="/app/payments/runs/new">Create payment run</Link>
          </Button>
        }
      />

      <PaymentOperationsNav />

      {safetyBlocked ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">Payment control state is active</div>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  This is a safety/control-plane state, not a failed payment. Existing
                  obligations, approvals and settlement evidence remain visible while
                  restricted actions stay blocked by backend authority.
                </p>
              </div>
              <Badge variant="warning">Control active</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(emergency.data?.active_controls ?? []).map((control) => (
                <Badge key={control} variant="critical">
                  {control.replaceAll("_", " ")}
                </Badge>
              ))}
              {activeSafetyControls.map((control) => (
                <Badge key={control.id} variant="warning">
                  {control.capability}: {control.mode.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {summary.isError ? (
        <ErrorState
          title="Payment Operations summary unavailable"
          description={
            summary.error instanceof Error
              ? summary.error.message
              : "The Payment Operations read model could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void summary.refetch() }}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Open obligations"
              metric={summary.data?.open_obligations}
              href="/app/payments/obligations"
              loading={summary.isLoading}
            />
            <MetricCard
              label="Due in 7 days"
              metric={summary.data?.due_this_week}
              href="/app/payments/obligations?view=due"
              loading={summary.isLoading}
              tone="warning"
            />
            <MetricCard
              label="Awaiting approval"
              metric={summary.data?.awaiting_approval}
              href="/app/payments/approvals"
              loading={summary.isLoading}
              tone="warning"
            />
            <MetricCard
              label="Approved to execute"
              metric={summary.data?.approved_awaiting_execution}
              href="/app/payments/runs?status=APPROVED"
              loading={summary.isLoading}
            />
            <MetricCard
              label="In flight"
              metric={summary.data?.in_flight}
              href="/app/payments/executions"
              loading={summary.isLoading}
            />
            <MetricCard
              label="Outcome unknown"
              metric={summary.data?.outcome_unknown}
              href="/app/payments/reconciliation?attention=1"
              loading={summary.isLoading}
              tone="critical"
            />
            <MetricCard
              label="Failed instructions"
              metric={summary.data?.failed_instructions}
              href="/app/payments/reconciliation"
              loading={summary.isLoading}
              tone="critical"
            />
            <MetricCard
              label="Unreconciled"
              metric={summary.data?.unreconciled}
              href="/app/payments/reconciliation?attention=1"
              loading={summary.isLoading}
              tone="warning"
            />
            <MetricCard
              label="Upcoming runs"
              metric={summary.data?.upcoming_runs}
              href="/app/payments/templates"
              loading={summary.isLoading}
            />
            <MetricCard
              label="Held obligations"
              metric={summary.data?.held_obligations}
              href="/app/payments/obligations?control=HELD"
              loading={summary.isLoading}
              tone="warning"
            />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Disbursement clearing
                  </div>
                  {summary.isLoading ? (
                    <Skeleton className="mt-3 h-9 w-40" />
                  ) : summary.data?.clearing.available &&
                    summary.data.clearing.balance &&
                    summary.data.clearing.currency ? (
                    <>
                      <MoneyAmount
                        amount={summary.data.clearing.balance}
                        currency={summary.data.clearing.currency}
                        emphasis="display"
                        className="mt-2 block"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {summary.data.clearing.side} balance · Finance
                        DISBURSEMENT_CLEARING control account
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mt-2 text-lg font-semibold">Unavailable</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {summary.data?.clearing.reason_code?.replaceAll("_", " ") ??
                          "Finance clearing authority is not available."}
                      </p>
                    </>
                  )}
                </div>
                <div className="max-w-sm text-sm text-muted-foreground">
                  Clearing is read from the posted General Ledger control account.
                  Payment instruction states are not used to manufacture a balance.
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
