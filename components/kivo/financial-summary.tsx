import * as React from "react";
import Link from "next/link";
import { MoneyAmount, CompactMoney } from "@/components/kivo/money-amount";
import { Badge } from "@/components/ui/badge";
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
  upcomingAmount?: string;
  upcomingCount?: number;
  dueTodayCount?: number;
  dueTodayAmount?: string;
  currency?: string;
  periodLabel?: string;
  agingBuckets?: AgingBucket[];
  className?: string;
  orgId?: string;
}

export function FinancialPositionCockpit({
  outstandingAmount,
  outstandingCount,
  overdueAmount,
  overdueCount,
  collectedAmount,
  invoicedAmount,
  upcomingAmount = "2070000",
  upcomingCount = 3,
  dueTodayCount = 1,
  dueTodayAmount = "320000",
  currency = "NGN",
  periodLabel = "This Month",
  agingBuckets = [
    { label: "0–7d", amount: "5100000", count: 18, variant: "current" },
    { label: "8–14d", amount: "3200000", count: 11, variant: "current" },
    { label: "15–30d", amount: "2200000", count: 6, variant: "warning" },
    { label: "31–60d", amount: "1200000", count: 4, variant: "critical" },
    { label: "60+d", amount: "700000", count: 3, variant: "critical" },
  ],
  className,
  orgId = "org_demo",
}: FinancialPositionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* 3 Calm, High-Impact Hero Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hero Card 1: Total Outstanding */}
        <div className="lift rounded-2xl border border-[var(--kivo-line)] bg-white p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
                You&apos;re owed
              </span>
              <span className="text-[11px] font-medium text-[var(--kivo-muted)]">
                {outstandingCount} open
              </span>
            </div>

            <div className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-[var(--kivo-ink)] tabular-nums">
              {formatMoney(outstandingAmount, currency)}
            </div>

            {/* Overdue exposure pill */}
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium status-overdue">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b4534d]" />
                {overdueCount} overdue invoices ({formatMoney(overdueAmount, currency)})
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--kivo-line)] flex items-center justify-between text-xs">
            <span className="text-[var(--kivo-muted)]">Active receivables</span>
            <Link
              href={`/${orgId}/receivables`}
              className="font-medium text-[var(--kivo-green-dark)] hover:underline inline-flex items-center gap-1"
            >
              View receivables →
            </Link>
          </div>
        </div>

        {/* Hero Card 2: Collected Cash Movement with SVG Sparkline */}
        <div className="lift rounded-2xl border border-[var(--kivo-line)] bg-white p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
                Collected
              </span>
              <span className="text-[11px] font-medium text-[var(--kivo-muted)]">
                {periodLabel}
              </span>
            </div>

            <div className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-[var(--kivo-ink)] tabular-nums">
              {formatMoney(collectedAmount, currency)}
            </div>

            {/* Visual Sparkline Wave from kivo-mvp-web */}
            <div className="mt-3 h-9 overflow-hidden rounded-xl bg-[var(--kivo-green-soft)] px-2.5 pt-2.5 border border-[#dce8d8]">
              <svg
                viewBox="0 0 160 30"
                className="h-full w-full"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 22 C18 17, 22 25, 37 19 C51 13, 58 21, 74 15 C88 9, 92 18, 109 10 C126 3, 140 13, 160 4"
                  stroke="var(--kivo-green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--kivo-line)] flex items-center justify-between text-xs">
            <span className="text-[var(--kivo-green-dark)] font-medium inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--kivo-green)]" />
              +12% vs last month
            </span>
            <Link
              href={`/${orgId}/payments`}
              className="font-medium text-[var(--kivo-green-dark)] hover:underline inline-flex items-center gap-1"
            >
              Ledger →
            </Link>
          </div>
        </div>

        {/* Hero Card 3: Upcoming Inflows / Settling Soon */}
        <div className="lift rounded-2xl border border-[var(--kivo-line)] bg-white p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
                Upcoming (Next 7d)
              </span>
              <span className="text-[11px] font-medium text-[var(--kivo-muted)]">
                {upcomingCount} expected
              </span>
            </div>

            <div className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-[var(--kivo-ink)] tabular-nums">
              {formatMoney(upcomingAmount, currency)}
            </div>

            {/* Due today notice */}
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium status-viewed">
                <span className="h-1.5 w-1.5 rounded-full bg-[#927b31]" />
                {dueTodayCount} due today ({formatMoney(dueTodayAmount, currency)})
              </span>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--kivo-line)] flex items-center justify-between text-xs">
            <span className="text-[var(--kivo-muted)]">Nigerian banking hours</span>
            <Link
              href={`/${orgId}/invoices`}
              className="font-medium text-[var(--kivo-green-dark)] hover:underline inline-flex items-center gap-1"
            >
              All invoices →
            </Link>
          </div>
        </div>
      </div>

      {/* Sleek Receivables Aging Breakdown Strip */}
      <div className="rounded-2xl border border-[var(--kivo-line)] bg-white p-4 sm:p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
              Aging Breakdown
            </span>
            <span className="text-xs text-[var(--kivo-muted)]">· Days since due date</span>
          </div>
          <span className="text-xs text-[var(--kivo-muted)]">Time basis: due_date</span>
        </div>

        {/* Multi-segment visual bar */}
        <div className="h-2 w-full rounded-full bg-[#edf1ea] overflow-hidden flex my-3">
          <div style={{ width: "41%" }} className="bg-[#2f7d3c] h-full" title="0-7d: ₦5.1M" />
          <div style={{ width: "26%" }} className="bg-[#5ea86b] h-full" title="8-14d: ₦3.2M" />
          <div style={{ width: "18%" }} className="bg-[#d4a338] h-full" title="15-30d: ₦2.2M" />
          <div style={{ width: "10%" }} className="bg-[#e07768] h-full" title="31-60d: ₦1.2M" />
          <div style={{ width: "5%" }} className="bg-[#b4534d] h-full" title="60+d: ₦700k" />
        </div>

        {/* Breakdown Buckets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 pt-1">
          {agingBuckets.map((b) => {
            const isCritical = b.variant === "critical";
            const isWarning = b.variant === "warning";
            return (
              <div
                key={b.label}
                className={cn(
                  "rounded-xl border p-2.5 transition-all duration-150",
                  isCritical
                    ? "bg-[#fdf0ee] border-[#fad4ce] text-[#b4534d]"
                    : isWarning
                      ? "bg-[#fbf5df] border-[#faeab1] text-[#927b31]"
                      : "bg-[#fbfcf9] border-[var(--kivo-line)] text-[var(--kivo-ink)]"
                )}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold">{b.label}</span>
                  <span className="text-[10px] opacity-75">{b.count} inv</span>
                </div>
                <div className="text-sm font-semibold tabular-nums mt-1">
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
        <div
          key={m.label}
          className="lift rounded-2xl border border-[var(--kivo-line)] bg-white p-5 shadow-card hover:border-[#ccd4ca]"
        >
          <div className="text-[11px] font-semibold text-[var(--kivo-muted)] uppercase tracking-[0.14em]">
            {m.label}
          </div>
          <div className="mt-2.5">
            <MoneyAmount
              amount={m.amount}
              currency={m.currency}
              emphasis={m.emphasis ?? "primary"}
            />
          </div>
          {m.hint ? (
            <div className="mt-1 text-xs text-[var(--kivo-muted)]">{m.hint}</div>
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
