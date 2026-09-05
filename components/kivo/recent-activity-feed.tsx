"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export interface RecentPaymentItem {
  id: string;
  amount: string;
  customerName: string;
  invoiceNumber: string;
  dateText: string;
  method: string;
  remainingOutstanding: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  timeText: string;
  type: "payment" | "view" | "reminder" | "issue";
}

export interface RecentActivityFeedProps {
  payments: RecentPaymentItem[];
  activities: ActivityFeedItem[];
  currency?: string;
  orgId?: string;
}

export function RecentActivityFeed({
  payments,
  activities,
  currency = "NGN",
  orgId = "org_demo",
}: RecentActivityFeedProps) {
  const [activeTab, setActiveTab] = React.useState<"payments" | "activity">("payments");

  return (
    <div className="rounded-2xl border border-[var(--kivo-line)] bg-white shadow-card">
      <div className="p-4 sm:p-5 pb-3.5 border-b border-[var(--kivo-line)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#f4f7f3] p-1 rounded-xl border border-[var(--kivo-line)]">
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "payments"
                  ? "bg-white text-[var(--kivo-ink)] shadow-xs"
                  : "text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)]"
              }`}
            >
              Recent Payments ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "activity"
                  ? "bg-white text-[var(--kivo-ink)] shadow-xs"
                  : "text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)]"
              }`}
            >
              Activity Feed
            </button>
          </div>

          <Link
            href={activeTab === "payments" ? `/${orgId}/payments` : `/${orgId}/audit`}
            className="text-xs text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] font-medium underline underline-offset-4"
          >
            {activeTab === "payments" ? "All payments" : "Audit log"}
          </Link>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === "payments" ? (
          <div className="space-y-3.5">
            {payments.length === 0 ? (
              <p className="text-xs text-[var(--kivo-muted)] text-center py-6">
                No confirmed payments recorded yet.
              </p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between gap-3 pb-3.5 border-b border-[var(--kivo-line)] last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--kivo-ink)]">
                        {payment.customerName}
                      </span>
                      <span className="text-xs text-[var(--kivo-muted)]">·</span>
                      <Link
                        href={`/${orgId}/invoices`}
                        className="font-mono text-xs text-[var(--kivo-muted)] hover:underline"
                      >
                        {payment.invoiceNumber}
                      </Link>
                    </div>
                    <div className="text-xs text-[var(--kivo-muted)]">
                      {payment.method} · {payment.dateText}
                    </div>
                    {payment.remainingOutstanding === "0" ? (
                      <Badge variant="paid" className="text-[10px] px-2 py-0">
                        Settled in full
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-[var(--kivo-muted)] font-mono">
                        Remaining: {formatMoney(payment.remainingOutstanding, currency)}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-[#2f7d3c] tabular-nums">
                      +{formatMoney(payment.amount, currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {activities.length === 0 ? (
              <p className="text-xs text-[var(--kivo-muted)] text-center py-6">
                No recent activity recorded.
              </p>
            ) : (
              activities.map((act) => {
                const getBadgeVariant = (type: ActivityFeedItem["type"]) => {
                  switch (type) {
                    case "payment":
                      return "paid" as const;
                    case "reminder":
                      return "warning" as const;
                    case "view":
                      return "info" as const;
                    case "issue":
                    default:
                      return "neutral" as const;
                  }
                };

                return (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 pb-3.5 border-b border-[var(--kivo-line)] last:border-0 last:pb-0"
                  >
                    <div className="mt-0.5">
                      <Badge variant={getBadgeVariant(act.type)} className="capitalize text-[10px] px-2 py-0">
                        {act.type}
                      </Badge>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--kivo-ink)]">
                          {act.title}
                        </span>
                        <span className="text-[11px] text-[var(--kivo-muted)] whitespace-nowrap">
                          {act.timeText}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--kivo-muted)]">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
