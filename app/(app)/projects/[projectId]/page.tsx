"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import { useOperatingBranches } from "@/features/organization/api";
import {
  type ProjectStatus,
  useProjectDashboard,
} from "@/features/projects/api";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type ProjectTab = "overview" | "quotes" | "milestones" | "invoices" | "activity";

const tabs: Array<{ id: ProjectTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "quotes", label: "Quotes" },
  { id: "milestones", label: "Milestones" },
  { id: "invoices", label: "Invoices" },
  { id: "activity", label: "Activity" },
];

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function statusVariant(status: ProjectStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "ON_HOLD") return "warning" as const;
  if (status === "CANCELLED") return "critical" as const;
  if (status === "COMPLETED") return "info" as const;
  return "neutral" as const;
}

function documentVariant(state: string) {
  if (state === "VOID") return "critical" as const;
  if (state === "ISSUED") return "info" as const;
  return "neutral" as const;
}

function paymentVariant(state: string) {
  if (state === "PAID") return "success" as const;
  if (state === "PARTIALLY_PAID") return "warning" as const;
  return "neutral" as const;
}

function quoteVariant(status: string) {
  if (status === "ACCEPTED") return "success" as const;
  if (status === "REJECTED" || status === "CANCELLED") return "critical" as const;
  if (status === "SENT") return "info" as const;
  return "neutral" as const;
}

