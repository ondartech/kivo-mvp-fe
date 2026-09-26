"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { PaymentOperationsNav } from "@/components/kivo/payment-operations-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
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
  usePaymentRunAudit,
  usePaymentRunOperations,
  usePaymentSafetyControls,
  usePreparePaymentExecution,
  useSetPaymentRunItemDestination,
  useSubmitPaymentExecution,
  useSubmitPaymentRun,
  useTenantEmergencyPosture,
} from "@/features/payment-operations/api";
import type {
  PaymentRunItem,
  PaymentRunStatus,
} from "@/features/payment-operations/types";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function runVariant(status: PaymentRunStatus) {
  if (status === "SETTLED") return "success" as const;
  if (["FAILED", "REJECTED", "CANCELLED"].includes(status)) {
    return "critical" as const;
  }
  if (["PENDING_APPROVAL", "PARTIALLY_SETTLED"].includes(status)) {
    return "warning" as const;
  }
  if (status === "EXECUTING") return "processing" as const;
  if (["APPROVED", "READY"].includes(status)) return "info" as const;
  return "neutral" as const;
}

function DestinationEditor({
  orgId,
  runId,
  item,
}: {
  orgId: string;
  runId: string;
  item: PaymentRunItem;
}) {
  const mutation = useSetPaymentRunItemDestination(orgId, runId, item.id);
  const [open, setOpen] = useState(false);
  const [bankCode, setBankCode] = useState(item.destination_bank_code ?? "");
  const [bankName, setBankName] = useState(item.destination_bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(
    item.destination_account_name ?? "",
  );

  if (item.destination_configured && !open) {
    return (
      <div className="space-y-1">
        <Badge
          variant={
            item.destination_verification_status === "VERIFIED"
              ? "success"
              : "warning"
          }
        >
          {item.destination_verification_status ?? "Configured"}
        </Badge>
        <div className="text-xs text-muted-foreground">
          {item.destination_bank_name ?? item.destination_bank_code} · ••••
          {item.destination_account_number_last4}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Change
        </Button>
      </div>
    );
  }

  if (!open && !item.destination_configured) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Set destination
      </Button>
    );
  }

  return (
    <div className="min-w-64 space-y-2 rounded-md border p-3">
      <Input
        value={bankCode}
        placeholder="Bank code"
        onChange={(event) => setBankCode(event.target.value)}
      />
      <Input
        value={bankName}
        placeholder="Bank name"
        onChange={(event) => setBankName(event.target.value)}
      />
      <Input
        value={accountNumber}
        placeholder="Account number"
        inputMode="numeric"
        onChange={(event) => setAccountNumber(event.target.value)}
      />
      <Input
        value={accountName}
        placeholder="Account name"
        onChange={(event) => setAccountName(event.target.value)}
      />
      {mutation.isError ? (
        <p className="text-xs text-critical">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Destination could not be saved."}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={mutation.isPending}
          disabled={
            !bankCode || !bankName || !accountNumber || !accountName
          }
          onClick={() =>
            void mutation
              .mutateAsync({
                bank_code: bankCode,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName,
                currency: item.currency,
              })
              .then(() => {
                setAccountNumber("");
                setOpen(false);
              })
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function PaymentRunDetailPage() {
  const params = useParams<{ paymentRunId: string }>();
  const runId = params.paymentRunId;
  const orgId = useActiveOrganizationId() ?? "";
  const operations = usePaymentRunOperations(orgId, runId);
  const audit = usePaymentRunAudit(orgId, runId);
  const emergency = useTenantEmergencyPosture(orgId);
  const safety = usePaymentSafetyControls(orgId);
  const submit = useSubmitPaymentRun(orgId, runId);
  const prepare = usePreparePaymentExecution(orgId, runId);
  const executionId = operations.data?.execution?.id ?? "";
  const submitExecution = useSubmitPaymentExecution(orgId, executionId);
  const [submitReason, setSubmitReason] = useState("Payment Run ready for approval");
  const [executionMethod, setExecutionMethod] = useState<
    "MANUAL" | "CSV_EXPORT"
  >("MANUAL");
  const [externalReference, setExternalReference] = useState("");

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening this Payment Run."
      />
    );
  }

  if (operations.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (operations.isError || !operations.data) {
    return (
      <ErrorState
        title="Payment Run unavailable"
        description={
          operations.error instanceof Error
            ? operations.error.message
            : "The Payment Run operations graph could not be loaded."
        }
        retry={{ label: "Retry", onClick: () => void operations.refetch() }}
      />
    );
  }

  const { run, approval_history: approvals, execution, generation_source } =
    operations.data;
  const activeSafety = (safety.data?.data ?? []).filter(
    (control) =>
      control.mode !== "ENABLED" &&
      (!control.branch_id || run.branch_ids.includes(control.branch_id)),
  );
  const emergencyControls = emergency.data?.active_controls ?? [];
  const blocked = emergencyControls.length > 0 || activeSafety.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={run.run_number}
        title={run.name || "Payment run"}
        description="One operational view across draft composition, approval evidence, execution instructions, settlement/reconciliation, accounting lineage, audit and safety controls."
        actions={
          <>
            <Badge variant={runVariant(run.status)}>
              {run.status.replaceAll("_", " ")}
            </Badge>
            <Button variant="outline" asChild>
              <Link href="/app/payments/runs">Back to runs</Link>
            </Button>
          </>
        }
      />
      <PaymentOperationsNav />

      {blocked ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">Safety control applies</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  This does not change the Run into a failed payment. Backend
                  authority will continue to block restricted actions while
                  preserving the commercial and financial evidence below.
                </p>
              </div>
              <Badge variant="warning">CONTROL STATE</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {emergencyControls.map((control) => (
                <Badge key={control} variant="critical">
                  {control.replaceAll("_", " ")}
                </Badge>
              ))}
              {activeSafety.map((control) => (
                <Badge key={control.id} variant="warning">
                  {control.capability} · {control.mode.replaceAll("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </div>
            <MoneyAmount
              amount={run.total_amount}
              currency={run.currency}
              emphasis="primary"
              className="mt-2 block"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Items
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {run.item_count}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Planned execution
            </div>
            <div className="mt-2 font-medium">
              {run.scheduled_execution_date ?? "Not scheduled"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Source
            </div>
            <div className="mt-2 font-medium">
              {generation_source ? "Scheduled template" : "Manual preparation"}
            </div>
            {generation_source ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Template v{generation_source.template_version}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-5">
            <div className="font-medium">Run items & beneficiary readiness</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Destinations remain explicit execution authority. A selected obligation
              is not executable until its destination passes the payment safety flow.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligation</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead>Destination</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.items
                .filter((item) => item.status !== "REMOVED")
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.payment_obligation_id.slice(0, 12)}
                    </TableCell>
                    <TableCell>
                      {item.branch_id ? item.branch_id.slice(0, 8) : "Org"}
                    </TableCell>
                    <TableCell className="text-right">
                      <MoneyAmount
                        amount={item.allocated_amount}
                        currency={item.currency}
                        emphasis="table"
                      />
                    </TableCell>
                    <TableCell>
                      <DestinationEditor
                        orgId={orgId}
                        runId={run.id}
                        item={item}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {run.status === "DRAFT" ? (
        <Card>
          <CardContent className="p-5">
            <div className="font-medium">Submit for approval</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Submission freezes the material version and resolves the current
              authoritative Payment Run approval policy again.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                value={submitReason}
                onChange={(event) => setSubmitReason(event.target.value)}
              />
              <Button
                loading={submit.isPending}
                disabled={!submitReason.trim()}
                onClick={() =>
                  void submit.mutateAsync({ reason: submitReason.trim() })
                }
              >
                Submit run
              </Button>
            </div>
            {submit.isError ? (
              <p className="mt-2 text-sm text-critical">
                {submit.error instanceof Error
                  ? submit.error.message
                  : "Submission failed."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium">Approval history</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Immutable approval evidence remains visible even when a later material
                version supersedes it.
              </p>
            </div>
            {run.status === "PENDING_APPROVAL" ? (
              <Button variant="outline" asChild>
                <Link href="/app/payments/approvals">Open approvals</Link>
              </Button>
            ) : null}
          </div>
          {approvals.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              No approval request has been created.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        approval.status === "APPROVED"
                          ? "success"
                          : approval.status === "REJECTED"
                            ? "critical"
                            : "warning"
                      }
                    >
                      {approval.status}
                    </Badge>
                    <span className="text-sm">
                      {approval.approval_votes.length}/{approval.required_approvals}{" "}
                      approvals
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {approval.reason} · {new Date(approval.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {["APPROVED", "READY"].includes(run.status) && !execution ? (
        <Card>
          <CardContent className="p-5">
            <div className="font-medium">Prepare execution</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Preparing an execution does not release money. Destination, approval,
              risk, step-up and safety authority are checked again before release.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm"
                value={executionMethod}
                onChange={(event) =>
                  setExecutionMethod(event.target.value as "MANUAL" | "CSV_EXPORT")
                }
              >
                <option value="MANUAL">Manual</option>
                <option value="CSV_EXPORT">CSV export</option>
              </select>
              <Button
                loading={prepare.isPending}
                onClick={() => void prepare.mutateAsync({ method: executionMethod })}
              >
                Prepare execution
              </Button>
            </div>
            {prepare.isError ? (
              <p className="mt-2 text-sm text-critical">
                {prepare.error instanceof Error
                  ? prepare.error.message
                  : "Execution preparation failed."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {execution ? (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">Execution & instructions</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {execution.method.replaceAll("_", " ")} · execution #
                  {execution.execution_number}
                </p>
              </div>
              <Badge
                variant={
                  execution.status === "COMPLETED"
                    ? "success"
                    : execution.status === "FAILED"
                      ? "critical"
                      : "processing"
                }
              >
                {execution.status}
              </Badge>
            </div>

            {execution.status === "PREPARED" ? (
              <div className="mt-4 rounded-md border p-4">
                <Label htmlFor="batch-reference">External batch reference</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="batch-reference"
                    value={externalReference}
                    onChange={(event) => setExternalReference(event.target.value)}
                    placeholder="Bank file / batch reference"
                  />
                  <Button
                    loading={submitExecution.isPending}
                    disabled={!externalReference.trim()}
                    onClick={() =>
                      void submitExecution.mutateAsync({
                        external_batch_reference: externalReference.trim(),
                      })
                    }
                  >
                    Authorize execution submission
                  </Button>
                </div>
                {submitExecution.isError ? (
                  <p className="mt-2 text-sm text-critical">
                    {submitExecution.error instanceof Error
                      ? submitExecution.error.message
                      : "Execution submission failed."}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {execution.instructions.map((instruction) => {
                const latest =
                  instruction.reconciliations[
                    instruction.reconciliations.length - 1
                  ];
                return (
                  <div key={instruction.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          Instruction {instruction.id.slice(0, 10)}
                        </div>
                        <MoneyAmount
                          amount={instruction.amount}
                          currency={instruction.currency}
                          emphasis="secondary"
                          className="mt-1 block"
                        />
                      </div>
                      <Badge
                        variant={
                          instruction.status === "SETTLED"
                            ? "success"
                            : instruction.status === "OUTCOME_UNKNOWN"
                              ? "critical"
                              : ["FAILED", "REJECTED"].includes(instruction.status)
                                ? "critical"
                                : "info"
                        }
                      >
                        {instruction.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <div>
                        Attempts: {instruction.current_attempt_number}
                      </div>
                      <div>
                        Destination: ••••
                        {instruction.destination_account_number_last4}
                      </div>
                      <div>
                        Reconciliations: {instruction.reconciliations.length}
                      </div>
                    </div>
                    {latest ? (
                      <div className="mt-3 rounded-md bg-neutral-50 p-3 text-sm">
                        <div className="font-medium">
                          Latest evidence: {latest.outcome.replaceAll("_", " ")}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {latest.evidence_type.replaceAll("_", " ")} · Finance{" "}
                          {latest.finance_status.replaceAll("_", " ")}
                        </div>
                        {latest.journal_entry_id ? (
                          <div className="mt-1 text-xs font-mono">
                            Journal {latest.journal_entry_id}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <div className="font-medium">Audit trail</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment Run audit remains owned by the platform Audit domain.
          </p>
          {audit.isLoading ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : audit.isError ? (
            <div className="mt-4 text-sm text-muted-foreground">
              Audit events could not be loaded.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {(audit.data?.data ?? []).map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-1 rounded-md border p-3 text-sm sm:flex-row"
                >
                  <div>
                    <span className="font-medium">
                      {event.action.replaceAll("_", " ")}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {event.actor_type} · {event.source}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {(audit.data?.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No audit events are visible for this run.
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
