"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePaymentReconciliationQueue,
  useReconcileInstruction,
} from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentInstructionStatusVariant,
  paymentOperationsErrorMessage,
  reconciliationEvidenceTypes,
} from "@/features/payments/payment-runs";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

const selectClassName =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

type QueueRow = NonNullable<
  ReturnType<typeof usePaymentReconciliationQueue>["data"]
>["data"][number];

export default function PaymentReconciliationPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const [attentionOnly, setAttentionOnly] = useState(true);

  const queue = usePaymentReconciliationQueue(orgId, {
    currency: "NGN",
    branchId,
    attentionOnly,
    limit: 100,
  });

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening reconciliation."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment Operations"
        title="Reconciliation"
        description="Resolve ambiguous or in-flight payment instruction outcomes with explicit bank, provider, or operator evidence."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/payments">Operations</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/payments/executions">Execution queue</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <div className="text-sm font-medium">Queue scope</div>
            <div className="text-xs text-muted-foreground">
              Attention-only filters before the server limit, so older unresolved
              items are not hidden by newer completed instructions.
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(event) => setAttentionOnly(event.target.checked)}
            />
            Attention only
          </label>
        </CardContent>
      </Card>

      {queue.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : queue.isError ? (
        <ErrorState
          title="Reconciliation queue unavailable"
          description={
            queue.error instanceof Error
              ? queue.error.message
              : "The reconciliation queue could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void queue.refetch() }}
        />
      ) : (queue.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title={attentionOnly ? "No reconciliation attention" : "No instructions"}
          description={
            attentionOnly
              ? "There are no ambiguous, unreconciled, or Finance-posting-failed instructions in the current scope."
              : "No payment instructions were returned for this scope."
          }
        />
      ) : (
        <div className="space-y-3">
          {queue.data?.data.map((row) => (
            <ReconciliationRow
              key={row.payment_instruction_id}
              orgId={orgId}
              row={row}
              onChanged={() => void queue.refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReconciliationRow({
  orgId,
  row,
  onChanged,
}: {
  orgId: string;
  row: QueueRow;
  onChanged: () => void;
}) {
  const reconcile = useReconcileInstruction(
    orgId,
    row.payment_run_id,
    row.payment_execution_id,
    row.payment_instruction_id,
  );
  const [outcome, setOutcome] = useState<
    "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED"
  >("SETTLED");
  const [evidenceType, setEvidenceType] = useState("BANK_STATEMENT_DEBIT");
  const [externalReference, setExternalReference] = useState("");
  const [settlementReference, setSettlementReference] = useState("");

  const evidenceTypes = reconciliationEvidenceTypes(outcome);
  const actionable = [
    "OUTCOME_UNKNOWN",
    "ACCEPTED_UNRECONCILED",
    "IN_TRANSIT_UNRECONCILED",
  ].includes(row.attention_state);

  const submit = async () => {
    if (!externalReference.trim()) {
      toast.error("Add the external evidence reference.");
      return;
    }
    if (outcome === "SETTLED" && !settlementReference.trim()) {
      toast.error("Settled evidence requires a settlement reference.");
      return;
    }
    const evidenceAt = new Date().toISOString();
    try {
      await reconcile.mutateAsync({
        outcome,
        evidence_type: evidenceType,
        external_reference: externalReference.trim(),
        evidence_at: evidenceAt,
        settlement_reference:
          outcome === "SETTLED" ? settlementReference.trim() : null,
        settled_at: outcome === "SETTLED" ? evidenceAt : null,
        evidence: {},
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Authoritative payment outcome recorded");
      setExternalReference("");
      setSettlementReference("");
      onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <Card
      className={
        row.attention_state === "FINANCE_POSTING_FAILED"
          ? "border-critical/30"
          : row.attention_state !== "NONE"
            ? "border-warning/30"
            : undefined
      }
    >
      <CardContent className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/app/payments/runs/${row.payment_run_id}`}
                className="font-medium hover:underline"
              >
                {row.run_number}
              </Link>
              <Badge
                variant={paymentInstructionStatusVariant(row.instruction_status)}
              >
                {humanizePaymentValue(row.instruction_status)}
              </Badge>
              {row.attention_state !== "NONE" ? (
                <Badge
                  variant={
                    row.attention_state === "FINANCE_POSTING_FAILED"
                      ? "critical"
                      : "warning"
                  }
                >
                  {humanizePaymentValue(row.attention_state)}
                </Badge>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Instruction {row.payment_instruction_id.slice(0, 8)} · attempt{" "}
              {row.current_attempt_number}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">
              {formatMoney(row.amount, row.currency)}
            </div>
            <div className="text-xs text-muted-foreground">
              Updated {new Date(row.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        {row.last_reconciliation ? (
          <div className="mt-4 grid gap-2 rounded-md border bg-neutral-50 p-3 text-xs sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Last outcome</div>
              <div className="font-medium">
                {humanizePaymentValue(row.last_reconciliation.outcome)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Evidence</div>
              <div className="font-medium">
                {humanizePaymentValue(row.last_reconciliation.evidence_type)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Finance</div>
              <div className="font-medium">
                {humanizePaymentValue(row.last_reconciliation.finance_status)}
              </div>
            </div>
          </div>
        ) : null}

        {actionable ? (
          <details className="mt-4 rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Record authoritative evidence
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <Label>Outcome</Label>
                <select
                  className={selectClassName}
                  value={outcome}
                  onChange={(event) => {
                    const next = event.target.value as typeof outcome;
                    setOutcome(next);
                    setEvidenceType(reconciliationEvidenceTypes(next)[0]);
                  }}
                >
                  <option value="SETTLED">Settled</option>
                  <option value="IN_TRANSIT">In transit</option>
                  <option value="NOT_SETTLED">Not settled</option>
                </select>
              </div>
              <div>
                <Label>Evidence type</Label>
                <select
                  className={selectClassName}
                  value={evidenceType}
                  onChange={(event) => setEvidenceType(event.target.value)}
                >
                  {evidenceTypes.map((value) => (
                    <option key={value} value={value}>
                      {humanizePaymentValue(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>External reference</Label>
                <Input
                  className="mt-1"
                  value={externalReference}
                  onChange={(event) => setExternalReference(event.target.value)}
                  placeholder="Bank statement / portal / provider reference"
                />
              </div>
              {outcome === "SETTLED" ? (
                <div>
                  <Label>Settlement reference</Label>
                  <Input
                    className="mt-1"
                    value={settlementReference}
                    onChange={(event) =>
                      setSettlementReference(event.target.value)
                    }
                    placeholder="Unique settlement reference"
                  />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  disabled={reconcile.isPending}
                  onClick={() => void submit()}
                >
                  {reconcile.isPending ? "Reconciling…" : "Record evidence"}
                </Button>
              </div>
            </div>
          </details>
        ) : row.attention_state === "FINANCE_POSTING_FAILED" ? (
          <div className="mt-4 rounded-md border border-critical/20 bg-critical-subtle p-3 text-sm">
            The instruction already has settlement evidence, but Finance posting
            failed. Do not record another settlement. Resolve the Finance posting
            exception while preserving this reconciliation evidence.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
