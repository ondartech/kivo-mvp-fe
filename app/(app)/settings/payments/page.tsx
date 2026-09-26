"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOperatingBranches } from "@/features/organization/api";
import {
  useBankAccounts,
  useCreatePaymentRunTemplate,
  useCreateWorkflowDefinition,
  useCreateWorkflowTrigger,
  useCreateWorkflowVersion,
  useDisableWorkflowTrigger,
  useEnableWorkflowTrigger,
  useGeneratePaymentRunTemplate,
  usePaymentRunTemplates,
  usePublishWorkflowVersion,
  useResumePaymentRunTemplate,
  useSuspendPaymentRunTemplate,
  useWorkflowDefinitions,
  useWorkflowDeliveries,
  useWorkflowTriggers,
  type PaymentRunTemplateInput,
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

const obligationTypes = [
  "VENDOR_PAYABLE",
  "EXPENSE_REIMBURSEMENT",
  "EMPLOYEE_PAYMENT",
  "CUSTOMER_REFUND",
  "SUPPLIER_PREPAYMENT",
  "TAX_REMITTANCE",
  "MANUAL_DISBURSEMENT",
  "OTHER",
];

function workflowKeyFromName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}

export default function PaymentSettingsPage() {
  const orgId = useActiveOrganizationId() ?? "";

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before configuring Payment Operations."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Payment Operations"
        description="Configure repeatable run generation and event-driven operational follow-up without pre-authorizing or automatically moving money."
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/payments">Open operations</Link>
          </Button>
        }
      />

      <PaymentRunTemplateSettings orgId={orgId} />
      <PaymentOutcomeWorkflowSettings orgId={orgId} />
    </div>
  );
}

