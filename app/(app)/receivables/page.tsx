"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useReceivables,
  useReceivablesAging,
  useReceivablesSummary,
} from "@/features/receivables/api";
import { resolveReceivableReadScope } from "@/features/receivables/branching";
import { useFinanceProfile } from "@/features/finance-explorer/api";
import { useOperatingBranches, useOrganization } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

type CollectionState = "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "CURRENT" | null;

export default function ReceivablesPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId);
  const organization = useOrganization(orgId);
  const financeProfile = useFinanceProfile(orgId);
  const [collectionState, setCollectionState] = useState<CollectionState>(null);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    setCurrency("");
  }, [orgId]);

  useEffect(() => {
    if (currency) return;
    const configured =
      financeProfile.data?.default_presentation_currency ??
      organization.data?.default_currency;
    if (configured) setCurrency(configured);
  }, [
    currency,
    financeProfile.data?.default_presentation_currency,
    organization.data?.default_currency,
  ]);

  const currencyValid = /^[A-Z]{3}$/.test(currency);
  const scope = resolveReceivableReadScope(branchAccess.data, activeBranchId);
  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );
  const selectedBranch = scope.branchId ? branchById.get(scope.branchId) : null;
  const scopeLabel = selectedBranch
    ? `${selectedBranch.code} · ${selectedBranch.name}`
    : branchAccess.data?.organization_wide === false
      ? "Select branch"
      : "All branches";

  const receivables = useReceivables(orgId, {
    branchId: scope.branchId,
    collectionState,
    currency,
    limit: 50,
    enabled: scope.ready && currencyValid,
  });
  const summary = useReceivablesSummary(orgId, {
    branchId: scope.branchId,
    currency,
    enabled: scope.ready && currencyValid,
  });
  const aging = useReceivablesAging(orgId, {
    branchId: scope.branchId,
    currency,
    enabled: scope.ready && currencyValid,
  });

  const rows = receivables.data?.data ?? [];
  const readError = receivables.error ?? summary.error ?? aging.error;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Receivables"
        description={
          scope.branchId
            ? "Open customer obligations for the selected operating Branch."
            : branchAccess.data?.organization_wide === false
              ? "Choose an authorized Branch to load receivables."
              : "Organization-wide open customer obligations across authorized Branches."
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            [null, "All open"],
            ["OVERDUE", "Overdue"],
            ["DUE_TODAY", "Due today"],
            ["DUE_SOON", "Due soon"],
            ["CURRENT", "Current"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={label}
            size="sm"
            variant={collectionState === value ? "primary" : "secondary"}
            onClick={() => setCollectionState(value)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{scopeLabel}</span>
          <Input
            aria-label="Receivables currency"
            value={currency}
            maxLength={3}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            className="h-8 w-24 uppercase"
          />
        </div>
      </div>

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
              Your membership currently has no active Branch available for
              Receivables.
            </p>
          </CardContent>
        </Card>
      ) : scope.selectionRequired ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Choose an operating Branch</div>
            <p className="mt-1 text-muted-foreground">
              Your access is Branch-scoped. Select one of your authorized Branches
              from the app context before loading Receivables.
            </p>
          </CardContent>
        </Card>
      ) : branchAccess.isLoading || organization.isLoading || financeProfile.isLoading || (scope.ready && currencyValid && (summary.isLoading || aging.isLoading)) ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Loading receivables…
          </CardContent>
        </Card>
      ) : !currencyValid ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Choose a receivables currency</div>
            <p className="mt-1 text-muted-foreground">
              Summary and aging require one explicit currency; Ondar does not add unlike currencies.
            </p>
          </CardContent>
        </Card>
      ) : readError ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Could not load Receivables</div>
            <p className="mt-1 text-muted-foreground">
              {readError instanceof Error
                ? readError.message
                : "The Receivables request failed."}
            </p>
          </CardContent>
        </Card>
      ) : scope.ready ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Outstanding
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={summary.data?.outstanding ?? "0"}
                    currency={summary.data?.currency ?? currency}
                    emphasis="primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {summary.data?.outstanding_count ?? 0} open receivables
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
                    amount={summary.data?.overdue ?? "0"}
                    currency={summary.data?.currency ?? currency}
                    emphasis="primary"
                    className="text-critical"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {summary.data?.overdue_count ?? 0} overdue
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Due soon
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={summary.data?.due_soon ?? "0"}
                    currency={summary.data?.currency ?? currency}
                    emphasis="primary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Collected
                </div>
                <div className="mt-2">
                  <MoneyAmount
                    amount={summary.data?.collected ?? "0"}
                    currency={summary.data?.currency ?? currency}
                    emphasis="primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {summary.data?.paid_count ?? 0} settled invoices
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Open receivables</h2>
                <span className="text-xs text-muted-foreground">
                  {rows.length} shown
                </span>
              </div>

              {receivables.isLoading ? (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">
                    Loading open receivables…
                  </CardContent>
                </Card>
              ) : rows.length === 0 ? (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">
                    No open receivables match this Branch and collection state.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="divide-y">
                    {rows.map((row) => {
                      const branch = branchById.get(row.branch_id);
                      const collectionVariant =
                        row.collection_state === "OVERDUE"
                          ? "critical"
                          : row.collection_state === "DUE_TODAY"
                            ? "warning"
                            : "neutral";
                      return (
                        <div
                          key={row.invoice_id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/app/invoices/${row.invoice_id}`}
                                className="font-medium hover:underline"
                              >
                                {row.customer_name} · {row.invoice_number}
                              </Link>
                              <Badge variant="neutral">
                                {branch?.code ?? row.branch_id.slice(0, 8)}
                              </Badge>
                              <Badge variant={collectionVariant}>
                                {row.collection_state}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Due {row.due_date}
                              {row.days_overdue > 0
                                ? ` · ${row.days_overdue} days overdue`
                                : ""}
                              {" · "}
                              {row.payment_state}
                            </div>
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <MoneyAmount
                              amount={row.outstanding}
                              currency={row.currency}
                              emphasis="table"
                            />
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground sm:justify-end">
                              <span>of</span>
                              <MoneyAmount
                                amount={row.grand_total}
                                currency={row.currency}
                                emphasis="secondary"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-semibold">Aging</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  As of {aging.data?.as_of ?? "—"} · {scopeLabel}
                </div>
                <div className="mt-4 space-y-3">
                  {(aging.data?.buckets ?? []).map((bucket) => (
                    <div key={bucket.label}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <div className="font-medium">{bucket.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {bucket.days} · {bucket.count} item
                            {bucket.count === 1 ? "" : "s"}
                          </div>
                        </div>
                        <MoneyAmount
                          amount={bucket.outstanding}
                          currency={aging.data?.currency ?? currency}
                          emphasis="table"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total outstanding</span>
                    <MoneyAmount
                      amount={aging.data?.total_outstanding ?? "0"}
                      currency={aging.data?.currency ?? currency}
                      emphasis="table"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
