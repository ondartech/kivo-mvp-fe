"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
import { useOperatingBranches } from "@/features/organization/api";
import {
  useBankAccounts,
  useBuildPaymentRun,
  usePaymentObligations,
  usePreviewPaymentRun,
} from "@/features/payment-operations/api";
import { resolvePaymentReadScope } from "@/features/payment-operations/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function NewPaymentRunPage() {
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId, {
    permissionCode: "payment_runs:write",
  });
  const scope = resolvePaymentReadScope(branchAccess.data, activeBranchId);
  const obligations = usePaymentObligations(orgId, {
    controlStatus: "AVAILABLE",
    branchId: scope.branchId,
    currency: "NGN",
    limit: 100,
  });
  const banks = useBankAccounts(orgId);
  const preview = usePreviewPaymentRun(orgId);
  const build = useBuildPaymentRun(orgId);

  const [name, setName] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [fundingAccountId, setFundingAccountId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const eligibleRows = useMemo(
    () =>
      (obligations.data?.data ?? []).filter((item) =>
        ["OPEN", "PARTIALLY_SETTLED"].includes(item.status),
      ),
    [obligations.data?.data],
  );
  const activeBanks = (banks.data ?? []).filter(
    (account) => account.status === "ACTIVE" && account.currency === "NGN",
  );

  const selectedItems = [...selected].map((id) => {
    const obligation = eligibleRows.find((item) => item.id === id);
    return {
      payment_obligation_id: id,
      amount: amounts[id] ?? obligation?.outstanding_amount ?? "0",
    };
  });

  function toggle(id: string, outstanding: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setAmounts((values) => ({ ...values, [id]: values[id] ?? outstanding }));
      }
      return next;
    });
    preview.reset();
  }

  async function review() {
    if (!fundingAccountId || selectedItems.length === 0) return;
    await preview.mutateAsync({
      currency: "NGN",
      funding_bank_account_id: fundingAccountId,
      scheduled_execution_date: executionDate || undefined,
      items: selectedItems,
    });
  }

  async function createRun() {
    if (!preview.data || preview.data.items.some((item) => !item.eligible)) return;
    try {
      const run = await build.mutateAsync({
        run: {
          name: name.trim() || undefined,
          currency: "NGN",
          funding_bank_account_id: fundingAccountId,
          scheduled_execution_date: executionDate || undefined,
        },
        items: selectedItems,
      });
      router.push(`/app/payments/runs/${run.id}`);
    } catch (error) {
      const partialId =
        typeof error === "object" &&
        error !== null &&
        "paymentRunId" in error &&
        typeof error.paymentRunId === "string"
          ? error.paymentRunId
          : null;
      if (partialId) {
        router.push(`/app/payments/runs/${partialId}`);
      }
    }
  }

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before creating a Payment Run."
      />
    );
  }

  if (scope.selectionRequired) {
    return (
      <EmptyState
        title="Choose an operating Branch"
        description="Your Payment Run authority is Branch-scoped. Select an authorized Branch first."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments · New run"
        title="Prepare payment run"
        description="Select currently eligible obligations, allocate amounts and ask the server to preview reservation availability and approval authority before creating the draft."
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/payments/runs">Cancel</Link>
          </Button>
        }
      />
      <PaymentOperationsNav />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="run-name">Run name</Label>
                <Input
                  id="run-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    preview.reset();
                  }}
                  placeholder="Friday supplier run"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="execution-date">Planned execution date</Label>
                <Input
                  id="execution-date"
                  type="date"
                  value={executionDate}
                  onChange={(event) => {
                    setExecutionDate(event.target.value);
                    preview.reset();
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="funding-account">Funding account</Label>
                <select
                  id="funding-account"
                  className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm"
                  value={fundingAccountId}
                  onChange={(event) => {
                    setFundingAccountId(event.target.value);
                    preview.reset();
                  }}
                >
                  <option value="">Choose funding account</option>
                  {activeBanks.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} · {account.account_name} · ••••
                      {account.account_number_last4}
                      {account.is_default ? " · Default" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="border-b p-5">
                <div className="font-medium">Eligible obligations</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Available obligations are candidates only. The preview and create
                  commands re-check reservations and policy authority on the server.
                </p>
              </div>
              {obligations.isLoading ? (
                <div className="space-y-2 p-5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                  ))}
                </div>
              ) : obligations.isError ? (
                <div className="p-5">
                  <ErrorState
                    title="Eligible obligations unavailable"
                    description={
                      obligations.error instanceof Error
                        ? obligations.error.message
                        : "The request failed."
                    }
                    retry={{
                      label: "Retry",
                      onClick: () => void obligations.refetch(),
                    }}
                  />
                </div>
              ) : eligibleRows.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No eligible obligations"
                    description="There are no available open obligations in the current scope."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Use</TableHead>
                      <TableHead>Obligation</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="w-44">Run amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleRows.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggle(item.id, item.outstanding_amount)}
                            aria-label={`Select ${item.obligation_type}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {item.obligation_type.replaceAll("_", " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.source_type.replaceAll("_", " ")} ·{" "}
                            {item.id.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell>{item.due_date ?? "Undated"}</TableCell>
                        <TableCell className="text-right">
                          <MoneyAmount
                            amount={item.outstanding_amount}
                            currency={item.currency}
                            emphasis="table"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={amounts[item.id] ?? item.outstanding_amount}
                            disabled={!selected.has(item.id)}
                            inputMode="decimal"
                            onChange={(event) => {
                              setAmounts((values) => ({
                                ...values,
                                [item.id]: event.target.value,
                              }));
                              preview.reset();
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Run review
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {selected.size} selected
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Amount and approval totals remain unset until the server preview
                validates the selection.
              </p>

              <Button
                className="mt-4 w-full"
                variant="secondary"
                loading={preview.isPending}
                disabled={!fundingAccountId || selected.size === 0}
                onClick={() => void review()}
              >
                Review with server authority
              </Button>

              {preview.isError ? (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <div className="font-medium">Preview blocked</div>
                  <div className="mt-1 text-muted-foreground">
                    {preview.error instanceof Error
                      ? preview.error.message
                      : "The run could not be previewed."}
                  </div>
                </div>
              ) : null}

              {preview.data ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Authoritative preview total
                    </div>
                    <MoneyAmount
                      amount={preview.data.total_amount}
                      currency={preview.data.currency}
                      emphasis="primary"
                      className="mt-1 block"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Approval path
                    </div>
                    {preview.data.approval_path.required ? (
                      <div className="mt-1 space-y-1">
                        <div className="font-medium">
                          {preview.data.approval_path.required_approvals ?? 1} ×{" "}
                          {preview.data.approval_path.required_role ?? "Approver"}
                        </div>
                        <Badge variant="warning">
                          {preview.data.approval_path.control_mode?.replaceAll(
                            "_",
                            " ",
                          ) ?? "Approval required"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="success">No matching approval rule</Badge>
                    )}
                  </div>
                  {preview.data.items.some((item) => !item.beneficiary_ready) ? (
                    <div className="rounded-md border p-3 text-sm">
                      <div className="font-medium">Beneficiary work remains</div>
                      <p className="mt-1 text-muted-foreground">
                        One or more items still need a verified execution destination
                        before execution can be prepared.
                      </p>
                    </div>
                  ) : null}
                  {preview.data.warnings.length ? (
                    <div className="flex flex-wrap gap-2">
                      {preview.data.warnings.map((warning) => (
                        <Badge
                          key={warning}
                          variant={
                            warning === "ONE_OR_MORE_ITEMS_INELIGIBLE"
                              ? "critical"
                              : "warning"
                          }
                        >
                          {warning.replaceAll("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <Button
                    className="w-full"
                    loading={build.isPending}
                    disabled={preview.data.items.some((item) => !item.eligible)}
                    onClick={() => void createRun()}
                  >
                    Create draft run
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
