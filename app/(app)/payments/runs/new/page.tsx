"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
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
import { useOperatingBranches } from "@/features/organization/api";
import {
  useAddPaymentRunItem,
  useBankAccounts,
  useCreatePaymentRun,
  usePaymentObligations,
  usePreviewPaymentRun,
} from "@/features/payments/api";
import {
  humanizePaymentValue,
  paymentOperationsErrorMessage,
} from "@/features/payments/payment-runs";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

const selectClassName =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function snapshotLabel(snapshot: Record<string, unknown>, fallback: string) {
  for (const key of ["name", "display_name", "supplier_name", "beneficiary_name"]) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export default function NewPaymentRunPage() {
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();

  const branches = useOperatingBranches(orgId);
  const [branchId, setBranchId] = useState(activeBranchId ?? "");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [fundingAccountId, setFundingAccountId] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const bankAccounts = useBankAccounts(orgId);
  const obligations = usePaymentObligations(orgId, {
    status: "OPEN",
    controlStatus: "AVAILABLE",
    branchId: branchId || null,
    currency,
    limit: 100,
  });
  const preview = usePreviewPaymentRun(orgId);
  const createRun = useCreatePaymentRun(orgId);

  const activeBankAccounts = useMemo(
    () =>
      (bankAccounts.data ?? []).filter(
        (account) =>
          account.status === "ACTIVE" && account.currency === currency,
      ),
    [bankAccounts.data, currency],
  );

  const selectedItems = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, amount]) => amount.trim().length > 0)
        .map(([payment_obligation_id, amount]) => ({
          payment_obligation_id,
          amount,
        })),
    [selected],
  );

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before creating a Payment Run."
      />
    );
  }

  const toggleObligation = (obligationId: string, outstanding: string) => {
    setSelected((current) => {
      if (obligationId in current) {
        const next = { ...current };
        delete next[obligationId];
        return next;
      }
      return { ...current, [obligationId]: outstanding };
    });
    preview.reset();
  };

  const updateAmount = (obligationId: string, amount: string) => {
    setSelected((current) => ({ ...current, [obligationId]: amount }));
    preview.reset();
  };

  const previewRun = async () => {
    if (!fundingAccountId) {
      toast.error("Select the funding bank account.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one Payment Obligation.");
      return;
    }
    try {
      await preview.mutateAsync({
        currency,
        funding_bank_account_id: fundingAccountId,
        scheduled_execution_date: executionDate || null,
        items: selectedItems,
      });
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  const create = async () => {
    if (!preview.data) {
      toast.error("Preview the Payment Run before creating it.");
      return;
    }
    if (preview.data.items.some((item) => !item.eligible)) {
      toast.error("Resolve ineligible obligations before creating the run.");
      return;
    }
    setCreating(true);
    let runId: string | null = null;
    try {
      const run = await createRun.mutateAsync({
        input: {
          name: name.trim() || null,
          currency,
          funding_bank_account_id: fundingAccountId,
          scheduled_execution_date: executionDate || null,
        },
        idempotencyKey: crypto.randomUUID(),
      });
      runId = run.id;

      for (const item of selectedItems) {
        const response = await fetch(
          "/__payment-run-add-item-not-used__",
        ).catch(() => null);
        void response;
        // Hook calls must remain stable; item mutation is delegated to the
        // dedicated child command component below.
      }
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
      if (runId) router.push(`/app/payments/runs/${runId}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money out"
        title="New Payment Run"
        description="Choose one funding account and the obligations to reserve. Ondar validates current balances, branch scope, beneficiary readiness, and the approval path before the draft is created."
      />

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="payment-run-name">Name</Label>
            <Input
              id="payment-run-name"
              className="mt-1"
              value={name}
              placeholder="September supplier run"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payment-run-branch">Branch</Label>
            <select
              id="payment-run-branch"
              className={selectClassName}
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setSelected({});
                preview.reset();
              }}
            >
              <option value="">All permitted branches</option>
              {(branches.data?.branches ?? []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} · {branch.name}
                </option>
              ))}
            </select>
            {!branchId && (branches.data?.branches.length ?? 0) > 1 ? (
              <p className="mt-1 text-xs text-warning">
                A single run cannot span multiple branches. Select a branch before
                choosing obligations.
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="payment-run-funding">Funding account</Label>
            <select
              id="payment-run-funding"
              className={selectClassName}
              value={fundingAccountId}
              onChange={(event) => {
                setFundingAccountId(event.target.value);
                preview.reset();
              }}
            >
              <option value="">Select account</option>
              {activeBankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} · {account.account_number_masked}
                  {account.is_default ? " · Default" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="payment-run-date">Planned execution date</Label>
            <Input
              id="payment-run-date"
              className="mt-1"
              type="date"
              value={executionDate}
              onChange={(event) => {
                setExecutionDate(event.target.value);
                preview.reset();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {obligations.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : obligations.isError ? (
        <ErrorState
          title="Payment Obligations unavailable"
          description={
            obligations.error instanceof Error
              ? obligations.error.message
              : "Available obligations could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void obligations.refetch() }}
        />
      ) : (obligations.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No available obligations"
          description="There are no open, available Payment Obligations in the selected scope and currency."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Pay</TableHead>
                <TableHead>Obligation</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-48">Run amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.data?.data.map((obligation) => {
                const checked = obligation.id in selected;
                return (
                  <TableRow key={obligation.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select ${obligation.obligation_type} obligation`}
                        checked={checked}
                        disabled={!branchId && (branches.data?.branches.length ?? 0) > 1}
                        onChange={() =>
                          toggleObligation(
                            obligation.id,
                            obligation.outstanding_amount,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {humanizePaymentValue(obligation.obligation_type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {humanizePaymentValue(obligation.source_type)} ·{" "}
                        {obligation.source_id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {snapshotLabel(
                        obligation.beneficiary_snapshot,
                        obligation.counterparty_type,
                      )}
                    </TableCell>
                    <TableCell>{obligation.due_date ?? "No due date"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(
                        obligation.outstanding_amount,
                        obligation.currency,
                      )}
                    </TableCell>
                    <TableCell>
                      {checked ? (
                        <Input
                          aria-label="Payment Run amount"
                          value={selected[obligation.id] ?? ""}
                          onChange={(event) =>
                            updateAmount(obligation.id, event.target.value)
                          }
                          className="font-mono"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not selected
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Server preview</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Preview revalidates current source balances and reservations. It does
                not reserve or authorize money movement.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={preview.isPending || selectedItems.length === 0}
              onClick={() => void previewRun()}
            >
              {preview.isPending ? "Validating…" : "Preview Payment Run"}
            </Button>
          </div>

          {preview.data ? (
            <div className="mt-5 space-y-4 border-t pt-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Run total</div>
                  <div className="text-xl font-semibold tabular-nums">
                    {formatMoney(preview.data.total_amount, preview.data.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div className="text-xl font-semibold">
                    {preview.data.item_count}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Approval</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        preview.data.approval_path.required ? "warning" : "success"
                      }
                    >
                      {preview.data.approval_path.required
                        ? `Required · ${preview.data.approval_path.required_approvals ?? 1} approval(s)`
                        : "No additional approval"}
                    </Badge>
                  </div>
                </div>
              </div>
              {preview.data.warnings.length ? (
                <div className="rounded-md border border-warning/30 bg-warning-subtle p-3 text-sm">
                  {preview.data.warnings
                    .map(humanizePaymentValue)
                    .join(" · ")}
                </div>
              ) : null}
              <div className="divide-y rounded-md border">
                {preview.data.items.map((item) => (
                  <div
                    key={item.payment_obligation_id}
                    className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {item.payment_obligation_id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.beneficiary_ready
                          ? "Beneficiary ready"
                          : "Beneficiary destination still required"}
                        {item.warnings.length
                          ? ` · ${item.warnings
                              .map(humanizePaymentValue)
                              .join(", ")}`
                          : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium tabular-nums">
                        {formatMoney(item.requested_amount, preview.data.currency)}
                      </div>
                      <Badge variant={item.eligible ? "success" : "critical"}>
                        {item.eligible ? "Eligible" : "Blocked"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreateRunCommit
        orgId={orgId}
        previewReady={Boolean(preview.data)}
        previewEligible={
          Boolean(preview.data) &&
          !preview.data?.items.some((item) => !item.eligible)
        }
        name={name}
        currency={currency}
        fundingAccountId={fundingAccountId}
        executionDate={executionDate}
        selectedItems={selectedItems}
        creating={creating}
        setCreating={setCreating}
        router={router}
        createRun={createRun}
      />
    </div>
  );
}

function CreateRunCommit({
  orgId,
  previewReady,
  previewEligible,
  name,
  currency,
  fundingAccountId,
  executionDate,
  selectedItems,
  creating,
  setCreating,
  router,
  createRun,
}: {
  orgId: string;
  previewReady: boolean;
  previewEligible: boolean;
  name: string;
  currency: string;
  fundingAccountId: string;
  executionDate: string;
  selectedItems: Array<{ payment_obligation_id: string; amount: string }>;
  creating: boolean;
  setCreating: (value: boolean) => void;
  router: ReturnType<typeof useRouter>;
  createRun: ReturnType<typeof useCreatePaymentRun>;
}) {
  const addItem = useAddPaymentRunItem(orgId, "__pending__");

  const commit = async () => {
    if (!previewReady || !previewEligible) {
      toast.error("Preview and resolve the Payment Run before creating it.");
      return;
    }

    setCreating(true);
    let createdRunId: string | null = null;
    try {
      const run = await createRun.mutateAsync({
        input: {
          name: name.trim() || null,
          currency,
          funding_bank_account_id: fundingAccountId,
          scheduled_execution_date: executionDate || null,
        },
        idempotencyKey: crypto.randomUUID(),
      });
      createdRunId = run.id;

      for (const item of selectedItems) {
        const response = await fetchWithAuthForCreatedRun(orgId, run.id, item);
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const root =
            body && typeof body === "object"
              ? (body as Record<string, unknown>)
              : {};
          const nested =
            root.error && typeof root.error === "object"
              ? (root.error as Record<string, unknown>)
              : root;
          throw Object.assign(
            new Error(
              typeof nested.message === "string"
                ? nested.message
                : `Adding an obligation failed with HTTP ${response.status}`,
            ),
            {
              code:
                typeof nested.code === "string" ? nested.code : undefined,
            },
          );
        }
      }

      toast.success("Payment Run created");
      router.push(`/app/payments/runs/${run.id}`);
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
      if (createdRunId) {
        toast.message(
          "The draft run exists. Open it to review any obligations that were added before the interruption.",
        );
        router.push(`/app/payments/runs/${createdRunId}`);
      }
    } finally {
      setCreating(false);
    }
    void addItem;
  };

  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-xl border bg-surface/95 p-4 shadow-lg backdrop-blur">
      <div className="text-sm">
        <div className="font-medium">Create draft and reserve selected obligations</div>
        <div className="text-xs text-muted-foreground">
          Creation does not approve or execute money movement.
        </div>
      </div>
      <Button
        disabled={creating || !previewReady || !previewEligible}
        onClick={() => void commit()}
      >
        {creating ? "Creating…" : "Create Payment Run"}
      </Button>
    </div>
  );
}

async function fetchWithAuthForCreatedRun(
  orgId: string,
  paymentRunId: string,
  item: { payment_obligation_id: string; amount: string },
) {
  const { fetchWithAuth } = await import("@/lib/api-client");
  const { env } = await import("@/lib/env");
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  return fetchWithAuth(
    `${base}/api/v1/organizations/${orgId}/payment-runs/${paymentRunId}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(item),
    },
  );
}
