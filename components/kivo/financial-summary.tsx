import * as React from "react";
import Link from "next/link";
import { MoneyAmount, CompactMoney } from "@/components/kivo/money-amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface AgingBucket {
  label: string;
  amount: string;
  count: number;
  variant: "current" | "warning" | "critical";
}

export interface FinancialPositionProps {
  outstandingAmount: string;
  outstandingCount: number;
  overdueAmount: string;
  overdueCount: number;
  collectedAmount: string;
  invoicedAmount: string;
  currency?: string;
  periodLabel?: string;
  agingBuckets?: AgingBucket[];
  className?: string;
}

/**
 * Authoritative Financial Position Banner
 * Embodies DESIGN.md (§12) and COMPONENTS.md (§9):
 * Outstanding and Overdue take primary visual dominance; collected progress and aging provide context.
 */
export function FinancialPositionCockpit({
  outstandingAmount,
  outstandingCount,
  overdueAmount,
  overdueCount,
  collectedAmount,
  invoicedAmount,
  currency = "NGN",
  periodLabel = "This Quarter",
  agingBuckets = [
    { label: "0–7d", amount: "5100000", count: 18, variant: "current" },
    { label: "8–14d", amount: "3200000", count: 11, variant: "current" },
    { label: "15–30d", amount: "2200000", count: 6, variant: "warning" },
    { label: "31–60d", amount: "1200000", count: 4, variant: "critical" },
    { label: "60+d", amount: "700000", count: 3, variant: "critical" },
  ],
  className,
}: FinancialPositionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Primary Hero: Total Outstanding */}
        <div className="lg:col-span-5 rounded-xl border bg-surface p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <span>Total Outstanding</span>
              <span className="font-normal text-muted-foreground">
                {outstandingCount} open invoices
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground tabular-nums">
                {formatMoney(outstandingAmount, currency)}
              </div>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Total uncollected receivables across all active clients.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Authoritative ledger balance</span>
            <Link
              href="/app/receivables"
              className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
            >
              View receivables →
            </Link>
          </div>
        </div>

        {/* Immediate Risk: Overdue Exposure */}
        <div className="lg:col-span-3 rounded-xl border border-critical/20 bg-critical-subtle p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-critical font-semibold">
              <span>Overdue Risk</span>
              <Badge variant="critical">{overdueCount} invoices</Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-critical tabular-nums">
                {formatMoney(overdueAmount, currency)}
              </div>
            </div>
            <p className="mt-2 text-xs text-critical/90">
              Payment date has passed. Immediate follow-up recommended.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-critical/15">
            <a
              href="#needs-attention"
              className="text-xs font-semibold text-critical hover:underline inline-flex items-center gap-1"
            >
              Review {overdueCount} overdue items ↓
            </a>
          </div>
        </div>

        {/* Cashflow Progress: Collected vs Invoiced */}
        <div className="lg:col-span-4 rounded-xl border bg-surface p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <span>Cash Flow</span>
              <span className="text-xs font-normal text-muted-foreground">{periodLabel}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Collected</span>
                <span className="text-sm font-semibold text-success tabular-nums">
                  {formatMoney(collectedAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Total Invoiced</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(invoicedAmount, currency)}
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-4 space-y-1.5">
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden flex">
                <div
                  className="bg-success rounded-full"
                  style={{ width: "38.6%" }}
                  role="progressbar"
                  aria-valuenow={38.6}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>38.6% collection rate</span>
                <span className="text-success font-medium">+12% vs last month</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Bank transfer & Paystack</span>
            <Link href="/app/payments" className="font-medium text-foreground hover:underline">
              Payment ledger →
            </Link>
          </div>
        </div>
      </div>

      {/* Receivables Aging Stack Strip */}
      <div className="rounded-xl border bg-surface p-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Receivables Aging
            </span>
            <span className="text-xs text-muted-foreground">· By days since due date</span>
          </div>
          <span className="text-xs text-muted-foreground">Time basis: due_date</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {agingBuckets.map((b) => {
            const isCritical = b.variant === "critical";
            const isWarning = b.variant === "warning";
            return (
              <div
                key={b.label}
                className={cn(
                  "rounded-lg border p-2.5 transition-colors",
                  isCritical
                    ? "bg-critical-subtle/40 border-critical/30"
                    : isWarning
                      ? "bg-warning-subtle/40 border-warning/30"
                      : "bg-neutral-50/50 border-border"
                )}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={cn(
                      "font-semibold",
                      isCritical
                        ? "text-critical"
                        : isWarning
                          ? "text-warning"
                          : "text-muted-foreground"
                    )}
                  >
                    {b.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {b.count} inv
                  </span>
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold tabular-nums mt-1",
                    isCritical ? "text-critical" : "text-foreground"
                  )}
                >
                  {formatMoney(b.amount, currency)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Backwards-compatible components ──────────────────────────────────────────

interface Metric {
  label: string;
  amount: string;
  currency?: string;
  hint?: string;
  emphasis?: "primary" | "secondary";
}

export function FinancialSummary({
  metrics,
  className,
}: {
  metrics: Metric[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {m.label}
          </div>
          <div className="mt-2">
            <MoneyAmount
              amount={m.amount}
              currency={m.currency}
              emphasis={m.emphasis ?? "primary"}
            />
          </div>
          {m.hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function OutstandingAmount({
  amount,
  dueLabel,
  currency = "NGN",
  className,
}: {
  amount: string;
  dueLabel?: string;
  currency?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <MoneyAmount amount={amount} currency={currency} emphasis="primary" />
      <span className="text-sm text-muted-foreground">outstanding</span>
      {dueLabel ? <span className="text-xs text-critical">· {dueLabel}</span> : null}
    </div>
  );
}
