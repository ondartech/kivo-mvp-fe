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
  useApprovalStepUp,
  useArchivePaymentRun,
  useCancelPaymentRun,
  useCompletePaymentRunWithExceptions,
  useDecideApproval,
  useExecutionStepUp,
  useExportPaymentExecution,
  usePaymentRunItemDetail,
  usePaymentRunOperations,
  usePreparePaymentExecution,
  useReconcileInstruction,
  useRecordInstructionResult,
  useRemovePaymentRunItem,
  useSetPaymentRunItemDestination,
  useSubmitPaymentExecution,
  useSubmitPaymentRun,
  useUnarchivePaymentRun,
} from "./api";
import {
  canArchivePaymentRun,
  canCancelPaymentRun,
  canCompleteWithExceptions,
  canEditPaymentRun,
  canPreparePaymentExecution,
  canSubmitPaymentRun,
  canUnarchivePaymentRun,
  humanizePaymentValue,
  instructionResultEvidenceTypes,
  itemDestinationLabel,
  paymentInstructionStatusVariant,
  paymentOperationsErrorMessage,
  paymentOutcomeStatusVariant,
  paymentRunStatusVariant,
  reconciliationEvidenceTypes,
  shortPaymentId,
} from "./payment-runs";
import type { PaymentExecution, PaymentInstruction, PaymentRunItem } from "./schema";
import { formatMoney } from "@/lib/money";

