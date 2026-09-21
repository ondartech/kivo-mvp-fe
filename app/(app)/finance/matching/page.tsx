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
import { useMatchReviewQueue } from "@/features/finance-matching/api";
import {
  needsReview,
  reviewPriority,
  supplierDisplayName,
  type MatchReviewQueueItem,
} from "@/features/finance-matching/schema";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type Filter = "ALL" | "NEEDS_REVIEW" | "MATCHED";

function resultVariant(
  item: MatchReviewQueueItem,
): "neutral" | "success" | "warning" | "critical" | "info" {
  if (!item.latest_evaluation_id) return "neutral";
  if (item.match_result === "MATCHED" || item.match_result === "NOT_REQUIRED") {
    return "success";
  }
  if (item.match_result === "MISMATCH") return "critical";
  if (item.match_result === "REVIEW_REQUIRED") return "warning";
  return "info";
}

function resultLabel(item: MatchReviewQueueItem): string {
  if (!item.latest_evaluation_id) return "Not evaluated";
  return (item.match_result ?? "Unknown").replaceAll("_", " ");
}

function filterRows(
  rows: MatchReviewQueueItem[],
  filter: Filter,
): MatchReviewQueueItem[] {
  const sorted = [...rows].sort((left, right) => {
    const priority = reviewPriority(left) - reviewPriority(right);
    if (priority !== 0) return priority;
    return right.bill_date.localeCompare(left.bill_date);
  });
  if (filter === "NEEDS_REVIEW") return sorted.filter(needsReview);
  if (filter === "MATCHED") return sorted.filter((item) => !needsReview(item));
  return sorted;
}

export default function FinanceMatchingPage() {
  const organizationId = useActiveOrganizationId();
  const [filter, setFilter] = useState<Filter>("ALL");
  const queue = useMatchReviewQueue(organizationId ?? "");

  const rows = queue.data?.data ?? [];
  const visibleRows = useMemo(() => filterRows(rows, filter), [rows, filter]);
  const reviewCount = rows.filter(needsReview).length;
  const materialCount = rows.filter(
    (item) => item.open_material_exception_count > 0,
  ).length;
  const matchedCount = rows.filter((item) => !needsReview(item)).length;

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Supplier Bill matching."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Supplier Bill match review"
        description={
          "Review deterministic two-way and three-way matching evidence " +
          "before supplier obligations move forward."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Needs review
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {queue.isLoading ? "—" : reviewCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Material exceptions
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {queue.isLoading ? "—" : materialCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Matched / not required
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {queue.isLoading ? "—" : matchedCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["NEEDS_REVIEW", "Needs review"],
            ["MATCHED", "Matched"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "primary" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {queue.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : queue.isError ? (
        <ErrorState
          title="Match review queue unavailable"
          description={queue.error.message}
          retry={{ label: "Retry", onClick: () => void queue.refetch() }}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          title={
            filter === "ALL"
              ? "No Supplier Bills to review"
              : "No bills in this view"
          }
          description={
            filter === "MATCHED"
              ? "No current Supplier Bills have completed a clean match yet."
              : "There are no received or under-review Supplier Bills requiring this Finance view."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Supplier invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Exceptions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((item) => (
              <TableRow key={item.supplier_bill_id}>
                <TableCell>
                  <div className="font-medium">
                    {supplierDisplayName(item.supplier_snapshot)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.source_type.replaceAll("_", " ")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.bill_number}</div>
                  <div className="text-xs text-muted-foreground">
                    v{item.bill_version} · {item.bill_status.replaceAll("_", " ")}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {item.supplier_invoice_number}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatMoney(item.grand_total, item.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={resultVariant(item)}>{resultLabel(item)}</Badge>
                  {item.match_mode ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.match_mode.replaceAll("_", " ")}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="tabular-nums">
                    {item.open_exception_count} open
                  </div>
                  {item.open_material_exception_count > 0 ? (
                    <div className="text-xs text-critical">
                      {item.open_material_exception_count} material
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/app/finance/matching/${item.supplier_bill_id}`}
                    >
                      Review
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
