"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MoneyAmount } from "@/components/kivo/money-amount";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCatalogItems } from "@/features/catalog/api";
import { useCustomers } from "@/features/customers/api";
import {
  useCalculateInvoicePreview,
  useCreateInvoice,
  type InvoiceCreateInput,
} from "@/features/invoices/api";
import { resolveInvoiceCreateBranchId } from "@/features/invoices/branching";
import { useOperatingBranches } from "@/features/organization/api";
import { useTaxCodes } from "@/features/tax/api";
import {
  documentAttachableTaxCodes,
  findTaxCode,
  taxSelectionHint,
} from "@/features/tax/document";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function localDate(offsetDays = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offsetDays);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId);
  const customers = useCustomers(orgId, { status: "ACTIVE", limit: 100 });
  const catalogItems = useCatalogItems(orgId, { direction: "SELL" });
  const taxCodes = useTaxCodes(orgId);
  const attachableTaxCodes = useMemo(
    () => documentAttachableTaxCodes(taxCodes.data?.data ?? []),
    [taxCodes.data?.data],
  );
  const preview = useCalculateInvoicePreview(orgId);
  const createInvoice = useCreateInvoice(orgId);

  const [mode, setMode] = useState<"quick" | "standard">("quick");
  const [customerId, setCustomerId] = useState("");
  const [commercialItemId, setCommercialItemId] = useState("");
  const [taxCodeId, setTaxCodeId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [issueDate, setIssueDate] = useState(localDate());
  const [dueDate, setDueDate] = useState(localDate(14));

  const createBranchId = resolveInvoiceCreateBranchId(
    branchAccess.data,
    activeBranchId,
  );
  const selectedBranch = useMemo(
    () =>
      branchAccess.data?.branches.find(
        (branch) => branch.id === createBranchId,
      ) ?? null,
    [branchAccess.data?.branches, createBranchId],
  );

  const selectedCatalogItem = useMemo(
    () =>
      (catalogItems.data?.data ?? []).find(
        (item) => item.id === commercialItemId,
      ) ?? null,
    [catalogItems.data?.data, commercialItemId],
  );

  const branchSelectionRequired =
    Boolean(branchAccess.data) &&
    (branchAccess.data?.branches.length ?? 0) > 1 &&
    !createBranchId;

  const currentLine = (): InvoiceCreateInput["line_items"][number] => ({
    description: description.trim(),
    quantity: mode === "quick" ? "1" : quantity,
    unit_price: mode === "quick" ? amount : unitPrice,
    discount_amount: "0",
    commercial_item_id: commercialItemId || null,
    tax_code_id: taxCodeId || null,
    tax_rate: null,
  });

  const previewTotals = async () => {
    if (!description.trim() || !issueDate || !lineInputAmount) return;
    try {
      await preview.mutateAsync({
        line_items: [currentLine()],
        issue_date: issueDate,
        discount_total: "0",
        charge_total: "0",
        currency: "NGN",
      });
    } catch {
      // React Query retains the authoritative API error for inline display.
    }
  };

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!orgId || !customerId || !description.trim() || !dueDate || !issueDate) {
      return;
    }
    if (!createBranchId) return;

    const line = currentLine();

    const payload: InvoiceCreateInput = {
      branch_id: createBranchId,
      customer_id: customerId,
      issue_date: issueDate,
      due_date: dueDate,
      currency: "NGN",
      discount_total: "0",
      charge_total: "0",
      line_items: [line],
    };

    const invoice = await createInvoice.mutateAsync(payload);
    router.push(`/app/invoices/${invoice.id}`);
  };

  const lineInputAmount = mode === "quick" ? amount : unitPrice;
  const canSave =
    Boolean(
      orgId &&
        createBranchId &&
        customerId &&
        description.trim() &&
        issueDate &&
        dueDate &&
        lineInputAmount,
    ) && !createInvoice.isPending;

  return (
    <form onSubmit={saveDraft} className="max-w-[960px] space-y-6">
      <PageHeader
        eyebrow={
          selectedBranch
            ? `${selectedBranch.code} · ${selectedBranch.name}`
            : "Branch required"
        }
        title="Create invoice"
        description="The selected operating Branch is persisted on the draft and becomes immutable commercial lineage at issuance."
        actions={
          <Button type="submit" disabled={!canSave} loading={createInvoice.isPending}>
            Save draft
          </Button>
        }
      />

      {branchAccess.isError ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Could not resolve Branch access</div>
            <p className="mt-1 text-muted-foreground">
              {branchAccess.error instanceof Error
                ? branchAccess.error.message
                : "The operating Branch request failed."}
            </p>
          </CardContent>
        </Card>
      ) : branchSelectionRequired ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Choose an operating Branch</div>
            <p className="mt-1 text-muted-foreground">
              You are viewing All branches. Select a Branch from the app context
              before creating a Branch-attributed invoice.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {createInvoice.isError ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Could not save invoice</div>
            <p className="mt-1 text-muted-foreground">
              {createInvoice.error instanceof Error
                ? createInvoice.error.message
                : "The invoice request failed."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "quick" ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setMode("quick");
            preview.reset();
          }}
        >
          Quick
        </Button>
        <Button
          type="button"
          variant={mode === "standard" ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setMode("standard");
            preview.reset();
          }}
        >
          Standard
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                  disabled={!orgId || customers.isLoading}
                >
                  <option value="">Select customer</option>
                  {(customers.data?.data ?? []).map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="catalog-item">Catalog item · optional</Label>
                <select
                  id="catalog-item"
                  value={commercialItemId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const item = (catalogItems.data?.data ?? []).find(
                      (candidate) => candidate.id === nextId,
                    );
                    setCommercialItemId(nextId);
                    if (!description.trim() && item) {
                      setDescription(item.description?.trim() || item.name);
                    }
                    preview.reset();
                  }}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                  disabled={catalogItems.isLoading}
                >
                  <option value="">
                    {catalogItems.isLoading ? "Loading Catalog…" : "Free-text line"}
                  </option>
                  {(catalogItems.data?.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? item.code + " · " : ""}
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

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
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      preview.reset();
                    }}
                    placeholder="2400000.00"
                    className="mt-1 tabular-nums"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sent as a decimal string. The server calculates financial totals.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border p-3">
                  <div className="mb-3 text-sm font-medium">Line item</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        inputMode="decimal"
                        value={quantity}
                        onChange={(event) => {
                          setQuantity(event.target.value);
                          preview.reset();
                        }}
                        className="mt-1 tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="unit-price">Unit price (NGN)</Label>
                      <Input
                        id="unit-price"
                        inputMode="decimal"
                        value={unitPrice}
                        onChange={(event) => {
                          setUnitPrice(event.target.value);
                          preview.reset();
                        }}
                        placeholder="2400000.00"
                        className="mt-1 tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="invoice-tax-code">TaxCode</Label>
                <select
                  id="invoice-tax-code"
                  value={taxCodeId}
                  onChange={(event) => {
                    setTaxCodeId(event.target.value);
                    preview.reset();
                  }}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                  disabled={taxCodes.isLoading}
                >
                  <option value="">
                    {commercialItemId ? "Use Catalog default" : "No tax"}
                  </option>
                  {attachableTaxCodes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} · {code.name} · {code.current_version?.rate}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {taxSelectionHint({
                    item: selectedCatalogItem,
                    direction: "SELL",
                    explicitTaxCodeId: taxCodeId || null,
                    codes: taxCodes.data?.data ?? [],
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="issue-date">Issue date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(event) => {
                      setIssueDate(event.target.value);
                      preview.reset();
                    }}
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
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Operating context
              </div>
              <div className="mt-2 text-sm font-medium">
                {selectedBranch
                  ? `${selectedBranch.code} · ${selectedBranch.name}`
                  : "No Branch selected"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {selectedBranch?.timezone ?? "Select a Branch in the app shell."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Authoritative totals
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calculated by the Invoice service. Browser arithmetic is not
                  financial authority.
                </p>
              </div>

              {preview.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Subtotal</span>
                    <MoneyAmount
                      amount={preview.data.subtotal}
                      currency="NGN"
                      emphasis="table"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tax</span>
                    <MoneyAmount
                      amount={preview.data.tax_total}
                      currency="NGN"
                      emphasis="table"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t pt-2 font-medium">
                    <span>Total</span>
                    <MoneyAmount
                      amount={preview.data.grand_total}
                      currency="NGN"
                      emphasis="table"
                    />
                  </div>
                  <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs">
                    Server resolved tax:{" "}
                    {findTaxCode(
                      taxCodes.data?.data ?? [],
                      preview.data.line_totals[0]?.tax_code_id,
                    )?.code ?? "None"}
                    {" · rate "}
                    {preview.data.line_totals[0]?.tax_rate ?? "—"}
                  </div>
                </div>
              ) : (
                <div>
                  <MoneyAmount
                    amount={lineInputAmount || "0"}
                    currency="NGN"
                    emphasis="table"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Preview to resolve Catalog inheritance, TaxCodeVersion, tax
                    amount, and final total.
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!lineInputAmount || !description.trim() || preview.isPending}
                loading={preview.isPending}
                onClick={() => void previewTotals()}
              >
                Preview server totals
              </Button>

              {preview.isError ? (
                <p className="text-xs text-critical">{preview.error.message}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
