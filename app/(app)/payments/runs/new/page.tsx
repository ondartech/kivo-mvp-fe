"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { resolvePaymentRunSettlementValuation } from "@/features/fx/api";
import { useOperatingBranches, useOrganization } from "@/features/organization/api";
import {
  addPaymentRunItemCommand,
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
  const organization = useOrganization(orgId);
  const [branchId, setBranchId] = useState(activeBranchId ?? "");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (!branchId && activeBranchId) setBranchId(activeBranchId);
  }, [activeBranchId, branchId]);

  const [fundingAccountId, setFundingAccountId] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const preview = usePreviewPaymentRun(orgId);
  const createRun = useCreatePaymentRun(orgId);
  const bankAccounts = useBankAccounts(orgId);
  const activeAccounts = useMemo(
    () =>
      (bankAccounts.data ?? []).filter(
        (account) =>
          account.status === "ACTIVE" && Boolean(account.holder_legal_entity_id),
      ),
    [bankAccounts.data],
  );
  const availableCurrencies = useMemo(
    () => Array.from(new Set(activeAccounts.map((account) => account.currency))).sort(),
    [activeAccounts],
  );
  const currencyValid = /^[A-Z]{3}$/.test(currency);

  useEffect(() => {
    setCurrency("");
    setFundingAccountId("");
    setSelected({});
    preview.reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (currency || availableCurrencies.length === 0) return;
    const configured = organization.data?.default_currency;
    if (configured && availableCurrencies.includes(configured)) {
      setCurrency(configured);
      return;
    }
    if (availableCurrencies.length === 1) setCurrency(availableCurrencies[0]);
  }, [availableCurrencies, currency, organization.data?.default_currency]);

  const activeBankAccounts = useMemo(
    () => activeAccounts.filter((account) => account.currency === currency),
    [activeAccounts, currency],
  );
  const selectedFundingAccount = useMemo(
    () =>
      activeBankAccounts.find((account) => account.id === fundingAccountId) ?? null,
    [activeBankAccounts, fundingAccountId],
  );
  const payerLegalEntityId = selectedFundingAccount?.holder_legal_entity_id ?? "";

  const openObligations = usePaymentObligations(orgId, {
    status: "OPEN",
    controlStatus: "AVAILABLE",
    branchId: branchId || null,
    limit: 100,
    enabled: currencyValid && Boolean(payerLegalEntityId),
  });
  const partiallySettledObligations = usePaymentObligations(orgId, {
    status: "PARTIALLY_SETTLED",
    controlStatus: "AVAILABLE",
    branchId: branchId || null,
    limit: 100,
    enabled: currencyValid && Boolean(payerLegalEntityId),
  });
  const availableObligations = useMemo(
    () =>
      [
        ...(openObligations.data?.data ?? []),
        ...(partiallySettledObligations.data?.data ?? []),
      ].filter(
        (obligation) => obligation.payer_legal_entity_id === payerLegalEntityId,
      ),
    [
      openObligations.data?.data,
      partiallySettledObligations.data?.data,
      payerLegalEntityId,
    ],
  );

  const selectedItems = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, amount]) => amount.trim().length > 0)
        .map(([payment_obligation_id, obligation_amount]) => ({
          payment_obligation_id,
          obligation_amount,
        }))
        .sort((left, right) =>
          left.payment_obligation_id.localeCompare(right.payment_obligation_id),
        ),
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
    if (!currencyValid) {
      toast.error("Select an execution currency.");
      return;
    }
    if (!fundingAccountId || !payerLegalEntityId) {
      toast.error("Select a funding bank account owned by a payer LegalEntity.");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one Payment Obligation.");
      return;
    }
    try {
      const valuationAsOf = new Date().toISOString();
      const items = [];
      for (const selectedItem of selectedItems) {
        const obligation = availableObligations.find(
          (candidate) =>
            candidate.id === selectedItem.payment_obligation_id,
        );
        if (!obligation) {
          throw new Error(
            "A selected Payment Obligation is no longer available in this payer scope.",
          );
        }
        const snapshot =
          obligation.currency === currency
            ? null
            : await resolvePaymentRunSettlementValuation(orgId, {
                legalEntityId: payerLegalEntityId,
                paymentObligationId: obligation.id,
                paymentObligationVersion: obligation.version,
                sourceCurrency: obligation.currency,
                settlementCurrency: currency,
                asOf: valuationAsOf,
              });
        items.push({
          payment_obligation_id: selectedItem.payment_obligation_id,
          obligation_amount: selectedItem.obligation_amount,
          settlement_valuation_snapshot_id: snapshot?.id ?? null,
        });
      }

      await preview.mutateAsync({
        payer_legal_entity_id: payerLegalEntityId,
        settlement_currency: currency,
        funding_bank_account_id: fundingAccountId,
        scheduled_execution_date: executionDate || null,
        items,
      });
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
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
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
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
            <Label htmlFor="payment-run-currency">Execution currency</Label>
            <select
              id="payment-run-currency"
              className={selectClassName}
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value);
                setFundingAccountId("");
                setSelected({});
                preview.reset();
              }}
            >
              <option value="">Select currency</option>
              {availableCurrencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              One Payment Run uses one execution currency.
            </p>
          </div>
          <div>
            <Label htmlFor="payment-run-funding">Funding account</Label>
            <select
              id="payment-run-funding"
              className={selectClassName}
              value={fundingAccountId}
              onChange={(event) => {
                setFundingAccountId(event.target.value);
                setSelected({});
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

      {!fundingAccountId ? (
        <EmptyState
          title="Select a funding account"
          description="Choose the settlement currency and payer LegalEntity funding account before selecting Payment Obligations. Obligations may be in other currencies."
        />
      ) : (openObligations.isLoading || partiallySettledObligations.isLoading) ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (openObligations.isError || partiallySettledObligations.isError) ? (
        <ErrorState
          title="Payment Obligations unavailable"
          description={
            openObligations.error instanceof Error
              ? openObligations.error.message
              : partiallySettledObligations.error instanceof Error
                ? partiallySettledObligations.error.message
                : "Available obligations could not be loaded."
          }
          retry={{
            label: "Retry",
            onClick: () => {
              void openObligations.refetch();
              void partiallySettledObligations.refetch();
            },
          }}
        />
      ) : availableObligations.length === 0 ? (
        <EmptyState
          title="No available obligations"
          description="There are no open, available Payment Obligations for this payer LegalEntity and Branch scope. Obligation currency may differ from the run settlement currency."
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
                <TableHead className="w-48">Obligation amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableObligations.map((obligation) => {
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
              disabled={preview.isPending || !currencyValid || selectedItems.length === 0}
              onClick={() => void previewRun()}
            >
              {preview.isPending ? "Validating…" : "Preview Payment Run"}
            </Button>
          </div>

          {preview.data ? (
            <div className="mt-5 space-y-4 border-t pt-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Settlement total
                  </div>
                  <div className="text-xl font-semibold tabular-nums">
                    {formatMoney(
                      preview.data.total_settlement_amount,
                      preview.data.settlement_currency,
                    )}
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
                        {formatMoney(item.obligation_amount, item.obligation_currency)}
                      </div>
                      {item.obligation_currency !== item.settlement_currency ? (
                        <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          → {formatMoney(item.settlement_amount, item.settlement_currency)}
                          {" · FX evidence "}
                          {item.settlement_valuation_snapshot_id?.slice(0, 8)}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Same-currency settlement · no FX snapshot
                        </div>
                      )}
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
        payerLegalEntityId={payerLegalEntityId}
        settlementCurrency={currency}
        fundingAccountId={fundingAccountId}
        executionDate={executionDate}
        previewItems={preview.data?.items ?? []}
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
  payerLegalEntityId,
  settlementCurrency,
  fundingAccountId,
  executionDate,
  previewItems,
  creating,
  setCreating,
  router,
  createRun,
}: {
  orgId: string;
  previewReady: boolean;
  previewEligible: boolean;
  name: string;
  payerLegalEntityId: string;
  settlementCurrency: string;
  fundingAccountId: string;
  executionDate: string;
  previewItems: Array<{
    payment_obligation_id: string;
    obligation_amount: string;
    settlement_amount: string;
    settlement_valuation_snapshot_id: string | null;
  }>;
  creating: boolean;
  setCreating: (value: boolean) => void;
  router: ReturnType<typeof useRouter>;
  createRun: ReturnType<typeof useCreatePaymentRun>;
}) {
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
          payer_legal_entity_id: payerLegalEntityId,
          settlement_currency: settlementCurrency,
          funding_bank_account_id: fundingAccountId,
          scheduled_execution_date: executionDate || null,
        },
        idempotencyKey: crypto.randomUUID(),
      });
      createdRunId = run.id;

      for (const item of previewItems) {
        await addPaymentRunItemCommand(orgId, run.id, {
          payment_obligation_id: item.payment_obligation_id,
          obligation_amount: item.obligation_amount,
          settlement_amount: item.settlement_amount,
          settlement_valuation_snapshot_id:
            item.settlement_valuation_snapshot_id,
          idempotencyKey: crypto.randomUUID(),
        });
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