function PaymentRunTemplateSettings({ orgId }: { orgId: string }) {
  const activeBranchId = useActiveBranchId();
  const branches = useOperatingBranches(orgId);
  const bankAccounts = useBankAccounts(orgId);
  const templates = usePaymentRunTemplates(orgId);
  const create = useCreatePaymentRunTemplate(orgId);
  const suspend = useSuspendPaymentRunTemplate(orgId);
  const resume = useResumePaymentRunTemplate(orgId);
  const generate = useGeneratePaymentRunTemplate(orgId);

  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [weekday, setWeekday] = useState("4");
  const [dayOfMonth, setDayOfMonth] = useState("25");
  const [hour, setHour] = useState("8");
  const [minute, setMinute] = useState("0");
  const [offsetDays, setOffsetDays] = useState("0");
  const [fundingAccountId, setFundingAccountId] = useState("");
  const [branchId, setBranchId] = useState(activeBranchId ?? "");
  const [selectedObligationTypes, setSelectedObligationTypes] = useState<string[]>([
    "VENDOR_PAYABLE",
  ]);

  const activeAccounts = useMemo(
    () =>
      (bankAccounts.data ?? []).filter(
        (account) =>
          account.status === "ACTIVE" && account.currency === "NGN",
      ),
    [bankAccounts.data],
  );

  const createTemplate = async () => {
    if (!name.trim() || !fundingAccountId) {
      toast.error("Name and funding account are required.");
      return;
    }

    const input: PaymentRunTemplateInput = {
      name: name.trim(),
      cadence,
      generation_rule: {
        timezone: "Africa/Lagos",
        hour: Math.max(0, Math.min(23, parseInt(hour || "8", 10))),
        minute: Math.max(0, Math.min(59, parseInt(minute || "0", 10))),
        weekday:
          cadence === "WEEKLY"
            ? Math.max(0, Math.min(6, parseInt(weekday || "0", 10)))
            : null,
        day_of_month:
          cadence === "MONTHLY"
            ? Math.max(1, Math.min(31, parseInt(dayOfMonth || "1", 10)))
            : null,
      },
      planned_execution_rule: {
        offset_days: Math.max(
          0,
          Math.min(31, parseInt(offsetDays || "0", 10)),
        ),
      },
      funding_bank_account_id: fundingAccountId,
      currency: "NGN",
      source_filters: {
        obligation_types: selectedObligationTypes,
        source_types:
          selectedObligationTypes.length === 1 &&
          selectedObligationTypes[0] === "VENDOR_PAYABLE"
            ? ["PAYABLE"]
            : [],
        branch_id: branchId || null,
        due_on_or_before_execution: true,
        include_undated: false,
        max_items: 50,
      },
      approval_policy_id: null,
    };

    try {
      await create.mutateAsync(input);
      toast.success("Payment Run template created");
      setName("");
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Recurring Payment Runs</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Templates generate draft Payment Runs from matching obligations. Every
          generated run still requires current validation, submission, approval,
          execution release, and reconciliation.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                className="mt-1"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Monthly supplier payments"
              />
            </div>
            <div>
              <Label htmlFor="template-funding">Funding account</Label>
              <select
                id="template-funding"
                className={selectClassName}
                value={fundingAccountId}
                onChange={(event) => setFundingAccountId(event.target.value)}
              >
                <option value="">Select account</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} · {account.account_number_masked}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="template-branch">Branch scope</Label>
              <select
                id="template-branch"
                className={selectClassName}
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
              >
                <option value="">Organization scope</option>
                {(branches.data?.branches ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} · {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="template-cadence">Cadence</Label>
              <select
                id="template-cadence"
                className={selectClassName}
                value={cadence}
                onChange={(event) =>
                  setCadence(event.target.value as "WEEKLY" | "MONTHLY")
                }
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cadence === "WEEKLY" ? (
              <div>
                <Label htmlFor="template-weekday">Weekday</Label>
                <select
                  id="template-weekday"
                  className={selectClassName}
                  value={weekday}
                  onChange={(event) => setWeekday(event.target.value)}
                >
                  {[
                    ["0", "Monday"],
                    ["1", "Tuesday"],
                    ["2", "Wednesday"],
                    ["3", "Thursday"],
                    ["4", "Friday"],
                    ["5", "Saturday"],
                    ["6", "Sunday"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label htmlFor="template-day">Day of month</Label>
                <Input
                  id="template-day"
                  className="mt-1"
                  inputMode="numeric"
                  value={dayOfMonth}
                  onChange={(event) => setDayOfMonth(event.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="template-hour">Generation hour</Label>
              <Input
                id="template-hour"
                className="mt-1"
                inputMode="numeric"
                value={hour}
                onChange={(event) => setHour(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="template-minute">Minute</Label>
              <Input
                id="template-minute"
                className="mt-1"
                inputMode="numeric"
                value={minute}
                onChange={(event) => setMinute(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="template-offset">Execution offset days</Label>
              <Input
                id="template-offset"
                className="mt-1"
                inputMode="numeric"
                value={offsetDays}
                onChange={(event) => setOffsetDays(event.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Obligation types</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {obligationTypes.map((type) => {
                const checked = selectedObligationTypes.includes(type);
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedObligationTypes((current) =>
                          checked
                            ? current.filter((value) => value !== type)
                            : [...current, type],
                        )
                      }
                    />
                    {humanizePaymentValue(type)}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Schedule timezone: Africa/Lagos. Generated runs are drafts, never
              pre-approved executions.
            </p>
            <Button
              disabled={
                create.isPending ||
                !name.trim() ||
                !fundingAccountId ||
                selectedObligationTypes.length === 0
              }
              onClick={() => void createTemplate()}
            >
              {create.isPending ? "Creating…" : "Create template"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {templates.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : templates.isError ? (
        <ErrorState
          title="Payment Run templates unavailable"
          description={
            templates.error instanceof Error
              ? templates.error.message
              : "Template configuration could not be loaded."
          }
          retry={{ label: "Retry", onClick: () => void templates.refetch() }}
        />
      ) : (templates.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No recurring run templates"
          description="Create a template when an obligation selection pattern repeats on a weekly or monthly operating cycle."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {templates.data?.data.map((template) => (
            <Card key={template.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {humanizePaymentValue(template.cadence)} · version{" "}
                      {template.version} · next{" "}
                      {new Date(template.next_generation_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={template.active ? "success" : "neutral"}>
                    {template.active ? "Active" : "Suspended"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {template.source_filters.obligation_types
                    .map(humanizePaymentValue)
                    .join(", ") || "All configured obligation types"}
                  {" · "}
                  up to {template.source_filters.max_items} items
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={suspend.isPending}
                      onClick={async () => {
                        try {
                          await suspend.mutateAsync(template.id);
                          toast.success("Template suspended");
                        } catch (error) {
                          toast.error(paymentOperationsErrorMessage(error));
                        }
                      }}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resume.isPending}
                      onClick={async () => {
                        try {
                          await resume.mutateAsync(template.id);
                          toast.success("Template resumed");
                        } catch (error) {
                          toast.error(paymentOperationsErrorMessage(error));
                        }
                      }}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={generate.isPending}
                    onClick={async () => {
                      try {
                        const result = await generate.mutateAsync({
                          templateId: template.id,
                          occurrenceAt: new Date().toISOString(),
                        });
                        toast.success(
                          `${result.run.run_number} generated as a draft`,
                        );
                      } catch (error) {
                        toast.error(paymentOperationsErrorMessage(error));
                      }
                    }}
                  >
                    Generate draft now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentOutcomeWorkflowSettings({ orgId }: { orgId: string }) {
  const activeBranchId = useActiveBranchId();
  const branches = useOperatingBranches(orgId);
  const workflows = useWorkflowDefinitions(orgId, "PAYMENTS");
  const triggers = useWorkflowTriggers(orgId);
  const deliveries = useWorkflowDeliveries(orgId, { limit: 50 });
  const createDefinition = useCreateWorkflowDefinition(orgId);
  const createVersion = useCreateWorkflowVersion(orgId);
  const publishVersion = usePublishWorkflowVersion(orgId);
  const createTrigger = useCreateWorkflowTrigger(orgId);
  const enableTrigger = useEnableWorkflowTrigger(orgId);
  const disableTrigger = useDisableWorkflowTrigger(orgId);

  const [name, setName] = useState("");
  const [taskTitle, setTaskTitle] = useState(
    "Review settled payment outcome",
  );
  const [branchId, setBranchId] = useState(activeBranchId ?? "");
  const [sourceType, setSourceType] = useState("PAYABLE");

  const createFollowUpWorkflow = async () => {
    const workflowKey = workflowKeyFromName(name);
    if (!workflowKey || !taskTitle.trim()) {
      toast.error("Workflow name and human review task are required.");
      return;
    }

    try {
      const definition = await createDefinition.mutateAsync({
        workflow_key: workflowKey,
        domain: "PAYMENTS",
        workflow_type: "PAYMENT_OUTCOME_FOLLOW_UP",
        name: name.trim(),
        description:
          "Human operational follow-up after authoritative payment outcome propagation.",
      });
      const version = await createVersion.mutateAsync({
        definitionId: definition.id,
        steps: [
          {
            key: "REVIEW_PAYMENT_OUTCOME",
            type: "HUMAN_TASK",
            title: taskTitle.trim(),
            assigned_role: "FINANCE",
            max_attempts: 5,
          },
          {
            key: "FOLLOW_UP_RECORDED",
            type: "NOOP",
            max_attempts: 1,
          },
        ],
      });
      await publishVersion.mutateAsync(version.id);
      await createTrigger.mutateAsync({
        definitionId: definition.id,
        input: {
          trigger_key: `${workflowKey}_SETTLED`,
          event_type: "payments.payment_outcome_propagated",
          scope: branchId ? "BRANCH" : "ORGANIZATION",
          branch_id: branchId || null,
          conditions: [
            {
              path: "payload.outcome_type",
              operator: "EQ",
              value: "SETTLED",
            },
            ...(sourceType
              ? [
                  {
                    path: "payload.source_type",
                    operator: "EQ" as const,
                    value: sourceType,
                  },
                ]
              : []),
          ],
          input_mapping: {
            payment_outcome_propagation_id:
              "payload.payment_outcome_propagation_id",
            payment_run_id: "payload.payment_run_id",
            payment_instruction_id: "payload.payment_instruction_id",
            source_type: "payload.source_type",
            source_id: "payload.source_id",
            amount: "payload.amount",
            currency: "payload.currency",
          },
        },
      });
      toast.success("Payment outcome workflow published and activated");
      setName("");
      await workflows.refetch();
      await triggers.refetch();
    } catch (error) {
      toast.error(paymentOperationsErrorMessage(error));
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Payment outcome workflows</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          WF-001 reacts only after the payment outcome has been propagated to the
          source domain. The configured workflow creates controlled human work; it
          does not retry, reverse, or initiate money movement.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Label htmlFor="workflow-name">Workflow name</Label>
              <Input
                id="workflow-name"
                className="mt-1"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Supplier settlement review"
              />
            </div>
            <div>
              <Label htmlFor="workflow-task">Human review task</Label>
              <Input
                id="workflow-task"
                className="mt-1"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workflow-source">Source type</Label>
              <select
                id="workflow-source"
                className={selectClassName}
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
              >
                <option value="">Any registered source</option>
                <option value="PAYABLE">Payable</option>
                <option value="REFUND">Refund</option>
                <option value="EXPENSE_REIMBURSEMENT">
                  Expense reimbursement
                </option>
                <option value="EMPLOYEE_PAYMENT">Employee payment</option>
                <option value="TAX_REMITTANCE">Tax remittance</option>
              </select>
            </div>
            <div>
              <Label htmlFor="workflow-branch">Trigger scope</Label>
              <select
                id="workflow-branch"
                className={selectClassName}
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
              >
                <option value="">Organization</option>
                {(branches.data?.branches ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} · {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Event: payments.payment_outcome_propagated · outcome = SETTLED.
              The version is published before its trigger is activated.
            </p>
            <Button
              disabled={
                createDefinition.isPending ||
                createVersion.isPending ||
                publishVersion.isPending ||
                createTrigger.isPending ||
                !name.trim()
              }
              onClick={() => void createFollowUpWorkflow()}
            >
              Create workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {workflows.isLoading || triggers.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : workflows.isError || triggers.isError ? (
        <ErrorState
          title="Workflow configuration unavailable"
          description="PAYMENTS workflow definitions or triggers could not be loaded."
          retry={{
            label: "Retry",
            onClick: () => {
              void workflows.refetch();
              void triggers.refetch();
            },
          }}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-5 py-4">
                <div className="text-sm font-semibold">PAYMENTS workflows</div>
                <div className="text-xs text-muted-foreground">
                  Published definitions remain separate from event triggers.
                </div>
              </div>
              {(workflows.data?.length ?? 0) === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  No PAYMENTS workflow definitions.
                </div>
              ) : (
                <div className="divide-y">
                  {workflows.data?.map((workflow) => (
                    <div key={workflow.id} className="px-5 py-3">
                      <div className="text-sm font-medium">{workflow.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {workflow.workflow_key} ·{" "}
                        {humanizePaymentValue(
                          workflow.workflow_type ?? "GENERAL",
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="border-b px-5 py-4">
                <div className="text-sm font-semibold">Event triggers</div>
                <div className="text-xs text-muted-foreground">
                  Active triggers have an explicit activation boundary and durable
                  delivery state.
                </div>
              </div>
              {(triggers.data?.length ?? 0) === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  No workflow triggers configured.
                </div>
              ) : (
                <div className="divide-y">
                  {triggers.data?.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {trigger.trigger_key}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {trigger.event_type} ·{" "}
                          {humanizePaymentValue(trigger.scope)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            trigger.status === "ACTIVE" ? "success" : "neutral"
                          }
                        >
                          {trigger.status}
                        </Badge>
                        {trigger.status === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={disableTrigger.isPending}
                            onClick={async () => {
                              try {
                                await disableTrigger.mutateAsync(trigger.id);
                                toast.success("Trigger disabled");
                              } catch (error) {
                                toast.error(paymentOperationsErrorMessage(error));
                              }
                            }}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={enableTrigger.isPending}
                            onClick={async () => {
                              try {
                                await enableTrigger.mutateAsync(trigger.id);
                                toast.success("Trigger enabled");
                              } catch (error) {
                                toast.error(paymentOperationsErrorMessage(error));
                              }
                            }}
                          >
                            Enable
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="border-b px-5 py-4">
            <div className="text-sm font-semibold">Recent trigger deliveries</div>
            <div className="text-xs text-muted-foreground">
              Delivery state is durable and separate from the originating payment
              outcome.
            </div>
          </div>
          {deliveries.isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">
              Loading trigger deliveries…
            </div>
          ) : (deliveries.data?.length ?? 0) === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              No event-trigger deliveries have been materialized yet.
            </div>
          ) : (
            <div className="divide-y">
              {deliveries.data?.slice(0, 20).map((delivery) => (
                <div
                  key={delivery.id}
                  className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {delivery.event_type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Event {delivery.domain_event_id.slice(0, 8)} · attempt{" "}
                      {delivery.attempt_count}
                      {delivery.last_error_reason
                        ? ` · ${delivery.last_error_reason}`
                        : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        delivery.status === "STARTED"
                          ? "success"
                          : delivery.status === "QUARANTINED"
                            ? "critical"
                            : delivery.status === "RETRYING"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {humanizePaymentValue(delivery.status)}
                    </Badge>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(delivery.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Payment workflows currently expose human tasks and platform-safe NOOP
          completion only. Automated domain actions should appear here only after a
          corresponding action is registered and governed on the backend.
        </CardContent>
      </Card>
    </section>
  );
}
