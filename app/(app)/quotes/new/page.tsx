"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useProjects } from "@/features/projects/api";
import {
  type QuoteArchetype,
  type QuoteCreateInput,
  type QuoteLineInput,
  useCalculateQuotePreview,
  useCreateQuote,
} from "@/features/quotes/api";
import { resolveQuoteCreateBranchId } from "@/features/quotes/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type DraftLine = QuoteLineInput & { key: number };

function emptyLine(key: number): DraftLine {
  return {
    key,
    description: "",
    quantity: "1",
    unit_price: "",
    discount_amount: "0",
    tax_rate: null,
  };
}

function validDecimal(
  value: string,
  opts: { positive?: boolean; max?: number } = {},
): boolean {
  if (value.trim() === "") return false;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return false;
  if (opts.positive ? parsed <= 0 : parsed < 0) return false;
  if (opts.max !== undefined && parsed > opts.max) return false;
  return true;
}

export default function NewQuotePage() {
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();

  const branchAccess = useOperatingBranches(orgId);
  const customers = useCustomers(orgId, {
    status: "ACTIVE",
    limit: 100,
    sort: "normalized_name:asc",
  });

  const resolvedBranchId = resolveQuoteCreateBranchId(
    branchAccess.data,
    activeBranchId,
  );
  const branchIds = useMemo(
    () => new Set((branchAccess.data?.branches ?? []).map((branch) => branch.id)),
    [branchAccess.data?.branches],
  );

  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [archetype, setArchetype] = useState<QuoteArchetype | "">("");
  const [currency, setCurrency] = useState("NGN");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [discountTotal, setDiscountTotal] = useState("0");
  const [chargeTotal, setChargeTotal] = useState("0");
  const nextLineKey = useRef(2);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(1)]);
  const createReceipt = useRef<{ key: string; payload: string } | null>(null);

  const projects = useProjects(orgId, {
    branchId: branchId || null,
    customerId: customerId || null,
    limit: 100,
    enabled: Boolean(branchId && customerId),
  });
  const preview = useCalculateQuotePreview(orgId);
  const createQuote = useCreateQuote(orgId);

  useEffect(() => {
    if (!branchAccess.data) return;
    setBranchId((current) => {
      if (current && branchIds.has(current)) return current;
      return resolvedBranchId ?? "";
    });
  }, [branchAccess.data, branchIds, resolvedBranchId]);

  const commercialProjects = (projects.data?.data ?? []).filter(
    (project) => project.kind === "COMMERCIAL",
  );
  const currentProjectValid =
    !projectId || commercialProjects.some((project) => project.id === projectId);

  useEffect(() => {
    if (projectId && !currentProjectValid) {
      setProjectId("");
    }
  }, [currentProjectValid, projectId]);

  const updateLine = (
    key: number,
    field: keyof QuoteLineInput,
    value: string | null,
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
    preview.reset();
  };

  const addLine = () => {
    const key = nextLineKey.current++;
    setLines((current) => [...current, emptyLine(key)]);
    preview.reset();
  };

  const removeLine = (key: number) => {
    setLines((current) =>
      current.length === 1 ? current : current.filter((line) => line.key !== key),
    );
    preview.reset();
  };

  const sanitizedLines: QuoteLineInput[] = lines.map((line) => ({
    description: line.description.trim(),
    quantity: line.quantity.trim(),
    unit_price: line.unit_price.trim(),
    discount_amount: line.discount_amount?.trim() || "0",
    tax_rate: line.tax_rate?.trim() || null,
  }));

  const linesValid = sanitizedLines.every(
    (line) =>
      line.description.length > 0 &&
      validDecimal(line.quantity, { positive: true }) &&
      validDecimal(line.unit_price) &&
      validDecimal(line.discount_amount ?? "0") &&
      (line.tax_rate === null ||
        validDecimal(line.tax_rate, { max: 1 })),
  );
  const currencyValid = /^[A-Z]{3}$/.test(currency.trim().toUpperCase());
  const adjustmentsValid =
    validDecimal(discountTotal) && validDecimal(chargeTotal);
  const canSubmit =
    Boolean(branchId) &&
    Boolean(customerId) &&
    linesValid &&
    currencyValid &&
    adjustmentsValid &&
    !createQuote.isPending;

  const previewTotals = async () => {
    if (!linesValid || !currencyValid || !adjustmentsValid) {
      toast.error("Complete valid line items before calculating totals.");
      return;
    }
    try {
      await preview.mutateAsync({
        line_items: sanitizedLines,
        discount_total: discountTotal.trim(),
        charge_total: chargeTotal.trim(),
        currency: currency.trim().toUpperCase(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not calculate Quote totals",
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const input: QuoteCreateInput = {
      branch_id: branchId,
      customer_id: customerId,
      project_id: projectId || null,
      archetype: archetype || null,
      currency: currency.trim().toUpperCase(),
      valid_until: validUntil || null,
      notes: notes.trim() || null,
      terms: terms.trim() || null,
      discount_total: discountTotal.trim(),
      charge_total: chargeTotal.trim(),
      line_items: sanitizedLines,
    };
    const serialized = JSON.stringify(input);
    if (!createReceipt.current || createReceipt.current.payload !== serialized) {
      createReceipt.current = {
        key: crypto.randomUUID(),
        payload: serialized,
      };
    }

    try {
      const quote = await createQuote.mutateAsync({
        input,
        idempotencyKey: createReceipt.current.key,
      });
      createReceipt.current = null;
      toast.success("Quote draft created");
      router.push(`/app/quotes/${quote.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create Quote",
      );
    }
  };

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before creating a Quote."
      />
    );
  }

  if (branchAccess.isError) {
    return (
      <ErrorState
        title="Could not resolve Branch access"
        description={
          branchAccess.error instanceof Error
            ? branchAccess.error.message
            : "The operating Branch request failed."
        }
        retry={{ label: "Retry", onClick: () => void branchAccess.refetch() }}
      />
    );
  }

  if (
    branchAccess.data &&
    branchAccess.data.organization_wide === false &&
    branchAccess.data.branches.length === 0
  ) {
    return (
      <EmptyState
        title="No operating Branch access"
        description="A Quote must belong to an active operating Branch."
      />
    );
  }

  const selectedBranch = (branchAccess.data?.branches ?? []).find(
    (branch) => branch.id === branchId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          selectedBranch
            ? `${selectedBranch.code} · ${selectedBranch.name}`
            : "Commercial proposal"
        }
        title="Create quote"
        description="Create a commercial proposal. Totals are calculated by Ondar; a Quote does not create a Receivable."
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/quotes">All quotes</Link>
          </Button>
        }
      />

      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="quote-branch">Operating Branch *</Label>
                  <select
                    id="quote-branch"
                    value={branchId}
                    onChange={(event) => {
                      setBranchId(event.target.value);
                      setProjectId("");
                    }}
                    disabled={branchAccess.isLoading}
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {branchAccess.isLoading
                        ? "Loading Branches…"
                        : "Select operating Branch"}
                    </option>
                    {(branchAccess.data?.branches ?? []).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.code} · {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="quote-customer">Customer *</Label>
                  <select
                    id="quote-customer"
                    value={customerId}
                    onChange={(event) => {
                      setCustomerId(event.target.value);
                      setProjectId("");
                    }}
                    disabled={customers.isLoading}
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  >
                    <option value="">
                      {customers.isLoading ? "Loading customers…" : "Select customer"}
                    </option>
                    {(customers.data?.data ?? []).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {!customers.isLoading &&
                  !customers.isError &&
                  (customers.data?.data.length ?? 0) === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No active customers.{" "}
                      <Link
                        href="/app/customers/new"
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        Add a customer
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="quote-project">Project</Label>
                  <select
                    id="quote-project"
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    disabled={!branchId || !customerId || projects.isLoading}
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  >
                    <option value="">
                      {!branchId || !customerId
                        ? "Select Branch and customer first"
                        : projects.isLoading
                          ? "Loading Projects…"
                          : "No Project"}
                    </option>
                    {commercialProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_number} · {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="quote-archetype">Quote format</Label>
                  <select
                    id="quote-archetype"
                    value={archetype}
                    onChange={(event) =>
                      setArchetype(event.target.value as QuoteArchetype | "")
                    }
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Standard</option>
                    <option value="SERVICE">Service</option>
                    <option value="PROJECT">Project</option>
                    <option value="PRODUCT">Product</option>
                    <option value="TRADE">Trade</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="quote-currency">Currency *</Label>
                  <Input
                    id="quote-currency"
                    value={currency}
                    onChange={(event) => {
                      setCurrency(event.target.value.toUpperCase());
                      preview.reset();
                    }}
                    maxLength={3}
                    className="mt-1 uppercase"
                  />
                </div>

                <div>
                  <Label htmlFor="quote-valid-until">Valid until</Label>
                  <Input
                    id="quote-valid-until"
                    type="date"
                    value={validUntil}
                    onChange={(event) => setValidUntil(event.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Line items</h2>
                  <p className="text-xs text-muted-foreground">
                    Enter commercial inputs only. Ondar calculates authoritative totals.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addLine}>
                  Add line
                </Button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div key={line.key} className="rounded-md border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium">Line {index + 1}</span>
                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLine(line.key)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <div className="grid gap-3 md:grid-cols-12">
                      <div className="md:col-span-12">
                        <Label>Description *</Label>
                        <Input
                          value={line.description}
                          onChange={(event) =>
                            updateLine(line.key, "description", event.target.value)
                          }
                          placeholder="Professional services for..."
                          className="mt-1"
                          maxLength={1000}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Quantity *</Label>
                        <Input
                          inputMode="decimal"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(line.key, "quantity", event.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Unit price *</Label>
                        <Input
                          inputMode="decimal"
                          value={line.unit_price}
                          onChange={(event) =>
                            updateLine(line.key, "unit_price", event.target.value)
                          }
                          className="mt-1"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Line discount</Label>
                        <Input
                          inputMode="decimal"
                          value={line.discount_amount ?? "0"}
                          onChange={(event) =>
                            updateLine(
                              line.key,
                              "discount_amount",
                              event.target.value,
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Tax rate</Label>
                        <Input
                          inputMode="decimal"
                          value={line.tax_rate ?? ""}
                          onChange={(event) =>
                            updateLine(line.key, "tax_rate", event.target.value)
                          }
                          placeholder="0–1"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!linesValid ? (
                <p className="text-xs text-muted-foreground">
                  Every line needs a description, quantity greater than zero, a
                  non-negative unit price/discount, and tax rate between 0 and 1.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <Label htmlFor="quote-discount">Quote discount</Label>
                <Input
                  id="quote-discount"
                  inputMode="decimal"
                  value={discountTotal}
                  onChange={(event) => {
                    setDiscountTotal(event.target.value);
                    preview.reset();
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quote-charge">Commercial charges</Label>
                <Input
                  id="quote-charge"
                  inputMode="decimal"
                  value={chargeTotal}
                  onChange={(event) => {
                    setChargeTotal(event.target.value);
                    preview.reset();
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quote-notes">Notes</Label>
                <textarea
                  id="quote-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="quote-terms">Terms</Label>
                <textarea
                  id="quote-terms"
                  rows={3}
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-sm font-semibold">Authoritative totals</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Calculated by the Quote service, never by browser arithmetic.
                </p>
              </div>

              {preview.data ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">
                      {formatMoney(preview.data.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums">
                      {formatMoney(preview.data.discount_total, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">
                      {formatMoney(preview.data.tax_total, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Charges</span>
                    <span className="tabular-nums">
                      {formatMoney(preview.data.charge_total, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatMoney(preview.data.grand_total, currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preview totals when the line items are ready.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={preview.isPending}
                onClick={() => void previewTotals()}
              >
                {preview.isPending ? "Calculating…" : "Preview totals"}
              </Button>
            </CardContent>
          </Card>

          {createQuote.isError ? (
            <ErrorState
              title="Could not create Quote"
              description={
                createQuote.error instanceof Error
                  ? createQuote.error.message
                  : "The Quote request failed."
              }
            />
          ) : null}

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {createQuote.isPending ? "Creating…" : "Create quote draft"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Creation saves a DRAFT only. Sending is a separate governed action.
          </p>
        </div>
      </form>
    </div>
  );
}
