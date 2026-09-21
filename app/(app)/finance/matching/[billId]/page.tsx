"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useEvaluateSupplierBillMatch,
  useMatchEvaluations,
  useMatchExceptions,
  useMatchReviewQueue,
  useResolveMatchException,
} from "@/features/finance-matching/api";
import {
  billLineDescription,
  formatDecimalText,
  supplierDisplayName,
  type MatchEvaluation,
  type MatchException,
  type MatchLine,
  type MatchResolutionCode,
} from "@/features/finance-matching/schema";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function resultVariant(
  result: string,
): "neutral" | "success" | "warning" | "critical" | "info" {
  if (result === "MATCHED" || result === "NOT_REQUIRED") return "success";
  if (result === "MISMATCH") return "critical";
  if (result === "REVIEW_REQUIRED") return "warning";
  if (result === "PARTIAL_MATCH") return "info";
  return "neutral";
}

function comparisonSignals(line: MatchLine): string[] {
  const comparison = line.comparison;
  const signals: string[] = [];
  if (comparison.price_match === false) signals.push("Price");
  if (comparison.tax_match === false) signals.push("Tax");
  if (comparison.currency_match === false) signals.push("Currency");
  if (comparison.description_match === false) signals.push("Description");
  if (comparison.evidence_shortfall === true) signals.push("Evidence shortfall");
  if (comparison.source_version_stale === true) signals.push("Stale source");
  if (comparison.missing_application === true) signals.push("Unmapped");
  return signals;
}

