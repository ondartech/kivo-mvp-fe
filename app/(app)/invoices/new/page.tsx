"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/api";
import { useCreateInvoice } from "@/features/invoicing/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function localDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultDates(): { issueDate: string; dueDate: string } {
  const issue = new Date();
  const due = new Date(issue);
  due.setDate(due.getDate() + 14);
  return {
    issueDate: localDateValue(issue),
    dueDate: localDateValue(due),
  };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const organizationId = useActiveOrganizationId();
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(organizationId ?? "");
  const customers = useCustomers(organizationId ?? "", {
    status: "ACTIVE",
    limit: 100,
  });
  const createInvoice = useCreateInvoice(organizationId ?? "");

  const initialDates = useMemo(() => defaultDates(), []);
  const [mode, setMode] = useState<"quick" | "standard">("quick");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [issueDate, setIssueDate] = useState(initialDates.issueDate);
  const [dueDate, setDueDate] = useState(initialDates.dueDate);

  const branches = branchAccess.data?.branches ?? [];
  const customerRows = customers.data?.data ?? [];

  useEffect(() => {
    if (!branches.length) {
      setSelectedBranchId("");
      return;
    }
    const allowed = new Set(branches.map((branch) => branch.id));
    if (selectedBranchId && allowed.has(selectedBranchId)) return;
    if (activeBranchId && allowed.has(activeBranchId)) {
      setSelectedBranchId(activeBranchId);
      return;
    }
    if (branches.length === 1) {
      setSelectedBranchId(branches[0].id);
      return;
    }
    setSelectedBranchId("");
  }, [activeBranchId, branches, selectedBranchId]);

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before creating an invoice."
      />
    );
  }

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ?? null;
  const branchRequired = branches.length > 1 && !selectedBranchId;
  const lineAmount = mode === "quick" ? amount : unitPrice;

  const saveDraft = () => {
    if (!customerId || !description.trim() || branchRequired) return;

    createInvoice.mutate(
      {
        branch_id: selectedBranchId || null,
        customer_id: customerId,
        issue_date: issueDate,
        due_date: dueDate,
        currency: "NGN",
        discount_total: "0.00",
        charge_total: "0.00",
        line_items: [
          {
            description: description.trim(),
            quantity: mode === "quick" ? "1" : quantity,
            unit_price: mode === "quick" ? amount : unitPrice,
            discount_amount: "0.00",
            tax_rate: null,
          },
        ],
      },
      {
        onSuccess: (invoice) => {
          router.push(`/app/invoices/${invoice.id}`);
        },
      },
    );
  };

  return (
    <div className="max-w-[960px] space-y-6">
      <PageHeader
        title="Create invoice"
        description="Create a Branch-attributed draft. Ondar calculates and persists the authoritative financial totals."
        actions={
          <Button
            variant="secondary"
            onClick={saveDraft}
            loading={createInvoice.isPending}
            disabled={
              !customerId ||
              !description.trim() ||
              !lineAmount ||
              branchRequired ||
              !issueDate ||
              !dueDate
            }
          >
            Save draft
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="branch">Operating Branch</Label>
              <select
                id="branch"
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                disabled={branchAccess.isLoading || branchAccess.isError}
                className="mt-1 h-9 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="" disabled={branches.length > 1}>
                  {branchAccess.isLoading
                    ? "Loading Branches…"
                    : branches.length > 1
                      ? "Select a Branch"
                      : "Server default"}
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} · {branch.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedBranch
                  ? `This draft will belong to ${selectedBranch.code} · ${selectedBranch.name}.`
                  : branches.length > 1
                    ? "A concrete Branch is required for direct creation in a multi-Branch Organization."
                    : "With one active Branch, the server may resolve it automatically."}
              </p>
            </div>

            <div>
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                disabled={customers.isLoading || customers.isError}
                className="mt-1 h-9 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="">
                  {customers.isLoading ? "Loading customers…" : "Select a customer"}
                </option>
                {customerRows.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {branchAccess.isError ? (
            <p className="mt-3 text-sm text-critical">
              Branch context is unavailable. Refresh before creating the invoice.
            </p>
          ) : null}
          {customers.isError ? (
            <p className="mt-3 text-sm text-critical">
              Customers are unavailable. Refresh before creating the invoice.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant={mode === "quick" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("quick")}
        >
          Quick
        </Button>
        <Button
          variant={mode === "standard" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("standard")}
        >
          Standard
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="March consulting engagement"
                  className="mt-1"
                />
              </div>

              {mode === "quick" ? (
                <div>
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="2400000.00"
                    className="mt-1 tabular-nums"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      inputMode="decimal"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit-price">Unit price (NGN)</Label>
                    <Input
                      id="unit-price"
                      value={unitPrice}
                      onChange={(event) => setUnitPrice(event.target.value)}
                      inputMode="decimal"
                      placeholder="2400000.00"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="issue-date">Issue date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(event) => setIssueDate(event.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="due-date">Due date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Draft input
              </div>
              <div className="mt-3">
                {lineAmount ? (
                  <MoneyAmount amount={lineAmount} emphasis="table" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Enter an amount
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is the entered line value, not an authoritative total. The
                backend calculates subtotal, discounts, tax, charges and grand total
                when the draft is saved.
              </p>
              <Button
                className="mt-4 w-full"
                onClick={saveDraft}
                loading={createInvoice.isPending}
                disabled={
                  !customerId ||
                  !description.trim() ||
                  !lineAmount ||
                  branchRequired ||
                  !issueDate ||
                  !dueDate
                }
              >
                Save draft
              </Button>
            </CardContent>
          </Card>

          {createInvoice.isError ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium">Draft was not created</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {createInvoice.error.message}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