function formatTimestamp(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function Metric({
  label,
  value,
  supporting,
}: {
  label: string;
  value: string;
  supporting?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
        {supporting ? (
          <div className="mt-1 text-xs text-muted-foreground">{supporting}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const orgId = useActiveOrganizationId() ?? "";
  const [tab, setTab] = useState<ProjectTab>("overview");

  const dashboard = useProjectDashboard(orgId, projectId);
  const branchAccess = useOperatingBranches(orgId);

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening a Project."
      />
    );
  }

  if (dashboard.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Project unavailable"
        description={
          dashboard.error instanceof Error
            ? dashboard.error.message
            : "The Project dashboard request failed."
        }
        retry={{ label: "Retry", onClick: () => void dashboard.refetch() }}
      />
    );
  }

  const data = dashboard.data;
  if (!data) {
    return (
      <EmptyState
        title="Project unavailable"
        description="No Project dashboard data was returned."
      />
    );
  }

  const { project, customer, counts, financials } = data.overview;
  const branch = branchById.get(project.branch_id);
  const branchLabel = branch
    ? `${branch.code} · ${branch.name}`
    : shortId(project.branch_id);
  const counterparty =
    project.kind === "INTERNAL" ? "Internal work" : customer?.name ?? "Customer";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${project.project_number} · ${branchLabel}`}
        title={project.name}
        description={
          project.description ||
          (project.kind === "INTERNAL"
            ? "Internal operational Project."
            : `Commercial delivery for ${counterparty}.`)
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/app/projects">All projects</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant(project.status)}>
          {humanize(project.status)}
        </Badge>
        <Badge variant="neutral">{humanize(project.kind)}</Badge>
        <Badge variant="neutral">{branchLabel}</Badge>
        <span className="text-sm text-muted-foreground">{counterparty}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {project.start_date ?? "No start date"} →{" "}
          {project.target_end_date ?? "No target date"}
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b pb-px" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "whitespace-nowrap border-b-2 border-foreground px-3 py-2 text-sm font-medium"
                : "whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Work → Bill → Collect
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric
                label="Quoted"
                value={formatMoney(financials.quoted_total, financials.currency)}
                supporting="Accepted commercial value"
              />
              <Metric
                label="Invoiced"
                value={formatMoney(financials.invoiced_total, financials.currency)}
                supporting={`${counts.invoices} invoice${counts.invoices === 1 ? "" : "s"}`}
              />
              <Metric
                label="Collected"
                value={formatMoney(financials.collected_total, financials.currency)}
                supporting="Confirmed allocations"
              />
              <Metric
                label="Outstanding"
                value={formatMoney(financials.outstanding_total, financials.currency)}
                supporting="Issued less collected"
              />
              <Metric
                label="Overdue"
                value={formatMoney(financials.overdue_total, financials.currency)}
                supporting="Past-due outstanding"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Commercial pipeline
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {counts.quotes}
                </div>
                <div className="text-xs text-muted-foreground">
                  Quotes linked to this Project
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Delivery milestones
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {counts.milestones_completed}/{counts.milestones_total}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {counts.milestones_ready_to_bill ? (
                    <Badge variant="warning">
                      {counts.milestones_ready_to_bill} ready to bill
                    </Badge>
                  ) : null}
                  {counts.milestones_overdue ? (
                    <Badge variant="critical">
                      {counts.milestones_overdue} overdue
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Schedule
                </div>
                <div className="mt-2 text-sm font-medium">
                  {project.start_date ?? "Start date not set"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {project.target_end_date ?? "Not set"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-dashed">
            <CardContent className="p-4 text-xs text-muted-foreground">
              Financial values above come from the single Project dashboard read
              model. Ondar does not compute balances or combine Quote/Invoice/Payment
              values in the browser.
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "quotes" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Metric
              label="Accepted quoted value"
              value={formatMoney(data.quotes.quoted_total, financials.currency)}
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.quotes.counts_by_status).map(([state, count]) => (
                <Badge key={state} variant={quoteVariant(state)}>
                  {humanize(state)} · {count}
                </Badge>
              ))}
            </div>
          </div>

          {data.quotes.recent.length === 0 ? (
            <EmptyState
              title="No Quotes yet"
              description="Quotes linked to this Project will appear here as commercial pipeline evidence."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quotes.recent.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium tabular-nums">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quoteVariant(quote.status)}>
                        {humanize(quote.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{quote.valid_until ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(quote.grand_total, quote.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : null}

      {tab === "milestones" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.milestones.counts_by_completion).map(
              ([state, count]) => (
                <Badge key={`completion-${state}`} variant="neutral">
                  {humanize(state)} · {count}
                </Badge>
              ),
            )}
            {data.overview.counts.milestones_ready_to_bill ? (
              <Badge variant="warning">
                Ready to bill · {data.overview.counts.milestones_ready_to_bill}
              </Badge>
            ) : null}
            {data.milestones.next_due ? (
              <span className="ml-auto text-xs text-muted-foreground">
                Next due: {data.milestones.next_due}
              </span>
            ) : null}
          </div>

          {data.milestones.items.length === 0 ? (
            <EmptyState
              title="No Milestones yet"
              description="Milestones define delivery checkpoints and billing readiness without creating invoices automatically."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.milestones.items.map((milestone) => (
                    <TableRow key={milestone.id}>
                      <TableCell className="tabular-nums">
                        {milestone.sequence}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{milestone.name}</div>
                        {milestone.description ? (
                          <div className="text-xs text-muted-foreground">
                            {milestone.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{milestone.due_date ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            milestone.completion_status === "COMPLETED"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {humanize(milestone.completion_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            milestone.billing_status === "READY"
                              ? "warning"
                              : milestone.billing_status === "INVOICED"
                                ? "info"
                                : "neutral"
                          }
                        >
                          {humanize(milestone.billing_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {milestone.billing_amount
                          ? formatMoney(
                              milestone.billing_amount,
                              financials.currency,
                            )
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.milestones.truncated ? (
                <p className="text-xs text-muted-foreground">
                  Milestone preview is truncated. The dedicated Milestones workspace
                  will provide the full operational list.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "invoices" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Invoiced"
              value={formatMoney(data.invoices.invoiced_total, financials.currency)}
            />
            <Metric
              label="Collected"
              value={formatMoney(data.invoices.collected_total, financials.currency)}
            />
            <Metric
              label="Outstanding"
              value={formatMoney(
                data.invoices.outstanding_total,
                financials.currency,
              )}
            />
          </div>

          {data.invoices.recent.length === 0 ? (
            <EmptyState
              title="No Invoices yet"
              description="Invoices linked to this Project will appear here after they are created."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.recent.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/app/invoices/${invoice.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {invoice.invoice_number ?? "Draft invoice"}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={documentVariant(invoice.document_state)}>
                          {humanize(invoice.document_state)}
                        </Badge>
                        <Badge variant={paymentVariant(invoice.payment_state)}>
                          {humanize(invoice.payment_state)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(invoice.grand_total, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {invoice.outstanding === null
                        ? "—"
                        : formatMoney(invoice.outstanding, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : null}

      {tab === "activity" ? (
        data.activity.items.length === 0 ? (
          <EmptyState
            title="No Project activity yet"
            description="Commercial, delivery and financial events linked to this Project will appear here."
          />
        ) : (
          <div className="divide-y rounded-lg border bg-surface">
            {data.activity.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="text-sm font-medium">
                    {humanize(item.action)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {humanize(item.entity_type)}
                    {item.entity_id ? ` · ${shortId(item.entity_id)}` : ""}
                    {" · "}
                    {humanize(item.actor_type)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
