"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
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
import {
  type MilestoneBillingType,
  type ProjectMilestone,
  useCompleteMilestone,
  useCreateMilestone,
  usePrepareMilestoneInvoice,
  useProjectDashboard,
  useProjectMilestones,
} from "@/features/projects/api";
import {
  canCompleteMilestone,
  canPrepareMilestoneInvoice,
  milestoneBillingLabel,
  milestoneBillingVariant,
  milestoneCompletionVariant,
  milestonePrepareErrorMessage,
} from "@/features/projects/milestones";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

type BillingChoice = "" | MilestoneBillingType;

function billingBasisText(
  milestone: ProjectMilestone,
  currency: string,
): string {
  if (milestone.billing_type === "FIXED" && milestone.billing_amount) {
    return formatMoney(milestone.billing_amount, currency);
  }
  if (
    milestone.billing_type === "PERCENTAGE" &&
    milestone.billing_percentage
  ) {
    return `${milestone.billing_percentage} share`;
  }
  return "—";
}

export default function ProjectMilestonesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";

  const dashboard = useProjectDashboard(orgId, projectId);
  const milestones = useProjectMilestones(orgId, projectId);
  const createMilestone = useCreateMilestone(orgId, projectId);
  const completeMilestone = useCompleteMilestone(orgId, projectId);
  const prepareInvoice = usePrepareMilestoneInvoice(orgId, projectId);

  const prepareKeys = useRef<Map<string, string>>(new Map());

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingType, setBillingType] = useState<BillingChoice>("");
  const [billingAmount, setBillingAmount] = useState("");
  const [billingPercentage, setBillingPercentage] = useState("");

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before managing Milestones."
      />
    );
  }

  if (dashboard.isLoading || milestones.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        title="Project unavailable"
        description={
          dashboard.error instanceof Error
            ? dashboard.error.message
            : "The Project dashboard request failed."
        }
        retry={{ label: "Retry", onClick: () => void dashboard.refetch() }}
      />
    );
  }

  if (milestones.isError) {
    return (
      <ErrorState
        title="Milestones unavailable"
        description={
          milestones.error instanceof Error
            ? milestones.error.message
            : "The Milestone request failed."
        }
        retry={{ label: "Retry", onClick: () => void milestones.refetch() }}
      />
    );
  }

  const project = dashboard.data?.overview.project;
  if (!project) {
    return (
      <EmptyState
        title="Project unavailable"
        description="No Project data was returned."
      />
    );
  }

  const rows = milestones.data ?? [];
  const isInternal = project.kind === "INTERNAL";
  const percentageAvailable =
    !isInternal && project.contract_value !== null;

  const fixedNumber = Number(billingAmount);
  const percentageNumber = Number(billingPercentage);
  const fixedValid =
    billingType !== "FIXED" ||
    (billingAmount.trim() !== "" &&
      Number.isFinite(fixedNumber) &&
      fixedNumber > 0);
  const percentageValid =
    billingType !== "PERCENTAGE" ||
    (percentageAvailable &&
      billingPercentage.trim() !== "" &&
      Number.isFinite(percentageNumber) &&
      percentageNumber > 0 &&
      percentageNumber <= 1);
  const canCreate =
    name.trim().length > 0 &&
    fixedValid &&
    percentageValid &&
    !createMilestone.isPending;

  const resetCreate = () => {
    setName("");
    setDescription("");
    setDueDate("");
    setBillingType("");
    setBillingAmount("");
    setBillingPercentage("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;

    try {
      await createMilestone.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        billing_type: isInternal || !billingType ? null : billingType,
        billing_amount:
          !isInternal && billingType === "FIXED"
            ? billingAmount.trim()
            : null,
        billing_percentage:
          !isInternal && billingType === "PERCENTAGE"
            ? billingPercentage.trim()
            : null,
      });
      resetCreate();
      setShowCreate(false);
      toast.success("Milestone created");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create Milestone",
      );
    }
  };

  const handleComplete = async (milestone: ProjectMilestone) => {
    if (
      !window.confirm(
        `Mark "${milestone.name}" complete? Ondar will derive billing readiness from its saved billing basis.`,
      )
    ) {
      return;
    }

    try {
      const completed = await completeMilestone.mutateAsync(milestone.id);
      toast.success(
        completed.billing_status === "READY"
          ? "Milestone completed and ready to bill"
          : "Milestone completed",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not complete Milestone",
      );
    }
  };

  const handlePrepareInvoice = async (milestone: ProjectMilestone) => {
    let idempotencyKey = prepareKeys.current.get(milestone.id);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      prepareKeys.current.set(milestone.id, idempotencyKey);
    }

    try {
      const invoice = await prepareInvoice.mutateAsync({
        milestoneId: milestone.id,
        idempotencyKey,
      });
      prepareKeys.current.delete(milestone.id);
      toast.success("Invoice draft created");
      router.push(`/app/invoices/${invoice.id}`);
    } catch (error) {
      toast.error(milestonePrepareErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.project_number}
        title={`${project.name} · Milestones`}
        description="Track delivery checkpoints separately from billing. Completion can make a commercial milestone ready to bill, but never creates an Invoice automatically."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/app/projects/${project.id}`}>Project</Link>
            </Button>
            <Button onClick={() => setShowCreate((current) => !current)}>
              {showCreate ? "Close form" : "Add milestone"}
            </Button>
          </div>
        }
      />

      {showCreate ? (
        <Card>
          <CardContent className="p-5">
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="milestone-name">Milestone name *</Label>
                  <Input
                    id="milestone-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Stage setup and technical rehearsal"
                    maxLength={200}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="milestone-description">Description</Label>
                  <textarea
                    id="milestone-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="What must be delivered for this milestone to be complete?"
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <Label htmlFor="milestone-due">Due date</Label>
                  <Input
                    id="milestone-due"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="milestone-billing">Billing basis</Label>
                  <select
                    id="milestone-billing"
                    value={isInternal ? "" : billingType}
                    onChange={(event) => {
                      setBillingType(event.target.value as BillingChoice);
                      setBillingAmount("");
                      setBillingPercentage("");
                    }}
                    disabled={isInternal}
                    className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  >
                    <option value="">
                      {isInternal ? "Internal · not billable" : "Not billable"}
                    </option>
                    {!isInternal ? <option value="FIXED">Fixed amount</option> : null}
                    {!isInternal && percentageAvailable ? (
                      <option value="PERCENTAGE">Project value share</option>
                    ) : null}
                  </select>
                </div>

                {!isInternal && billingType === "FIXED" ? (
                  <div>
                    <Label htmlFor="milestone-amount">Billing amount *</Label>
                    <Input
                      id="milestone-amount"
                      inputMode="decimal"
                      value={billingAmount}
                      onChange={(event) => setBillingAmount(event.target.value)}
                      placeholder="2500000.00"
                      className="mt-1"
                    />
                    {!fixedValid ? (
                      <p className="mt-1 text-xs text-critical">
                        Enter an amount greater than zero.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!isInternal && billingType === "PERCENTAGE" ? (
                  <div>
                    <Label htmlFor="milestone-percentage">
                      Project value share *
                    </Label>
                    <Input
                      id="milestone-percentage"
                      inputMode="decimal"
                      value={billingPercentage}
                      onChange={(event) =>
                        setBillingPercentage(event.target.value)
                      }
                      placeholder="0.25"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter a ratio from 0 to 1. Example: 0.25 means 25%.
                    </p>
                    {!percentageValid ? (
                      <p className="mt-1 text-xs text-critical">
                        Enter a ratio greater than 0 and no more than 1.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {!isInternal && !percentageAvailable ? (
                <p className="text-xs text-muted-foreground">
                  Percentage billing is unavailable until this Project has an
                  authoritative commercial value. Fixed billing remains available.
                </p>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={!canCreate}>
                  {createMilestone.isPending ? "Creating…" : "Create milestone"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetCreate();
                    setShowCreate(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No Milestones yet"
          description="Add delivery checkpoints when the Project needs explicit completion or billing readiness."
          action={{ label: "Add milestone", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Basis</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="tabular-nums">
                      {milestone.sequence}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{milestone.name}</div>
                      {milestone.description ? (
                        <div className="max-w-md text-xs text-muted-foreground">
                          {milestone.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{milestone.due_date ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={milestoneCompletionVariant(
                          milestone.completion_status,
                        )}
                      >
                        {milestone.completion_status === "COMPLETED"
                          ? "Completed"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={milestoneBillingVariant(
                          milestone.billing_status,
                        )}
                      >
                        {milestoneBillingLabel(milestone.billing_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {billingBasisText(milestone, project.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canCompleteMilestone(milestone) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={completeMilestone.isPending}
                            onClick={() => void handleComplete(milestone)}
                          >
                            Complete
                          </Button>
                        ) : null}
                        {canPrepareMilestoneInvoice(milestone) ? (
                          <Button
                            size="sm"
                            disabled={prepareInvoice.isPending}
                            onClick={() => void handlePrepareInvoice(milestone)}
                          >
                            Prepare invoice
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {milestone.sequence}. {milestone.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Due {milestone.due_date ?? "not set"}
                      </div>
                    </div>
                    <Badge
                      variant={milestoneCompletionVariant(
                        milestone.completion_status,
                      )}
                    >
                      {milestone.completion_status === "COMPLETED"
                        ? "Completed"
                        : "Pending"}
                    </Badge>
                  </div>

                  {milestone.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={milestoneBillingVariant(
                        milestone.billing_status,
                      )}
                    >
                      {milestoneBillingLabel(milestone.billing_status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {billingBasisText(milestone, project.currency)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canCompleteMilestone(milestone) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={completeMilestone.isPending}
                        onClick={() => void handleComplete(milestone)}
                      >
                        Complete
                      </Button>
                    ) : null}
                    {canPrepareMilestoneInvoice(milestone) ? (
                      <Button
                        size="sm"
                        disabled={prepareInvoice.isPending}
                        onClick={() => void handlePrepareInvoice(milestone)}
                      >
                        Prepare invoice
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Completing a Milestone records delivery state only. A billable completed
          Milestone becomes Ready to bill; Ondar creates an Invoice draft only when
          you explicitly choose Prepare invoice. Customer acceptance or Order billing
          policy can still block that command on the server.
        </CardContent>
      </Card>
    </div>
  );
}