function EvidencePairs({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value).slice(0, 10);
  if (!entries.length) {
    return (
      <span className="text-xs text-muted-foreground">
        No structured variance details.
      </span>
    );
  }
  return (
    <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
      {entries.map(([key, item]) => (
        <div key={key} className="flex min-w-0 justify-between gap-3">
          <dt className="truncate text-muted-foreground">
            {key.replaceAll("_", " ")}
          </dt>
          <dd className="max-w-[60%] truncate text-right font-medium">
            {item === null
              ? "—"
              : typeof item === "object"
                ? JSON.stringify(item)
                : String(item)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ExceptionResolution({
  exception,
  evaluation,
  organizationId,
  billId,
}: {
  exception: MatchException;
  evaluation: MatchEvaluation;
  organizationId: string;
  billId: string;
}) {
  const [code, setCode] = useState<MatchResolutionCode>("ACCEPT_VARIANCE");
  const [reason, setReason] = useState("");
  const [completed, setCompleted] = useState(false);
  const resolve = useResolveMatchException(organizationId, billId);

  const canResolve =
    exception.status === "OPEN" &&
    exception.current_bill_version &&
    exception.current_evaluation;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canResolve || reason.trim().length < 3) return;
    resolve.mutate(
      {
        exceptionId: exception.id,
        expectedBillVersion: evaluation.bill_version,
        expectedEvaluationHash: evaluation.evaluation_hash,
        resolutionCode: code,
        reason,
      },
      {
        onSuccess: () => {
          setCompleted(true);
          setReason("");
        },
      },
    );
  };

  if (!canResolve) {
    return (
      <div className="mt-3 rounded-md border bg-neutral-50 p-3 text-xs text-muted-foreground">
        Historical evidence only. Resolve against the current Bill version and
        current evaluation.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-2 rounded-md border bg-neutral-50 p-3"
    >
      <div className="grid gap-2 sm:grid-cols-[14rem_1fr_auto]">
        <select
          value={code}
          onChange={(event) =>
            setCode(event.target.value as MatchResolutionCode)
          }
          className="h-9 rounded-md border bg-surface px-3 text-sm"
          aria-label="Resolution code"
        >
          <option value="ACCEPT_VARIANCE">Accept variance</option>
          <option value="CONFIRM_REFERENCE">Confirm reference</option>
          <option value="DUPLICATE_REVIEWED">Duplicate reviewed</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setCompleted(false);
          }}
          className="h-9 rounded-md border bg-surface px-3 text-sm"
          placeholder="Resolution reason"
          aria-label="Resolution reason"
        />
        <Button
          size="sm"
          type="submit"
          loading={resolve.isPending}
          disabled={reason.trim().length < 3}
        >
          Resolve
        </Button>
      </div>
      {resolve.isError ? (
        <p className="text-xs text-critical">{resolve.error.message}</p>
      ) : completed ? (
        <p className="text-xs text-success">Resolution evidence recorded.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          This records review evidence; it does not mutate the Bill, Order,
          receipt, or match facts.
        </p>
      )}
    </form>
  );
}

export default function SupplierBillMatchReviewPage() {
  const params = useParams<{ billId: string }>();
  const billId = params.billId;
  const organizationId = useActiveOrganizationId();
  const queue = useMatchReviewQueue(organizationId ?? "");
  const evaluations = useMatchEvaluations(organizationId ?? "", billId);
  const latest = evaluations.data?.data[0];
  const exceptions = useMatchExceptions(
    organizationId ?? "",
    billId,
    latest?.id,
  );
  const evaluate = useEvaluateSupplierBillMatch(
    organizationId ?? "",
    billId,
  );

  const bill = queue.data?.data.find(
    (item) => item.supplier_bill_id === billId,
  );

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before reviewing Supplier Bill matching."
      />
    );
  }

  const loading = queue.isLoading || evaluations.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance · Match review"
        title={bill ? bill.bill_number : "Supplier Bill match review"}
        description={
          bill
            ? `${supplierDisplayName(
                bill.supplier_snapshot,
              )} · Supplier invoice ${bill.supplier_invoice_number}`
            : `Supplier Bill ${billId}`
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/app/finance/matching">Back to queue</Link>
            </Button>
            {bill ? (
              <Button
                loading={evaluate.isPending}
                disabled={!["RECEIVED", "UNDER_REVIEW"].includes(bill.bill_status)}
                onClick={() => evaluate.mutate(bill.bill_version)}
              >
                {latest ? "Re-run match" : "Run match"}
              </Button>
            ) : null}
          </div>
        }
      />

      {evaluate.isError ? (
        <ErrorState
          title="Match evaluation failed"
          description={evaluate.error.message}
        />
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : evaluations.isError ? (
        <ErrorState
          title="Match evidence unavailable"
          description={evaluations.error.message}
          retry={{ label: "Retry", onClick: () => void evaluations.refetch() }}
        />
      ) : !latest ? (
        <EmptyState
          title="No match evaluation yet"
          description={
            "Run the deterministic match engine to compare this Supplier Bill " +
            "with its Purchase Order and receipt or service-acceptance evidence."
          }
          action={
            bill
              ? {
                  label: "Run match",
                  onClick: () => evaluate.mutate(bill.bill_version),
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Result
                </div>
                <div className="mt-2">
                  <Badge variant={resultVariant(latest.result)}>
                    {latest.result.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Match mode
                </div>
                <div className="mt-1 font-semibold">
                  {latest.match_mode.replaceAll("_", " ")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Open exceptions
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {exceptions.data?.data.filter((item) => item.status === "OPEN").length ?? "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Bill value
                </div>
                <div className="mt-1 font-semibold tabular-nums">
                  {bill
                    ? formatMoney(bill.grand_total, bill.currency)
                    : String(latest.summary.bill_grand_total ?? "—")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Version {latest.bill_version}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Line-by-line comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Quantities and comparison outcomes are server-derived. The
                frontend does not recompute financial truth.
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill line</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received / accepted</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead>Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latest.line_results.map((line) => {
                    const signals = comparisonSignals(line);
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">
                            {billLineDescription(line)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Applied {formatDecimalText(line.applied_quantity)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalText(line.ordered_quantity)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalText(line.evidence_quantity)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDecimalText(line.billed_quantity)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={resultVariant(line.result)}>
                            {line.result.replaceAll("_", " ")}
                          </Badge>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {signals.length
                              ? signals.join(" · ")
                              : "No deterministic variance"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exceptions and resolution evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exceptions.isLoading ? (
                <>
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </>
              ) : exceptions.isError ? (
                <ErrorState
                  title="Exceptions unavailable"
                  description={exceptions.error.message}
                  retry={{
                    label: "Retry",
                    onClick: () => void exceptions.refetch(),
                  }}
                />
              ) : exceptions.data?.data.length ? (
                exceptions.data.data.map((exception) => (
                  <div key={exception.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          exception.status === "RESOLVED"
                            ? "success"
                            : exception.material
                              ? "critical"
                              : "warning"
                        }
                      >
                        {exception.exception_type.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="neutral">{exception.status}</Badge>
                      {exception.material ? (
                        <span className="text-xs font-medium text-critical">
                          Material
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Reviewable
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <EvidencePairs value={exception.variance} />
                    </div>
                    {exception.status === "RESOLVED" ? (
                      <div className="mt-3 rounded-md border bg-neutral-50 p-3 text-sm">
                        <div className="font-medium">
                          {(exception.resolution_code ?? "Resolved").replaceAll(
                            "_",
                            " ",
                          )}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {exception.resolution_reason}
                        </div>
                      </div>
                    ) : (
                      <ExceptionResolution
                        exception={exception}
                        evaluation={latest}
                        organizationId={organizationId}
                        billId={billId}
                      />
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No exceptions"
                  description="The current evaluation has no reviewable exception records."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-md border">
                {evaluations.data?.data.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
                  >
                    <div>
                      <Badge variant={resultVariant(evaluation.result)}>
                        {evaluation.result.replaceAll("_", " ")}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">
                        {evaluation.match_mode.replaceAll("_", " ")} · Bill v
                        {evaluation.bill_version}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(evaluation.created_at).toLocaleString("en-NG")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
