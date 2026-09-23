"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useAccountActivity,
  useFinanceAccount,
} from "@/features/finance-explorer/api";
import { resolveFinanceReadScope } from "@/features/finance-explorer/branching";
import {
  accountProtectionLabels,
  humanize,
  shortIdentifier,
} from "@/features/finance-explorer/schema";
import { useOperatingBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function balanceText(debit: string, credit: string, currency: string): string {
  if (debit !== "0" && !/^0(?:\.0+)?$/.test(debit)) {
    return `${formatMoney(debit, currency)} DR`;
  }
  if (credit !== "0" && !/^0(?:\.0+)?$/.test(credit)) {
    return `${formatMoney(credit, currency)} CR`;
  }
  return formatMoney("0", currency);
}

export default function FinanceAccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const organizationId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();

  const financeBranches = useOperatingBranches(organizationId, {
    permissionCode: "finance:read",
  });
  const scope = resolveFinanceReadScope(financeBranches.data, activeBranchId);

  const branchById = useMemo(
    () =>
      new Map(
        (financeBranches.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [financeBranches.data?.branches],
  );

  const account = useFinanceAccount(organizationId, accountId);
  const activity = useAccountActivity(organizationId, accountId, {
    branchId: scope.branchId,
    enabled: scope.ready,
  });

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening account activity."
      />
    );
  }

  if (financeBranches.isError) {
    return (
      <ErrorState
        title="Finance Branch access unavailable"
        description={
          financeBranches.error instanceof Error
            ? financeBranches.error.message
            : "The Finance Branch context request failed."
        }
        retry={{
          label: "Retry",
          onClick: () => void financeBranches.refetch(),
        }}
      />
    );
  }

  if (
    financeBranches.data?.organization_wide === false &&
    financeBranches.data.branches.length === 0
  ) {
    return (
      <EmptyState
        title="No Finance Branch access"
        description="Your membership does not currently have finance:read access to an active Branch."
      />
    );
  }

  if (scope.selectionRequired) {
    const available = (financeBranches.data?.branches ?? [])
      .map((branch) => branch.code)
      .join(", ");
    return (
      <Card>
        <CardContent className="p-5 text-sm">
          <div className="font-medium">Choose a Finance Branch</div>
          <p className="mt-1 text-muted-foreground">
            Select an operating Branch where you have Finance read access before
            loading ledger balances.
          </p>
          {available ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Available Finance Branches: {available}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (
    financeBranches.isLoading ||
    account.isLoading ||
    (scope.ready && activity.isLoading)
  ) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (account.isError) {
    return (
      <ErrorState
        title="Account unavailable"
        description={account.error.message}
        retry={{ label: "Retry", onClick: () => void account.refetch() }}
      />
    );
  }

  if (activity.isError) {
    return (
      <ErrorState
        title="Account activity unavailable"
        description={activity.error.message}
        retry={{ label: "Retry", onClick: () => void activity.refetch() }}
      />
    );
  }

  const record = account.data;
  const first = activity.data?.pages[0];
  const lines = activity.data?.pages.flatMap((page) => page.data) ?? [];

  if (!record || !first) {
    return (
      <EmptyState
        title="Account unavailable"
        description="No Finance account data was returned."
      />
    );
  }

  const effectiveBranchId = first.branch_id ?? scope.branchId;
  const effectiveBranch = effectiveBranchId
    ? branchById.get(effectiveBranchId)
    : null;
  const scopeLabel = effectiveBranch
    ? `${effectiveBranch.code} · ${effectiveBranch.name}`
    : financeBranches.data?.organization_wide
      ? "All branches"
      : "Finance Branch";

  const protection = accountProtectionLabels(record);
  const canOpenJournalDetail =
    financeBranches.data?.organization_wide === true;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Finance · Account explorer · ${scopeLabel}`}
        title={`${record.code} · ${record.name}`}
        description={`${humanize(record.account_class)} · ${humanize(record.account_type)} · ${humanize(record.normal_balance)} normal balance`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/finance/accounts">All accounts</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={record.status === "ACTIVE" ? "success" : "neutral"}>
          {humanize(record.status)}
        </Badge>
        <Badge variant="info">{scopeLabel}</Badge>
        {protection.map((label) => (
          <Badge
            key={label}
            variant={label === "System" || label === "Control" ? "warning" : "neutral"}
          >
            {label}
          </Badge>
        ))}
        {record.control_type ? (
          <Badge variant="info">{humanize(record.control_type)}</Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Opening
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {balanceText(
                first.opening_debit,
                first.opening_credit,
                first.base_currency,
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Period activity
            </div>
            <div className="mt-1 text-sm tabular-nums">
              DR {formatMoney(first.activity_debit, first.base_currency)}
            </div>
            <div className="text-sm tabular-nums">
              CR {formatMoney(first.activity_credit, first.base_currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Closing
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              {balanceText(
                first.closing_debit,
                first.closing_credit,
                first.base_currency,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">
        Accounting range:{" "}
        <span className="font-medium text-foreground">{first.from_date}</span> to{" "}
        <span className="font-medium text-foreground">{first.to_date}</span>.{" "}
        Ledger order is accounting date, entry number, line number, then line
        identity. Balances are server-authoritative for {scopeLabel}.
      </div>

      {lines.length === 0 ? (
        <EmptyState
          title="No ledger activity"
          description="This account has no posted General Ledger lines in the selected Finance scope and range."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Accounting date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Running balance</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const lineBranch = line.branch_id
                  ? branchById.get(line.branch_id)
                  : null;
                const lineBranchLabel = lineBranch
                  ? lineBranch.code
                  : line.branch_id
                    ? shortIdentifier(line.branch_id)
                    : "Unassigned";

                return (
                  <TableRow key={line.line_id}>
                    <TableCell className="tabular-nums">
                      {line.accounting_date}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{lineBranchLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      {canOpenJournalDetail ? (
                        <Link
                          href={`/app/finance/journals/${line.journal_entry_id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {line.entry_number}
                        </Link>
                      ) : (
                        <span className="font-medium">{line.entry_number}</span>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge
                          variant={
                            line.entry_type === "SYSTEM" ? "warning" : "neutral"
                          }
                        >
                          {humanize(line.entry_type)}
                        </Badge>
                        {line.journal_status === "REVERSED" ? (
                          <Badge variant="critical">Reversed</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.debit_base, first.base_currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.credit_base, first.base_currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(line.running_balance, first.base_currency)}{" "}
                      {line.running_balance_side === "ZERO"
                        ? ""
                        : line.running_balance_side === "DEBIT"
                          ? "DR"
                          : "CR"}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {humanize(line.source.source_domain)} ·{" "}
                        {humanize(line.source.source_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {humanize(line.source.source_event_type)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {!canOpenJournalDetail ? (
            <p className="text-xs text-muted-foreground">
              Journal detail is organization-scoped because one balanced journal
              may contain lines from multiple Branches. Branch-scoped Finance views
              expose only the authorized ledger lines.
            </p>
          ) : null}

          {activity.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={activity.isFetchingNextPage}
                onClick={() => void activity.fetchNextPage()}
              >
                {activity.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
