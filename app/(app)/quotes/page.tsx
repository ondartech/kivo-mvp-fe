"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
import { useCustomers } from "@/features/customers/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useProjects } from "@/features/projects/api";
import {
  type QuoteStatus,
  useQuotes,
} from "@/features/quotes/api";
import { resolveQuoteReadScope } from "@/features/quotes/branching";
import { quoteStatusVariant } from "@/features/quotes/quotes";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type StatusFilter = QuoteStatus | null;

function shortId(value: string) {
  return value.slice(0, 8);
}

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function QuotesPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const [status, setStatus] = useState<StatusFilter>(null);

  const branchAccess = useOperatingBranches(orgId);
  const scope = resolveQuoteReadScope(branchAccess.data, activeBranchId);
  const quotes = useQuotes(orgId, {
    branchId: scope.branchId,
    status,
    limit: 50,
    enabled: scope.ready,
  });
  const customers = useCustomers(orgId, {
    status: "ACTIVE",
    limit: 100,
    sort: "normalized_name:asc",
  });
  const projects = useProjects(orgId, {
    branchId: scope.branchId,
    limit: 100,
    enabled: scope.ready,
  });

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );
  const customerById = useMemo(
    () =>
      new Map(
        (customers.data?.data ?? []).map((customer) => [customer.id, customer]),
      ),
    [customers.data?.data],
  );
  const projectById = useMemo(
    () =>
      new Map(
        (projects.data?.data ?? []).map((project) => [project.id, project]),
      ),
    [projects.data?.data],
  );

  const selectedBranch = scope.branchId
    ? branchById.get(scope.branchId)
    : null;
  const scopeLabel = selectedBranch
    ? `${selectedBranch.code} · ${selectedBranch.name}`
    : branchAccess.data?.organization_wide === false
      ? "Select branch"
      : "All branches";

  const rows = quotes.data?.data ?? [];

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Quotes."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Quotes"
        description={
          scope.branchId
            ? "Commercial proposals attributed to the selected operating Branch."
            : branchAccess.data?.organization_wide === false
              ? "Choose an authorized Branch to load Quotes."
              : "Organization-wide Quote view across authorized Branches."
        }
        actions={
          <Button asChild>
            <Link href="/app/quotes/new">Create quote</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            [null, "All"],
            ["DRAFT", "Draft"],
            ["SENT", "Sent"],
            ["ACCEPTED", "Accepted"],
            ["REJECTED", "Rejected"],
            ["EXPIRED", "Expired"],
            ["CANCELLED", "Cancelled"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={label}
            size="sm"
            variant={status === value ? "primary" : "secondary"}
            onClick={() => setStatus(value)}
          >
            {label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {scopeLabel}
        </span>
      </div>

      {branchAccess.isError ? (
        <ErrorState
          title="Could not resolve Branch access"
          description={
            branchAccess.error instanceof Error
              ? branchAccess.error.message
              : "The operating Branch request failed."
          }
          retry={{ label: "Retry", onClick: () => void branchAccess.refetch() }}
        />
      ) : branchAccess.data?.organization_wide === false &&
        branchAccess.data.branches.length === 0 ? (
        <EmptyState
          title="No operating Branch access"
          description="Your membership currently has no active Branch available for Quotes."
        />
      ) : scope.selectionRequired ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Choose an operating Branch</div>
            <p className="mt-1 text-muted-foreground">
              Your access is Branch-scoped. Select one of your authorized Branches
              from the app context before loading Quotes.
            </p>
          </CardContent>
        </Card>
      ) : branchAccess.isLoading || (scope.ready && quotes.isLoading) ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : quotes.isError ? (
        <ErrorState
          title="Could not load Quotes"
          description={
            quotes.error instanceof Error
              ? quotes.error.message
              : "The Quote request failed."
          }
          retry={{ label: "Retry", onClick: () => void quotes.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={status ? "No Quotes match this state" : "No Quotes yet"}
          description={
            status
              ? "Try another Quote state or operating Branch."
              : "Create a commercial proposal without creating a Receivable."
          }
          action={
            status
              ? { label: "Show all Quotes", onClick: () => setStatus(null) }
              : { label: "Create quote", href: "/app/quotes/new" }
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((quote) => {
                  const branch = branchById.get(quote.branch_id);
                  const customer = customerById.get(quote.customer_id);
                  const project = quote.project_id
                    ? projectById.get(quote.project_id)
                    : null;
                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/app/quotes/${quote.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {quote.quote_number}
                        </Link>
                        {quote.quote_version > 1 ? (
                          <div className="text-xs text-muted-foreground">
                            Version {quote.quote_version}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {customer?.name ?? shortId(quote.customer_id)}
                      </TableCell>
                      <TableCell>
                        {project?.name ??
                          (quote.project_id ? shortId(quote.project_id) : "—")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          {branch?.code ?? shortId(quote.branch_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={quoteStatusVariant(quote.status)}>
                          {humanize(quote.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{quote.valid_until ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(quote.grand_total, quote.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/app/quotes/${quote.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((quote) => {
              const branch = branchById.get(quote.branch_id);
              const customer = customerById.get(quote.customer_id);
              return (
                <Link
                  key={quote.id}
                  href={`/app/quotes/${quote.id}`}
                  className="block rounded-lg border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{quote.quote_number}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {customer?.name ?? shortId(quote.customer_id)}
                        {" · "}
                        {branch?.code ?? shortId(quote.branch_id)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {formatMoney(quote.grand_total, quote.currency)}
                      </div>
                      <Badge variant={quoteStatusVariant(quote.status)}>
                        {humanize(quote.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {quote.valid_until ? `Valid until ${quote.valid_until}` : "No expiry"}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Quotes are commercial proposals, not Receivables. Accepted value becomes a
          financial claim only after an Invoice is created and issued.
        </CardContent>
      </Card>
    </div>
  );
}
