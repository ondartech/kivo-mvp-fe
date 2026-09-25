"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/kivo/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import {
  useReconcileTaxReserve,
  useTaxReserveBankAccounts,
  useTaxReservePolicy,
  useTaxReservePosition,
  useUpsertTaxReservePolicy,
} from "./api";
import {
  humanizeTaxValue,
  isTaxReserveEligibleBankAccount,
  type TaxReservePolicyStatus,
} from "./schema";

const selectClassName =
  "mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function mutationMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function TaxTreasuryReservePanel({
  organizationId,
}: {
  organizationId: string;
}) {
  const accounts = useTaxReserveBankAccounts(organizationId);
  const policy = useTaxReservePolicy(organizationId);
  const position = useTaxReservePosition(organizationId, Boolean(policy.data));
  const savePolicy = useUpsertTaxReservePolicy(organizationId);
  const reconcile = useReconcileTaxReserve(organizationId);
  const [destinationId, setDestinationId] = useState("");
  const [status, setStatus] = useState<TaxReservePolicyStatus>("PAUSED");

  useEffect(() => {
    if (!policy.data) return;
    setDestinationId(policy.data.destination.bank_account_id);
    setStatus(policy.data.status);
  }, [policy.data]);

  const accountOptions = useMemo(() => accounts.data ?? [], [accounts.data]);
  const selectedAccount = accountOptions.find(
    (account) => account.id === destinationId,
  );
  const selectedEligible = selectedAccount
    ? isTaxReserveEligibleBankAccount(selectedAccount)
    : false;

  const submitPolicy = async () => {
    if (!destinationId) {
      toast.error("Choose a bank account for the tax reserve.");
      return;
    }
    if (status === "ACTIVE" && !selectedEligible) {
      toast.error("An active reserve policy requires an active, verified bank account.");
      return;
    }
    try {
      await savePolicy.mutateAsync({
        destination_bank_account_id: destinationId,
        status,
      });
      toast.success("Tax reserve policy saved");
    } catch (error: unknown) {
      toast.error(mutationMessage(error, "Tax reserve policy could not be saved"));
    }
  };

  const runReconcile = async () => {
    try {
      const instruction = await reconcile.mutateAsync();
      toast.success(
        "Reserve target refreshed: " +
          formatMoney(instruction.target_reserve_balance, instruction.currency),
      );
    } catch (error: unknown) {
      toast.error(mutationMessage(error, "Tax reserve reconciliation failed"));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-medium">Tax reserve & segregation</div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Maintain a segregated cash target for posted tax liabilities. Ondar
              derives the target from the posted General Ledger; the browser never
              calculates tax reserve amounts.
            </p>
          </div>
          {policy.data ? (
            <Badge variant={policy.data.status === "ACTIVE" ? "success" : "warning"}>
              {humanizeTaxValue(policy.data.status)}
            </Badge>
          ) : (
            <Badge variant="neutral">Not configured</Badge>
          )}
        </div>

        {policy.isLoading || accounts.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : policy.isError ? (
          <ErrorState
            title="Tax reserve policy unavailable"
            description={policy.error.message}
            retry={{ label: "Retry", onClick: () => void policy.refetch() }}
          />
        ) : accounts.isError ? (
          <ErrorState
            title="Bank accounts unavailable"
            description={accounts.error.message}
            retry={{ label: "Retry", onClick: () => void accounts.refetch() }}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="tax-reserve-account">Segregated bank account</Label>
                <select
                  id="tax-reserve-account"
                  className={selectClassName}
                  value={destinationId}
                  onChange={(event) => setDestinationId(event.target.value)}
                >
                  <option value="">Choose bank account</option>
                  {accountOptions.map((account) => {
                    const eligible = isTaxReserveEligibleBankAccount(account);
                    return (
                      <option
                        key={account.id}
                        value={account.id}
                        disabled={!eligible && account.id !== policy.data?.destination.bank_account_id}
                      >
                        {account.bank_name +
                          " · " +
                          account.account_name +
                          " ·•••• " +
                          account.account_number_last4 +
                          " · " +
                          account.currency +
                          (eligible ? "" : " · not ready")}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Activation requires an ACTIVE, VERIFIED account. Currency compatibility
                  with the Finance base currency is enforced by the backend.
                </p>
              </div>
              <div>
                <Label htmlFor="tax-reserve-status">Automation status</Label>
                <select
                  id="tax-reserve-status"
                  className={selectClassName}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as TaxReservePolicyStatus)
                  }
                >
                  <option value="PAUSED">Paused</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </div>
            </div>

            {accountOptions.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                No organization bank accounts are available. Add and verify a bank
                account before activating tax reserve automation.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void submitPolicy()}
                loading={savePolicy.isPending}
                disabled={!destinationId}
              >
                Save reserve policy
              </Button>
              {policy.data?.status === "ACTIVE" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void runReconcile()}
                  loading={reconcile.isPending}
                >
                  Reconcile reserve target
                </Button>
              ) : null}
            </div>
          </>
        )}

        {policy.data ? (
          position.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : position.isError ? (
            <ErrorState
              title="Reserve position unavailable"
              description={position.error.message}
              retry={{ label: "Retry", onClick: () => void position.refetch() }}
            />
          ) : position.data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">
                    Required reserve balance
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatMoney(
                      position.data.target_reserve_balance,
                      position.data.base_currency,
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Gross positive tax liabilities · as of {position.data.as_of_date}
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Instruction</div>
                  <div className="mt-1">
                    <Badge
                      variant={position.data.instruction_current ? "success" : "warning"}
                    >
                      {position.data.instruction_current ? "Current" : "Refresh required"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {humanizeTaxValue(position.data.execution_semantics)}
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-xs text-muted-foreground">Ledger coverage</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        position.data.coverage.posting_coverage === "COMPLETE"
                          ? "success"
                          : "critical"
                      }
                    >
                      {humanizeTaxValue(position.data.coverage.posting_coverage)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {position.data.coverage.ledger_authority.replaceAll("_", " ")}
                  </div>
                </div>
              </div>

              {position.data.coverage.warnings.length ? (
                <div className="rounded-md border border-warning/30 bg-warning-subtle p-3 text-sm">
                  {position.data.coverage.warnings.map((warning) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              ) : null}

              {position.data.latest_instruction ? (
                <div className="rounded-md border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">Latest reserve instruction</div>
                    <Badge
                      variant={
                        position.data.latest_instruction.status ===
                        "PENDING_EXTERNAL_EXECUTION"
                          ? "info"
                          : "neutral"
                      }
                    >
                      {humanizeTaxValue(position.data.latest_instruction.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Target</div>
                      <div className="mt-0.5 font-medium">
                        {formatMoney(
                          position.data.latest_instruction.target_reserve_balance,
                          position.data.latest_instruction.currency,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Position period</div>
                      <div className="mt-0.5">
                        {position.data.latest_instruction.position_from_date +
                          " → " +
                          position.data.latest_instruction.position_to_date}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Destination</div>
                      <div className="mt-0.5">
                        {policy.data.destination.bank_name +
                          " · •••• " +
                          policy.data.destination.account_number_last4}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No reserve instruction exists yet. When the policy is active,
                  reconciliation materializes the current ledger-derived target.
                </div>
              )}

              <div className="rounded-md border p-4">
                <div className="font-medium">Execution authority</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  External treasury execution is required. Ondar currently records
                  the minimum balance instruction and evidence; it does not move money
                  between your bank accounts.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="info">
                    {humanizeTaxValue(position.data.execution_authority)}
                  </Badge>
                  <Badge variant="neutral">Cash releases not authorized</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  A lower target never authorizes Ondar to release funds from the
                  segregated account. Actual movement requires a future authoritative
                  treasury/bank rail and fresh instruction-currentness checks.
                </p>
              </div>
            </>
          ) : null
        ) : (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Configure a reserve destination to start tracking the posted-ledger tax
            reserve target.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
