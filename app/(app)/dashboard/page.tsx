"use client";

import { useMemo } from "react";
import Link from "next/link";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizationDashboard } from "@/features/dashboard/api";
import { resolveDashboardReadScope } from "@/features/dashboard/branching";
import { useOperatingBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function statusVariant(status: string) {
  if (status === "APPROVED" || status === "COMPLETED") return "success" as const;
  if (status === "REJECTED" || status === "FAILED" || status === "CANCELLED") {
    return "critical" as const;
  }
  if (status === "ACTIVE" || status === "ACCEPTED" || status === "IN_FLIGHT") {
    return "info" as const;
  }
  return "neutral" as const;
}

export default function DashboardPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId);
  const scope = resolveDashboardReadScope(branchAccess.data, activeBranchId);

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );

  const dashboard = useOrganizationDashboard(orgId, {
    branchId: scope.branchId,
    currency: "NGN",
    enabled: scope.ready,
  });

  const effectiveBranchId = dashboard.data?.branch_id ?? scope.branchId;
  const effectiveBranch = effectiveBranchId
    ? branchById.get(effectiveBranchId)
    : null;
  const scopeLabel = effectiveBranch
    ? `${effectiveBranch.code} · ${effectiveBranch.name}`
    : branchAccess.data?.organization_wide === false
      ? "Select branch"
      : "All branches";

  const quoteCounts = Object.entries(
    dashboard.data?.commercial.quotes.counts_by_status ?? {},
  ).filter(([, count]) => count > 0);
  const projectCounts = Object.entries(
    dashboard.data?.commercial.projects.counts_by_status ?? {},
  ).filter(([, count]) => count > 0);
  const nrsCounts = Object.entries(dashboard.data?.nrs.counts ?? {}).filter(
    ([, count]) => count > 0,
  );
  const nrsEnablement =
    dashboard.data?.nrs.nrs?.enablement_status ?? "UNKNOWN";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Dashboard"
        description={
          effectiveBranchId
            ? "Cash, receivables, commercial pipeline and compliance for the selected operating Branch."
            : branchAccess.data?.organization_wide === false
              ? "Choose an authorized Branch to load the business command center."
              : "Organization-wide cash, receivables, commercial pipeline and compliance."
        }
        actions={
          <div className="flex gap-2">
            <Link href="/app/invoices/new">
              <Button variant="secondary" size="sm">
                Create invoice
              </Button>
            </Link>
            <Link href="/app/customers/new">
              <Button size="sm">Add customer</Button>
            </Link>
          </div>
        }
      />

      {branchAccess.isError ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Could not resolve Branch access</div>
            <p className="mt-1 text-muted-foreground">
              {branchAccess.error instanceof Error
                ? branchAccess.error.message
                : "The operating Branch request failed."}
            </p>
          </CardContent>
        </Card>
      ) : branchAccess.data?.organization_wide === false &&
        branchAccess.data.branches.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">No operating Branch access</div>
            <p className="mt-1 text-muted-foreground">
              Your membership currently has no active Branch available for this
              dashboard.
            </p>
          </CardContent>
        </Card>
      ) : scope.selectionRequired ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Choose an operating Branch</div>
            <p className="mt-1 text-muted-foreground">
              Your access is Branch-scoped. Select one of your authorized Branches
              from the app context before loading the Dashboard.
            </p>
          </CardContent>
        </Card>
      ) : branchAccess.isLoading || (scope.ready && dashboard.isLoading) ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Loading dashboard…
          </CardContent>
        </Card>
      ) : dashboard.isError ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Could not load Dashboard</div>
            <p className="mt-1 text-muted-foreground">
              {dashboard.error instanceof Error
                ? dashboard.error.message
                : "The Dashboard request failed."}
            </p>
          </CardContent>
        </Card>
      ) : dashboard.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Collected
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={dashboard.data.cash.collected_total}
                    currency={dashboard.data.cash.currency}
                    emphasis="primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Confirmed allocated cash
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Outstanding
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={dashboard.data.receivables.summary.outstanding}
                    currency={dashboard.data.receivables.summary.currency}
                    emphasis="primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {dashboard.data.receivables.summary.outstanding_count} open
                  receivables
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Overdue
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={dashboard.data.receivables.summary.overdue}
                    currency={dashboard.data.receivables.summary.currency}
                    emphasis="primary"
                    className="text-critical"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {dashboard.data.receivables.summary.overdue_count} overdue
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Unbilled
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={dashboard.data.commercial.unbilled.total}
                    currency={dashboard.data.cash.currency}
                    emphasis="primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Accepted quotes + ready milestones
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold">Receivables aging</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        As of {dashboard.data.receivables.aging.as_of} · {scopeLabel}
                      </p>
                    </div>
                    <Link href="/app/receivables">
                      <Button variant="secondary" size="sm">
                        Open receivables
                      </Button>
                    </Link>
                  </div>

                  {dashboard.data.receivables.aging.buckets.length ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {dashboard.data.receivables.aging.buckets.map((bucket) => (
                        <div
                          key={bucket.label}
                          className="rounded-lg border bg-surface p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">
                                {bucket.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {bucket.days} · {bucket.count} item
                                {bucket.count === 1 ? "" : "s"}
                              </div>
                            </div>
                            <MoneyAmount
                              amount={bucket.outstanding}
                              currency={dashboard.data.receivables.aging.currency}
                              emphasis="table"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg border p-5 text-sm text-muted-foreground">
                      No outstanding receivables in this scope.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold">Commercial position</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pipeline and committed work; not accounting recognition.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Contract value
                      </div>
                      <div className="mt-2">
                        <MoneyAmount
                          amount={
                            dashboard.data.commercial.projects.contract_value_total
                          }
                          currency={dashboard.data.cash.currency}
                          emphasis="table"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Accepted unconverted
                      </div>
                      <div className="mt-2">
                        <MoneyAmount
                          amount={
                            dashboard.data.commercial.quotes.accepted_unconverted
                              .total
                          }
                          currency={dashboard.data.cash.currency}
                          emphasis="table"
                        />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {
                          dashboard.data.commercial.quotes.accepted_unconverted
                            .count
                        }{" "}
                        quote
                        {dashboard.data.commercial.quotes.accepted_unconverted
                          .count === 1
                          ? ""
                          : "s"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Ready milestones
                      </div>
                      <div className="mt-2">
                        <MoneyAmount
                          amount={
                            dashboard.data.commercial.unbilled.ready_milestones
                              .total
                          }
                          currency={dashboard.data.cash.currency}
                          emphasis="table"
                        />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {
                          dashboard.data.commercial.unbilled.ready_milestones
                            .count
                        }{" "}
                        ready
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        Quotes
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quoteCounts.length ? (
                          quoteCounts.map(([status, count]) => (
                            <Badge key={status} variant={statusVariant(status)}>
                              {status} · {count}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No quotes yet
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">
                        Projects
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {projectCounts.length ? (
                          projectCounts.map(([status, count]) => (
                            <Badge key={status} variant={statusVariant(status)}>
                              {status} · {count}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No commercial projects yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">NRS posture</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {scopeLabel}
                      </div>
                    </div>
                    <Badge variant={statusVariant(nrsEnablement)}>
                      {nrsEnablement}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {nrsCounts.length ? (
                      nrsCounts.map(([status, count]) => (
                        <Badge key={status} variant={statusVariant(status)}>
                          {status} · {count}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No fiscalization activity yet.
                      </span>
                    )}
                  </div>

                  {(dashboard.data.nrs.recent_failures?.length ?? 0) > 0 ? (
                    <div className="mt-4 border-t pt-3 text-sm">
                      <div className="font-medium text-critical">
                        {dashboard.data.nrs.recent_failures?.length} recent failure
                        {dashboard.data.nrs.recent_failures?.length === 1
                          ? ""
                          : "s"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Review compliance evidence before retrying.
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-semibold">Receivables position</div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Invoiced</span>
                      <MoneyAmount
                        amount={dashboard.data.receivables.summary.invoiced}
                        currency={dashboard.data.receivables.summary.currency}
                        emphasis="table"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Due soon</span>
                      <MoneyAmount
                        amount={dashboard.data.receivables.summary.due_soon}
                        currency={dashboard.data.receivables.summary.currency}
                        emphasis="table"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Paid invoices</span>
                      <span className="tabular-nums font-medium">
                        {dashboard.data.receivables.summary.paid_count}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
