"use client";

import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { PaymentOperationsNav } from "@/components/kivo/payment-operations-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { usePaymentObligations } from "@/features/payment-operations/api";
import { resolvePaymentReadScope } from "@/features/payment-operations/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

type View = "OPEN" | "HELD" | "ALL";

function shortId(value: string | null) {
  return value ? value.slice(0, 8) : "—";
}

function statusVariant(status: string, control: string) {
  if (control === "HELD") return "warning" as const;
  if (status === "SETTLED") return "success" as const;
  if (status === "CANCELLED" || status === "VOIDED") return "critical" as const;
  return "info" as const;
}

export default function PaymentObligationsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const [view, setView] = useState<View>("OPEN");
  const branchAccess = useOperatingBranches(orgId, {
    permissionCode: "payment_obligations:read",
  });
  const scope = resolvePaymentReadScope(branchAccess.data, activeBranchId);
  const query = usePaymentObligations(orgId, {
    status: view === "OPEN" ? "OPEN" : undefined,
    controlStatus: view === "HELD" ? "HELD" : undefined,
    branchId: scope.branchId,
    currency: "NGN",
    limit: 100,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Payment Obligations."
      />
    );
  }

  if (scope.selectionRequired) {
    return (
      <EmptyState
        title="Choose an operating Branch"
        description="Your Payment access is Branch-scoped. Select an authorized Branch first."
      />
    );
  }

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        title="Payment obligations"
        description="Canonical outbound obligations that are eligible, held, partially settled or completed. A hold remains visible because it is a control state, not economic deletion."
      />
      <PaymentOperationsNav />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["OPEN", "Open"],
            ["HELD", "Held"],
            ["ALL", "All"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={view === value ? "primary" : "outline"}
            onClick={() => setView(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Payment Obligations unavailable"
          description={
            query.error instanceof Error
              ? query.error.message
              : "The obligations request failed."
          }
          retry={{ label: "Retry", onClick: () => void query.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No obligations in this view"
          description="There are no Payment Obligations matching the current Branch and control filters."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligation</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Control</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">
                      {item.obligation_type.replaceAll("_", " ")}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {shortId(item.id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.source_type.replaceAll("_", " ")}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {shortId(item.source_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{item.counterparty_type.replaceAll("_", " ")}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {shortId(item.counterparty_id)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.due_date ?? "No due date"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant(item.status, item.control_status)}
                    >
                      {item.control_status === "HELD"
                        ? "HELD"
                        : item.status.replaceAll("_", " ")}
                    </Badge>
                    {item.hold_reason ? (
                      <div className="mt-1 max-w-56 text-xs text-muted-foreground">
                        {item.hold_reason}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <MoneyAmount
                      amount={item.outstanding_amount}
                      currency={item.currency}
                      emphasis="table"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
