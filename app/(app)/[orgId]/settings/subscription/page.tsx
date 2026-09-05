"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/kivo/page-header";
import {
  type PlanCode,
  useChangePlan,
  useEntitlements,
  useSubscription,
} from "@/features/billing/api";
import { formatMoney } from "@/lib/money";

interface PlanTierDef {
  code: PlanCode;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  maxUsers: number;
  hasProjects: boolean;
  hasQuotes: boolean;
}

const TIERS: PlanTierDef[] = [
  {
    code: "STARTER",
    name: "Starter",
    price: "2500",
    tagline: "Invoice and get paid",
    features: [
      "Unlimited invoices & deterministic PDFs",
      "Public invoice pages with view tracking",
      "Manual and Paystack online payments",
      "Receivables tracking & basic email reminders",
      "Single user workspace",
    ],
    maxUsers: 1,
    hasProjects: false,
    hasQuotes: false,
  },
  {
    code: "PROFESSIONAL",
    name: "Professional",
    price: "7500",
    tagline: "Sell, invoice and collect",
    features: [
      "Everything in Starter",
      "Commercial Quotes & Quote-to-Invoice conversion",
      "Recurring invoices & automated collection sequences",
      "Advanced reporting & receivables aging",
      "Basic AI financial insights",
      "Up to 5 team members with role assignments",
    ],
    maxUsers: 5,
    hasProjects: false,
    hasQuotes: true,
  },
  {
    code: "BUSINESS",
    name: "Business",
    price: "15000",
    tagline: "Manage the work behind the money",
    features: [
      "Everything in Professional",
      "Client Projects & Milestone billing",
      "Bank reconciliation & payment matching",
      "Cashflow visibility & project profitability",
      "Granular governance, approvals & audit trail",
      "Up to 15 team members",
    ],
    maxUsers: 15,
    hasProjects: true,
    hasQuotes: true,
  },
];

export default function SubscriptionPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? "org_demo";

  const { data: subscription, isLoading: isSubLoading } = useSubscription(orgId);
  const { data: entitlements } = useEntitlements(orgId);
  const changePlanMutation = useChangePlan(orgId);

  const [selectedPlan, setSelectedPlan] = React.useState<PlanTierDef | null>(null);

  const currentPlanCode = subscription?.plan?.code || "STARTER";
  const currentStatus = subscription?.status || "TRIAL";

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;
    try {
      await changePlanMutation.mutateAsync({ plan_code: selectedPlan.code });
      toast.success(`Successfully switched to the ${selectedPlan.name} plan`);
      setSelectedPlan(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch plan");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Subscription & Plans"
        description="Manage your organization's subscription tier, capability entitlements, and billing."
      />

      {/* Current Subscription Status Banner */}
      <Card className="rounded-xl border bg-surface shadow-subtle overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Current Plan
                </span>
                <Badge
                  variant={
                    currentStatus === "ACTIVE"
                      ? "success"
                      : currentStatus === "TRIAL"
                        ? "warning"
                        : "critical"
                  }
                >
                  {currentStatus === "TRIAL" ? "14-Day Free Trial" : currentStatus}
                </Badge>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
                <span>{subscription?.plan?.name || "Starter"}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({formatMoney(subscription?.plan?.monthly_price || "2500", "NGN")}/mo)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Core commercial activity (invoicing, PDF downloads, payments) is always unlimited.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-muted-foreground space-y-1">
              <div>
                Next renewal:{" "}
                <span className="font-medium text-foreground">
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "End of month"}
                </span>
              </div>
              <div>Billing currency: NGN (₦)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage & Limits Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border bg-surface p-4 shadow-subtle">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Team Members
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">
            1 / {entitlements?.limits?.["users.max"] ?? 1}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Active users in workspace</p>
        </Card>

        <Card className="rounded-xl border bg-surface p-4 shadow-subtle">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Projects
          </div>
          <div className="text-xl font-bold mt-1 tabular-nums">
            {entitlements?.capabilities?.["projects.enabled"] ? "0 / 25" : "0 / 0"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {entitlements?.capabilities?.["projects.enabled"]
              ? "Active commercial projects"
              : "Available on Business"}
          </p>
        </Card>

        <Card className="rounded-xl border bg-surface p-4 shadow-subtle">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Monthly Invoices
          </div>
          <div className="text-xl font-bold mt-1 text-success flex items-center gap-1.5">
            <span>Unlimited</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">No artificial document caps</p>
        </Card>
      </div>

      {/* Plan Tier Matrix */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Available Commercial Plans
          </h2>
          <p className="text-xs text-muted-foreground">
            Upgrade anytime for higher collaboration and operational capabilities. Downgrades
            preserve all historical records.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const isCurrent = currentPlanCode === tier.code;
            return (
              <Card
                key={tier.code}
                className={`rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-foreground/40 bg-surface ring-1 ring-foreground/20 shadow-md"
                    : "bg-surface shadow-subtle hover:border-neutral-300"
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">{tier.name}</CardTitle>
                    {isCurrent ? <Badge variant="neutral">Active</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{tier.tagline}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-foreground tabular-nums">
                      {formatMoney(tier.price, "NGN")}
                    </span>
                    <span className="text-xs text-muted-foreground"> / month</span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg
                          className="h-4 w-4 text-success shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      size="sm"
                      variant={isCurrent ? "outline" : "primary"}
                      disabled={isCurrent || changePlanMutation.isPending}
                      onClick={() => setSelectedPlan(tier)}
                    >
                      {isCurrent
                        ? "Current Plan"
                        : tier.code === "BUSINESS"
                          ? "Upgrade to Business"
                          : tier.code === "PROFESSIONAL"
                            ? "Switch to Professional"
                            : "Downgrade to Starter"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Plan Change Confirmation Modal */}
      {selectedPlan ? (
        <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Confirm Plan Change</DialogTitle>
              <DialogDescription>
                Switch your organization subscription from{" "}
                <span className="font-semibold text-foreground">{currentPlanCode}</span> to{" "}
                <span className="font-semibold text-foreground">{selectedPlan.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="rounded-lg border bg-neutral-50/70 p-3.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">New Plan:</span>
                  <span className="font-bold text-foreground">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Fee:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {formatMoney(selectedPlan.price, "NGN")}/month
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Team User Limit:</span>
                  <span className="font-medium text-foreground">
                    Up to {selectedPlan.maxUsers} users
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-info/30 bg-info-subtle/30 p-3 text-info text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-info" />
                  Historical Data Guarantee (ENT-004)
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Downgrading or upgrading never deletes or hides existing records. All your
                  past invoices, quotes, projects, and payments remain preserved and readable.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedPlan(null)}
                disabled={changePlanMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPlanChange}
                disabled={changePlanMutation.isPending}
              >
                {changePlanMutation.isPending ? "Updating..." : "Confirm & Switch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
