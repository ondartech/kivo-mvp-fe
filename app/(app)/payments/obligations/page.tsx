"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useHoldPaymentObligation,
  usePaymentObligations,
  useReleasePaymentObligation,
} from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentOperationsErrorMessage,
} from "@/features/payments/payment-runs";
import type { PaymentObligation } from "@/features/payments/schema";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

const selectClassName =
  "rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function beneficiaryLabel(obligation: PaymentObligation): string {
  for (const snapshot of [
    obligation.beneficiary_snapshot,
    obligation.source_snapshot,
  ]) {
    for (const key of [
      "name",
      "display_name",
      "supplier_name",
      "beneficiary_name",
    ]) {
      const value = snapshot[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return humanizePaymentValue(obligation.counterparty_type);
}

export default function PaymentObligationsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const [controlStatus, setControlStatus] = useState<"" | "AVAILABLE" | "HELD">(
    "",
  );
  const [status, setStatus] = useState("");

  const obligations = usePaymentObligations(orgId, {
    status: status || null,
    controlStatus: controlStatus || null,
    branchId,
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment Operations"
        title="Payment Obligations"
        description="The normalized money-out obligations available to Payment Runs. Hold is an explicit control state; it does not mutate the source payable or imply settlement."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/payments">Operations</Link>
            </Button>
            <Button asChild>
              <Link href="/app/payments/runs/new">Create Payment Run</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <select
            aria-label="Obligation lifecycle status"
            className={selectClassName}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All lifecycle states</option>
            <option value="OPEN">Open</option>
            <option value="PARTIALLY_SETTLED">Partially settled</option>
            <option value="SETTLED">Settled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="VOIDED">Voided</option>
          </select>
          <select
            aria-label="Obligation control status"
            className={selectClassName}
            value={controlStatus}
            onChange={(event) =>
              setControlStatus(
                event.target.value as "" | "AVAILABLE" | "HELD",
              )
            }
          >
            <option value="">All control states</option>
            <option value="AVAILABLE">Available</option>
            <option value="HELD">Held</option>
          </select>
        </CardContent>
      </Card>

      {obligations.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : obligations.isError ? (
        <ErrorState
          title="Payment Obligations unavailable"
          description={
            obligations.error instanceof Error
              ? obligations.error.message
              : "The obligation register could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void obligations.refetch() }}
        />
      ) : (obligations.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No Payment Obligations in this view"
          description="No normalized obligations match the selected lifecycle and control filters."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligation</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-72">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.data?.data.map((obligation) => (
                <ObligationRow
                  key={obligation.id}
                  orgId={orgId}
                  obligation={obligation}
                  onChanged={() => void obligations.refetch()}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ObligationRow({
  orgId,
  obligation,
  onChanged,
}: {
  orgId: string;
  obligation: PaymentObligation;
  onChanged: () => void;
}) {
  const hold = useHoldPaymentObligation(orgId);
  const release = useReleasePaymentObligation(orgId);
  const [reason, setReason] = useState("");
  const terminal = ["SETTLED", "CANCELLED", "VOIDED"].includes(
    obligation.status,
  );

  const applyControl = async (command: "hold" | "release") => {
    if (reason.trim().length < 3) {
      toast.error("Record a reason of at least three characters.");
      return;
    }
    if (
      !window.confirm(
        command === "hold"
          ? "Place this Payment Obligation on hold?"
          : "Release this Payment Obligation back to available?",
      )
    ) {
      return;
    }

    try {
      if (command === "hold") {
        await hold.mutateAsync({
          obligationId: obligation.id,
          reason: reason.trim(),
        });
      } else {
        await release.mutateAsync({
          obligationId: obligation.id,
          reason: reason.trim(),
        });
      }
      setReason("");
      toast.success(
        command === "hold" ? "Obligation held" : "Obligation released",
      );
      onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {humanizePaymentValue(obligation.obligation_type)}
        </div>
        <div className="text-xs text-muted-foreground">
          {humanizePaymentValue(obligation.source_type)} ·{" "}
          {obligation.source_id.slice(0, 8)}
        </div>
      </TableCell>
      <TableCell>{beneficiaryLabel(obligation)}</TableCell>
      <TableCell>{obligation.due_date ?? "No due date"}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatMoney(obligation.outstanding_amount, obligation.currency)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={
              obligation.status === "SETTLED"
                ? "success"
                : obligation.status === "PARTIALLY_SETTLED"
                  ? "warning"
                  : "neutral"
            }
          >
            {humanizePaymentValue(obligation.status)}
          </Badge>
          <Badge
            variant={
              obligation.control_status === "HELD" ? "warning" : "success"
            }
          >
            {humanizePaymentValue(obligation.control_status)}
          </Badge>
        </div>
        {obligation.hold_reason ? (
          <div className="mt-1 max-w-xs text-xs text-muted-foreground">
            {obligation.hold_reason}
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        {!terminal ? (
          <div className="flex items-center gap-2">
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                obligation.control_status === "HELD"
                  ? "Release reason"
                  : "Hold reason"
              }
              aria-label={
                obligation.control_status === "HELD"
                  ? "Release reason"
                  : "Hold reason"
              }
            />
            <Button
              size="sm"
              variant="outline"
              disabled={hold.isPending || release.isPending}
              onClick={() =>
                void applyControl(
                  obligation.control_status === "HELD" ? "release" : "hold",
                )
              }
            >
              {obligation.control_status === "HELD" ? "Release" : "Hold"}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Terminal obligation
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
