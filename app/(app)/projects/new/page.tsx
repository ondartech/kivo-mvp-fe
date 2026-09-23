"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/api";
import { useOperatingBranches } from "@/features/organization/api";
import {
  type ProjectKind,
  useCreateProject,
} from "@/features/projects/api";
import { resolveProjectCreateBranchId } from "@/features/projects/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function NewProjectPage() {
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const branchAccess = useOperatingBranches(orgId);
  const customers = useCustomers(orgId, {
    status: "ACTIVE",
    limit: 100,
    sort: "normalized_name:asc",
  });
  const createProject = useCreateProject(orgId);

  const resolvedBranchId = resolveProjectCreateBranchId(
    branchAccess.data,
    activeBranchId,
  );
  const [branchId, setBranchId] = useState("");
  const [kind, setKind] = useState<ProjectKind>("COMMERCIAL");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [startDate, setStartDate] = useState("");
  const [targetEndDate, setTargetEndDate] = useState("");

  const branchIds = useMemo(
    () => new Set((branchAccess.data?.branches ?? []).map((branch) => branch.id)),
    [branchAccess.data?.branches],
  );

  useEffect(() => {
    if (!branchAccess.data) return;
    setBranchId((current) => {
      if (current && branchIds.has(current)) return current;
      return resolvedBranchId ?? "";
    });
  }, [branchAccess.data, branchIds, resolvedBranchId]);

  useEffect(() => {
    if (kind === "INTERNAL") setCustomerId("");
  }, [kind]);

  const branch = (branchAccess.data?.branches ?? []).find(
    (item) => item.id === branchId,
  );
  const customerRows = customers.data?.data ?? [];
  const commercialCustomerMissing =
    kind === "COMMERCIAL" && customerRows.length === 0 && !customers.isLoading;
  const scheduleInvalid =
    Boolean(startDate) &&
    Boolean(targetEndDate) &&
    targetEndDate < startDate;

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(branchId) &&
    (kind === "INTERNAL" || Boolean(customerId)) &&
    /^[A-Z]{3}$/.test(currency.trim().toUpperCase()) &&
    !scheduleInvalid &&
    !createProject.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await createProject.mutateAsync({
        kind,
        branch_id: branchId,
        customer_id: kind === "COMMERCIAL" ? customerId : null,
        name: name.trim(),
        description: description.trim() || null,
        currency: currency.trim().toUpperCase(),
        start_date: startDate || null,
        target_end_date: targetEndDate || null,
      });
      toast.success("Project created");
      router.push("/app/projects");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create Project",
      );
    }
  };

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before creating a Project."
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
        description="A Project must belong to an active operating Branch."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <PageHeader
        eyebrow={branch ? `${branch.code} · ${branch.name}` : "Project setup"}
        title="Create project"
        description="Create the work container first. Commercial, financial and delivery detail can be added as the Project develops."
      />

      <Card>
        <CardContent className="p-5">
          {createProject.isError ? (
            <div className="mb-4">
              <ErrorState
                title="Could not create Project"
                description={
                  createProject.error instanceof Error
                    ? createProject.error.message
                    : "The Project request failed."
                }
              />
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="project-kind">Project type</Label>
              <select
                id="project-kind"
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as ProjectKind)
                }
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="COMMERCIAL">Commercial · customer delivery</option>
                <option value="INTERNAL">Internal · company work</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Commercial Projects belong to a customer. Internal Projects never
                carry a customer obligation.
              </p>
            </div>

            <div>
              <Label htmlFor="project-branch">Operating Branch *</Label>
              <select
                id="project-branch"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                disabled={branchAccess.isLoading}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="" disabled>
                  {branchAccess.isLoading
                    ? "Loading Branches…"
                    : "Select an operating Branch"}
                </option>
                {(branchAccess.data?.branches ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Branch is persisted on the Project and drives downstream commercial
                and financial attribution.
              </p>
            </div>

            {kind === "COMMERCIAL" ? (
              <div>
                <Label htmlFor="project-customer">Customer *</Label>
                <select
                  id="project-customer"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  disabled={customers.isLoading}
                  className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  <option value="">
                    {customers.isLoading ? "Loading customers…" : "Select customer"}
                  </option>
                  {customerRows.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {customers.isError ? (
                  <p className="mt-1 text-xs text-critical">
                    Could not load active customers.
                  </p>
                ) : commercialCustomerMissing ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No active customers yet.{" "}
                    <Link
                      href="/app/customers/new"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      Add a customer
                    </Link>{" "}
                    before creating a commercial Project.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <Label htmlFor="project-name">Project name *</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  kind === "COMMERCIAL"
                    ? "Eko Festival — Lights & Sound"
                    : "2027 Operating Model"
                }
                className="mt-1"
                maxLength={200}
                required
              />
            </div>

            <div>
              <Label htmlFor="project-description">Description</Label>
              <textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What work is this Project responsible for?"
                rows={4}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="project-currency">Currency</Label>
                <Input
                  id="project-currency"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  maxLength={3}
                  className="mt-1 uppercase"
                  aria-describedby="project-currency-help"
                />
                <p
                  id="project-currency-help"
                  className="mt-1 text-xs text-muted-foreground"
                >
                  ISO 4217 code
                </p>
              </div>
              <div>
                <Label htmlFor="project-start">Start date</Label>
                <Input
                  id="project-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="project-target-end">Target end</Label>
                <Input
                  id="project-target-end"
                  type="date"
                  value={targetEndDate}
                  onChange={(event) => setTargetEndDate(event.target.value)}
                  min={startDate || undefined}
                  className="mt-1"
                />
              </div>
            </div>
            {scheduleInvalid ? (
              <p className="text-xs text-critical">
                Target end date cannot be earlier than the start date.
              </p>
            ) : null}

            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              This quick-create surface intentionally does not set contract value or
              budget. Those are Project economics and belong in the richer Project
              workspace, where their source and implications are visible.
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={!canSubmit}>
                {createProject.isPending ? "Creating…" : "Create project"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/app/projects")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