const selectClassName =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";
const textareaClassName =
  "mt-1 min-h-20 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function snapshotName(snapshot: Record<string, unknown>): string | null {
  for (const key of [
    "name",
    "display_name",
    "supplier_name",
    "beneficiary_name",
    "counterparty_name",
  ]) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function downloadTextFile(filename: string, content: string, mediaType: string) {
  const blob = new Blob([content], { type: mediaType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function PaymentRunWorkspace({
  orgId,
  paymentRunId,
}: {
  orgId: string;
  paymentRunId: string;
}) {
  const operations = usePaymentRunOperations(orgId, paymentRunId);
  const submit = useSubmitPaymentRun(orgId, paymentRunId);
  const cancel = useCancelPaymentRun(orgId, paymentRunId);
  const archive = useArchivePaymentRun(orgId, paymentRunId);
  const unarchive = useUnarchivePaymentRun(orgId, paymentRunId);
  const complete = useCompletePaymentRunWithExceptions(orgId, paymentRunId);
  const approvalStepUp = useApprovalStepUp(orgId, paymentRunId);
  const decide = useDecideApproval(orgId, paymentRunId);
  const prepare = usePreparePaymentExecution(orgId, paymentRunId);
  const executionStepUp = useExecutionStepUp(orgId, paymentRunId);

  const [reason, setReason] = useState("");
  const [approvalPassword, setApprovalPassword] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [executionMethod, setExecutionMethod] = useState<
    "MANUAL" | "CSV_EXPORT" | "BANK_FILE_EXPORT"
  >("MANUAL");
  const [executionPassword, setExecutionPassword] = useState("");
  const [batchReference, setBatchReference] = useState("");

  if (operations.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (operations.isError) {
    return (
      <ErrorState
        title="Payment Run unavailable"
        description={
          operations.error instanceof Error
            ? operations.error.message
            : "The Payment Run could not be loaded."
        }
        retry={{ label: "Retry", onClick: () => void operations.refetch() }}
      />
    );
  }

  if (!operations.data) {
    return (
      <EmptyState
        title="Payment Run unavailable"
        description="No Payment Run operations state was returned."
      />
    );
  }

  const { run, approval, approval_history: approvalHistory, execution } =
    operations.data;
  const activeItems = run.items.filter((item) => item.status !== "REMOVED");
  const destinationReady = activeItems.filter(
    (item) => item.destination_configured,
  ).length;

  const runCommand = async (
    command:
      | "submit"
      | "cancel"
      | "archive"
      | "unarchive"
      | "complete",
  ) => {
    const cleaned = reason.trim();
    if (cleaned.length < (command === "submit" ? 1 : 3)) {
      toast.error("Add a reason before recording this lifecycle decision.");
      return;
    }
    try {
      const payload = {
        reason: cleaned,
        idempotencyKey: crypto.randomUUID(),
      };
      if (command === "submit") await submit.mutateAsync(payload);
      if (command === "cancel") await cancel.mutateAsync(payload);
      if (command === "archive") await archive.mutateAsync(payload);
      if (command === "unarchive") await unarchive.mutateAsync(payload);
      if (command === "complete") await complete.mutateAsync(payload);
      setReason("");
      toast.success(
        command === "submit"
          ? "Payment Run submitted for approval"
          : `Payment Run ${command} recorded`,
      );
      await operations.refetch();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const decideApproval = async (decision: "APPROVE" | "REJECT") => {
    if (!approval) return;
    let stepUpToken: string | null = null;
    try {
      if (approvalPassword.trim()) {
        const stepped = await approvalStepUp.mutateAsync(approvalPassword);
        stepUpToken = stepped.grant_token;
      }
      await decide.mutateAsync({
        approvalRequestId: approval.id,
        decision,
        comment: approvalComment.trim() || null,
        reasonCode: decision === "REJECT" ? "OPERATOR_REJECTED" : null,
        idempotencyKey: crypto.randomUUID(),
        stepUpToken,
      });
      setApprovalComment("");
      setApprovalPassword("");
      toast.success(
        decision === "APPROVE" ? "Approval recorded" : "Rejection recorded",
      );
      await operations.refetch();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const prepareExecution = async () => {
    try {
      await prepare.mutateAsync({
        method: executionMethod,
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Payment Execution prepared");
      await operations.refetch();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={run.archived_at ? "Archived Payment Run" : "Payment Run"}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {run.run_number}
            <Badge variant={paymentRunStatusVariant(run.status)}>
              {humanizePaymentValue(run.status)}
            </Badge>
          </span>
        }
        description={
          run.name ??
          "Controlled batch from Payment Obligations through approval, execution, reconciliation and settlement."
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/payments/runs">All runs</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/payments">Operations</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Run total
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {formatMoney(run.total_amount, run.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Obligations
            </div>
            <div className="mt-2 text-2xl font-semibold">{run.item_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Destinations ready
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {destinationReady}/{activeItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Planned execution
            </div>
            <div className="mt-2 text-base font-semibold">
              {run.scheduled_execution_date ?? "Not scheduled"}
            </div>
          </CardContent>
        </Card>
      </div>

      {run.archived_at ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Archived historical run</div>
            <div className="mt-1 text-muted-foreground">
              Archived {formatTimestamp(run.archived_at)}
              {run.archive_reason ? ` · ${run.archive_reason}` : ""}.
              Archiving hides completed operational history; it does not delete
              financial evidence.
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Run lines</div>
              <div className="text-xs text-muted-foreground">
                Each line retains its source obligation and beneficiary snapshot.
              </div>
            </div>
            <Badge variant={destinationReady === activeItems.length ? "success" : "warning"}>
              {destinationReady === activeItems.length
                ? "Destinations ready"
                : "Destination setup required"}
            </Badge>
          </div>
          <div className="divide-y">
            {run.items.map((item) => (
              <PaymentRunLine
                key={item.id}
                orgId={orgId}
                paymentRunId={paymentRunId}
                item={item}
                editable={canEditPaymentRun(run)}
                onChanged={() => void operations.refetch()}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <div className="text-sm font-semibold">Approval authority</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Submission freezes the run material and creates the canonical
                Approval Request. A recurring template never pre-approves money.
              </p>
            </div>

            {approval ? (
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {humanizePaymentValue(approval.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {approval.required_approvals} approval(s) required ·{" "}
                      {approval.approval_votes.length} recorded
                    </div>
                  </div>
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
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No Approval Request exists yet.
              </div>
            )}

            {run.status === "DRAFT" ? (
              <div className="space-y-3">
                <Label htmlFor="run-submit-reason">Submission reason</Label>
                <textarea
                  id="run-submit-reason"
                  className={textareaClassName}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Why is this Payment Run ready for approval?"
                />
                <Button
                  disabled={!canSubmitPaymentRun(run) || submit.isPending}
                  onClick={() => void runCommand("submit")}
                >
                  {submit.isPending ? "Submitting…" : "Submit for approval"}
                </Button>
                {!canSubmitPaymentRun(run) ? (
                  <p className="text-xs text-warning">
                    Submission requires at least one active obligation and a
                    configured executable destination for every active line.
                  </p>
                ) : null}
              </div>
            ) : null}

            {approval &&
            ["PENDING", "SUBMITTED"].includes(approval.status) ? (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label htmlFor="approval-comment">Approval comment</Label>
                  <Input
                    id="approval-comment"
                    className="mt-1"
                    value={approvalComment}
                    onChange={(event) => setApprovalComment(event.target.value)}
                    placeholder="Optional decision context"
                  />
                </div>
                <div>
                  <Label htmlFor="approval-password">
                    Re-authentication password
                  </Label>
                  <Input
                    id="approval-password"
                    className="mt-1"
                    type="password"
                    autoComplete="current-password"
                    value={approvalPassword}
                    onChange={(event) => setApprovalPassword(event.target.value)}
                    placeholder="Required when step-up control applies"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={decide.isPending || approvalStepUp.isPending}
                    onClick={() => void decideApproval("APPROVE")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() => void decideApproval("REJECT")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}

            {approvalHistory.length > 1 ? (
              <div className="border-t pt-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prior approval requests
                </div>
                <div className="mt-2 space-y-2">
                  {approvalHistory.slice(1).map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-3 text-xs"
                    >
                      <span>{humanizePaymentValue(item.status)}</span>
                      <span className="text-muted-foreground">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <div className="text-sm font-semibold">Execution</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Approval authorizes the run. Execution preparation creates the
                instruction set; release remains a separate step-up protected action.
              </p>
            </div>

            {!execution && canPreparePaymentExecution(run) ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="execution-method">Execution method</Label>
                  <select
                    id="execution-method"
                    className={selectClassName}
                    value={executionMethod}
                    onChange={(event) =>
                      setExecutionMethod(
                        event.target.value as
                          | "MANUAL"
                          | "CSV_EXPORT"
                          | "BANK_FILE_EXPORT",
                      )
                    }
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="CSV_EXPORT">CSV export</option>
                    <option value="BANK_FILE_EXPORT">Bank file export</option>
                  </select>
                </div>
                <Button
                  disabled={prepare.isPending}
                  onClick={() => void prepareExecution()}
                >
                  {prepare.isPending ? "Preparing…" : "Prepare execution"}
                </Button>
              </div>
            ) : null}

            {execution ? (
              <ExecutionControls
                orgId={orgId}
                paymentRunId={paymentRunId}
                execution={execution}
                executionPassword={executionPassword}
                setExecutionPassword={setExecutionPassword}
                batchReference={batchReference}
                setBatchReference={setBatchReference}
                stepUp={executionStepUp}
                onChanged={() => void operations.refetch()}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {run.status === "APPROVED"
                  ? "Prepare an execution to create payment instructions."
                  : "Execution becomes available after canonical approval."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(canCancelPaymentRun(run) ||
        canCompleteWithExceptions(run) ||
        canArchivePaymentRun(run) ||
        canUnarchivePaymentRun(run)) ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <div className="text-sm font-semibold">Lifecycle closure</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Consequential terminal transitions require an explicit reason and
                are retained in audit/domain-event history.
              </p>
            </div>
            <div>
              <Label htmlFor="lifecycle-reason">Reason</Label>
              <textarea
                id="lifecycle-reason"
                className={textareaClassName}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Record why this lifecycle transition is appropriate."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {canCancelPaymentRun(run) ? (
                <Button
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => void runCommand("cancel")}
                >
                  Cancel run
                </Button>
              ) : null}
              {canCompleteWithExceptions(run) ? (
                <Button
                  variant="outline"
                  disabled={complete.isPending}
                  onClick={() => void runCommand("complete")}
                >
                  Complete with exceptions
                </Button>
              ) : null}
              {canArchivePaymentRun(run) ? (
                <Button
                  variant="outline"
                  disabled={archive.isPending}
                  onClick={() => void runCommand("archive")}
                >
                  Archive
                </Button>
              ) : null}
              {canUnarchivePaymentRun(run) ? (
                <Button
                  variant="outline"
                  disabled={unarchive.isPending}
                  onClick={() => void runCommand("unarchive")}
                >
                  Unarchive
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PaymentRunLine({
  orgId,
  paymentRunId,
  item,
  editable,
  onChanged,
}: {
  orgId: string;
  paymentRunId: string;
  item: PaymentRunItem;
  editable: boolean;
  onChanged: () => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const detail = usePaymentRunItemDetail(orgId, paymentRunId, item.id, {
    enabled: showEvidence,
  });
  const remove = useRemovePaymentRunItem(orgId, paymentRunId);
  const setDestination = useSetPaymentRunItemDestination(
    orgId,
    paymentRunId,
    item.id,
  );
  const [showDestination, setShowDestination] = useState(false);
  const [bankCode, setBankCode] = useState(item.destination_bank_code ?? "");
  const [bankName, setBankName] = useState(item.destination_bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(
    item.destination_account_name ?? "",
  );

  const saveDestination = async () => {
    if (
      !bankCode.trim() ||
      !bankName.trim() ||
      !accountNumber.trim() ||
      !accountName.trim()
    ) {
      toast.error("Complete the beneficiary bank destination.");
      return;
    }
    try {
      await setDestination.mutateAsync({
        bank_code: bankCode.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        currency: item.currency,
      });
      setAccountNumber("");
      setShowDestination(false);
      toast.success("Beneficiary destination configured");
      onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const beneficiaryLabel =
    snapshotName(item.beneficiary_snapshot) ??
    snapshotName(item.source_snapshot) ??
    shortPaymentId(item.payment_obligation_id);

  return (
    <div
      className={
        item.status === "REMOVED"
          ? "bg-neutral-50 px-5 py-4 opacity-60"
          : "px-5 py-4"
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{beneficiaryLabel}</span>
            <Badge variant={item.status === "SETTLED" ? "success" : "neutral"}>
              {humanizePaymentValue(item.status)}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Obligation {shortPaymentId(item.payment_obligation_id)}
          </div>
          <div className="mt-2 text-lg font-semibold tabular-nums">
            {formatMoney(item.allocated_amount, item.currency)}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Beneficiary destination
          </div>
          <div className="mt-1 text-sm">{itemDestinationLabel(item)}</div>
          {item.destination_account_name ? (
            <div className="text-xs text-muted-foreground">
              {item.destination_account_name} ·{" "}
              {humanizePaymentValue(
                item.destination_verification_status ?? "UNKNOWN",
              )}
            </div>
          ) : null}
        </div>

        {editable && item.status !== "REMOVED" ? (
          <div className="flex flex-wrap items-start gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDestination((value) => !value)}
            >
              {item.destination_configured
                ? "Change destination"
                : "Set destination"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={remove.isPending}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Remove this obligation from the draft Payment Run?",
                  )
                ) {
                  return;
                }
                try {
                  await remove.mutateAsync(item.id);
                  toast.success("Obligation removed from Payment Run");
                  onChanged();
                } catch (error) {
                  toast.error(paymentOperationsErrorMessage(error));
                }
              }}
            >
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEvidence((value) => !value)}
        >
          {showEvidence
            ? "Hide source & outcome evidence"
            : "Source & outcome evidence"}
        </Button>
      </div>

      {showDestination ? (
        <div className="mt-4 grid gap-3 rounded-md border bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor={`bank-code-${item.id}`}>Bank code</Label>
            <Input
              id={`bank-code-${item.id}`}
              className="mt-1"
              value={bankCode}
              onChange={(event) => setBankCode(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`bank-name-${item.id}`}>Bank name</Label>
            <Input
              id={`bank-name-${item.id}`}
              className="mt-1"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`account-number-${item.id}`}>Account number</Label>
            <Input
              id={`account-number-${item.id}`}
              className="mt-1"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`account-name-${item.id}`}>Account name</Label>
            <Input
              id={`account-name-${item.id}`}
              className="mt-1"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              size="sm"
              disabled={setDestination.isPending}
              onClick={() => void saveDestination()}
            >
              {setDestination.isPending ? "Saving…" : "Save destination"}
            </Button>
          </div>
        </div>
      ) : null}

      {showEvidence ? (
        detail.isLoading ? (
          <div className="mt-4 text-xs text-muted-foreground">
            Loading source and outcome evidence…
          </div>
        ) : detail.isError ? (
          <div className="mt-4 rounded-md border border-critical/20 bg-critical-subtle p-3 text-xs text-critical">
            Item evidence is temporarily unavailable.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {detail.data ? (
              <div className="grid gap-2 rounded-md border bg-neutral-50 p-3 text-xs sm:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Source</div>
                  <div className="font-medium">
                    {humanizePaymentValue(detail.data.obligation.source_type)} ·{" "}
                    {shortPaymentId(detail.data.obligation.source_id)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Obligation state</div>
                  <div className="font-medium">
                    {humanizePaymentValue(detail.data.obligation.status)} ·{" "}
                    {humanizePaymentValue(
                      detail.data.obligation.control_status,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reservation</div>
                  <div className="font-medium">
                    {detail.data.reservation_status
                      ? humanizePaymentValue(detail.data.reservation_status)
                      : "No active reservation"}
                  </div>
                </div>
              </div>
            ) : null}

            {(detail.data?.outcomes.length ?? 0) > 0 ? (
              <div className="rounded-md border p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Source-domain outcomes
                </div>
                <div className="mt-2 space-y-2">
                  {detail.data?.outcomes.map((outcome) => (
                    <div
                      key={outcome.id}
                      className="flex flex-col justify-between gap-2 border-t pt-2 first:border-t-0 first:pt-0 sm:flex-row"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {humanizePaymentValue(outcome.outcome_type)}
                          <Badge
                            variant={paymentOutcomeStatusVariant(outcome.status)}
                          >
                            {humanizePaymentValue(outcome.status)}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {humanizePaymentValue(outcome.source_type)} · source{" "}
                          {shortPaymentId(outcome.source_id)}
                          {outcome.last_error_reason
                            ? ` · ${outcome.last_error_reason}`
                            : ""}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {outcome.propagated_at
                          ? `Propagated ${formatTimestamp(outcome.propagated_at)}`
                          : outcome.quarantined_at
                            ? `Quarantined ${formatTimestamp(
                                outcome.quarantined_at,
                              )}`
                            : `Attempt ${outcome.attempt_count}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                No source-domain outcome propagation has been recorded for this
                line yet.
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}

function ExecutionControls({
  orgId,
  paymentRunId,
  execution,
  executionPassword,
  setExecutionPassword,
  batchReference,
  setBatchReference,
  stepUp,
  onChanged,
}: {
  orgId: string;
  paymentRunId: string;
  execution: PaymentExecution;
  executionPassword: string;
  setExecutionPassword: (value: string) => void;
  batchReference: string;
  setBatchReference: (value: string) => void;
  stepUp: ReturnType<typeof useExecutionStepUp>;
  onChanged: () => void;
}) {
  const submitExecution = useSubmitPaymentExecution(
    orgId,
    paymentRunId,
    execution.id,
  );
  const exportExecution = useExportPaymentExecution(orgId, execution.id);

  const release = async () => {
    if (!batchReference.trim()) {
      toast.error("Add the external batch reference before release.");
      return;
    }
    try {
      let token: string | null = null;
      if (executionPassword.trim()) {
        const stepped = await stepUp.mutateAsync({
          password: executionPassword,
        });
        if (stepped.required) token = stepped.grant_token;
      }
      await submitExecution.mutateAsync({
        externalBatchReference: batchReference.trim(),
        idempotencyKey: crypto.randomUUID(),
        stepUpToken: token,
        evidence: {},
      });
      setExecutionPassword("");
      toast.success("Payment Execution released");
      onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const exportFile = async () => {
    try {
      const file = await exportExecution.mutateAsync();
      downloadTextFile(file.filename, file.content, file.media_type);
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium">
              Execution #{execution.execution_number} ·{" "}
              {humanizePaymentValue(execution.method)}
            </div>
            <div className="text-xs text-muted-foreground">
              {execution.instructions.length} instructions · prepared{" "}
              {formatTimestamp(execution.prepared_at)}
            </div>
          </div>
          <Badge variant={paymentInstructionStatusVariant(execution.status)}>
            {humanizePaymentValue(execution.status)}
          </Badge>
        </div>
      </div>

      {execution.status === "PREPARED" ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="batch-reference">External batch reference</Label>
            <Input
              id="batch-reference"
              className="mt-1"
              value={batchReference}
              onChange={(event) => setBatchReference(event.target.value)}
              placeholder="Bank file / portal / operator reference"
            />
          </div>
          <div>
            <Label htmlFor="execution-password">
              Re-authentication password
            </Label>
            <Input
              id="execution-password"
              className="mt-1"
              type="password"
              autoComplete="current-password"
              value={executionPassword}
              onChange={(event) => setExecutionPassword(event.target.value)}
              placeholder="Required when execution risk demands step-up"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={submitExecution.isPending || stepUp.isPending}
              onClick={() => void release()}
            >
              {submitExecution.isPending ? "Releasing…" : "Release execution"}
            </Button>
            {execution.method !== "MANUAL" ? (
              <Button
                variant="outline"
                disabled={exportExecution.isPending}
                onClick={() => void exportFile()}
              >
                Export file
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {execution.instructions.length ? (
        <div className="space-y-3 border-t pt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Instructions
          </div>
          {execution.instructions.map((instruction) => (
            <InstructionPanel
              key={instruction.id}
              orgId={orgId}
              paymentRunId={paymentRunId}
              executionId={execution.id}
              paymentExecutionId={execution.id}
              instruction={instruction}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InstructionPanel({
  orgId,
  paymentRunId,
  executionId,
  paymentExecutionId,
  instruction,
  onChanged,
}: {
  orgId: string;
  paymentRunId: string;
  executionId: string;
  paymentExecutionId: string | null;
  instruction: PaymentInstruction;
  onChanged: () => void | Promise<void>;
}) {
  const result = useRecordInstructionResult(
    orgId,
    paymentRunId,
    paymentExecutionId ?? executionId,
    instruction.id,
  );
  const reconcile = useReconcileInstruction(
    orgId,
    paymentRunId,
    paymentExecutionId ?? executionId,
    instruction.id,
  );
  const [resultStatus, setResultStatus] = useState<
    "DISPATCHED" | "ACCEPTED" | "IN_TRANSIT" | "FAILED" | "REJECTED" | "OUTCOME_UNKNOWN"
  >("DISPATCHED");
  const [resultEvidenceType, setResultEvidenceType] = useState("MANUAL_DISPATCH");
  const [resultReference, setResultReference] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [reconciliationOutcome, setReconciliationOutcome] = useState<
    "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED"
  >("SETTLED");
  const [reconciliationEvidenceType, setReconciliationEvidenceType] =
    useState("BANK_STATEMENT_DEBIT");
  const [reconciliationReference, setReconciliationReference] = useState("");
  const [settlementReference, setSettlementReference] = useState("");

  const resultEvidence = instructionResultEvidenceTypes(resultStatus);
  const reconciliationEvidence = reconciliationEvidenceTypes(
    reconciliationOutcome,
  );

  const recordResult = async () => {
    try {
      await result.mutateAsync({
        status: resultStatus,
        evidence_type:
          resultEvidence.length > 0 ? resultEvidenceType : null,
        external_reference: resultReference.trim() || null,
        failure_reason:
          ["FAILED", "REJECTED"].includes(resultStatus)
            ? failureReason.trim() || null
            : null,
        evidence: {},
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Instruction evidence recorded");
      await onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const recordReconciliation = async () => {
    const now = new Date().toISOString();
    try {
      await reconcile.mutateAsync({
        outcome: reconciliationOutcome,
        evidence_type: reconciliationEvidenceType,
        external_reference: reconciliationReference.trim(),
        evidence_at: now,
        settlement_reference:
          reconciliationOutcome === "SETTLED"
            ? settlementReference.trim()
            : null,
        settled_at: reconciliationOutcome === "SETTLED" ? now : null,
        evidence: {},
        idempotencyKey: crypto.randomUUID(),
      });
      toast.success("Instruction reconciled");
      await onChanged();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const resultWritable = [
    "SUBMITTED",
    "DISPATCHED",
    "ACCEPTED",
    "IN_TRANSIT",
    "OUTCOME_UNKNOWN",
  ].includes(instruction.status);
  const reconcileWritable = [
    "ACCEPTED",
    "IN_TRANSIT",
    "OUTCOME_UNKNOWN",
  ].includes(instruction.status);

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">
            Instruction {shortPaymentId(instruction.id)}
          </div>
          <div className="text-xs text-muted-foreground">
            Destination •••• {instruction.destination_account_number_last4} ·
            attempt {instruction.current_attempt_number}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium tabular-nums">
            {formatMoney(instruction.amount, instruction.currency)}
          </div>
          <Badge variant={paymentInstructionStatusVariant(instruction.status)}>
            {humanizePaymentValue(instruction.status)}
          </Badge>
        </div>
      </div>

      {resultWritable ? (
        <details className="mt-3 rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Record rail result
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <Label>Status</Label>
              <select
                className={selectClassName}
                value={resultStatus}
                onChange={(event) => {
                  const next = event.target.value as typeof resultStatus;
                  setResultStatus(next);
                  setResultEvidenceType(
                    instructionResultEvidenceTypes(next)[0] ?? "",
                  );
                }}
              >
                {[
                  "DISPATCHED",
                  "ACCEPTED",
                  "IN_TRANSIT",
                  "FAILED",
                  "REJECTED",
                  "OUTCOME_UNKNOWN",
                ].map((value) => (
                  <option key={value} value={value}>
                    {humanizePaymentValue(value)}
                  </option>
                ))}
              </select>
            </div>
            {resultEvidence.length ? (
              <div>
                <Label>Evidence type</Label>
                <select
                  className={selectClassName}
                  value={resultEvidenceType}
                  onChange={(event) =>
                    setResultEvidenceType(event.target.value)
                  }
                >
                  {resultEvidence.map((value) => (
                    <option key={value} value={value}>
                      {humanizePaymentValue(value)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <Label>External reference</Label>
              <Input
                className="mt-1"
                value={resultReference}
                onChange={(event) => setResultReference(event.target.value)}
              />
            </div>
            {["FAILED", "REJECTED"].includes(resultStatus) ? (
              <div>
                <Label>Failure reason</Label>
                <Input
                  className="mt-1"
                  value={failureReason}
                  onChange={(event) => setFailureReason(event.target.value)}
                />
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Button
                size="sm"
                disabled={result.isPending}
                onClick={() => void recordResult()}
              >
                Record result
              </Button>
            </div>
          </div>
        </details>
      ) : null}

      {reconcileWritable ? (
        <details className="mt-3 rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Reconcile authoritative outcome
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <Label>Outcome</Label>
              <select
                className={selectClassName}
                value={reconciliationOutcome}
                onChange={(event) => {
                  const next = event.target
                    .value as typeof reconciliationOutcome;
                  setReconciliationOutcome(next);
                  setReconciliationEvidenceType(
                    reconciliationEvidenceTypes(next)[0],
                  );
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
                value={reconciliationEvidenceType}
                onChange={(event) =>
                  setReconciliationEvidenceType(event.target.value)
                }
              >
                {reconciliationEvidence.map((value) => (
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
                value={reconciliationReference}
                onChange={(event) =>
                  setReconciliationReference(event.target.value)
                }
              />
            </div>
            {reconciliationOutcome === "SETTLED" ? (
              <div>
                <Label>Settlement reference</Label>
                <Input
                  className="mt-1"
                  value={settlementReference}
                  onChange={(event) =>
                    setSettlementReference(event.target.value)
                  }
                />
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Button
                size="sm"
                disabled={
                  reconcile.isPending ||
                  !reconciliationReference.trim() ||
                  (reconciliationOutcome === "SETTLED" &&
                    !settlementReference.trim())
                }
                onClick={() => void recordReconciliation()}
              >
                Reconcile
              </Button>
            </div>
          </div>
        </details>
      ) : null}

      {instruction.reconciliations.length ? (
        <div className="mt-3 border-t pt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reconciliation evidence
          </div>
          <div className="mt-2 space-y-2">
            {instruction.reconciliations
              .slice()
              .reverse()
              .map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span>
                    {humanizePaymentValue(row.outcome)} ·{" "}
                    {humanizePaymentValue(row.evidence_type)}
                  </span>
                  <span className="text-muted-foreground">
                    Finance {humanizePaymentValue(row.finance_status)}
                    {row.settlement_reference
                      ? ` · ${row.settlement_reference}`
                      : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
