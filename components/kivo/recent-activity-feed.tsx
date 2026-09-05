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
  remainingOutstanding?: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  timeText: string;
  type: "payment" | "view" | "reminder" | "issue";
}

export function RecentActivityFeed({
  payments,
  activities,
  currency = "NGN",
}: {
  payments: RecentPaymentItem[];
  activities: ActivityFeedItem[];
  currency?: string;
}) {
  return (
    <div className="space-y-6">
      {/* Recent Confirmed Payments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Recent Payments
            </h2>
            <Badge variant="success">Confirmed</Badge>
          </div>
          <Link
            href="/app/payments"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            All payments
          </Link>
        </div>

        <Card className="rounded-xl border shadow-subtle overflow-hidden">
          <div className="divide-y">
            {payments.map((p) => (
              <div key={p.id} className="p-3.5 space-y-1 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-success tabular-nums">
                    +{formatMoney(p.amount, currency)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{p.dateText}</span>
                </div>
                <div className="text-xs text-foreground font-medium">
                  {p.customerName} <span className="text-muted-foreground font-mono">· {p.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{p.method}</span>
                  {p.remainingOutstanding ? (
                    <span className="text-muted-foreground">
                      Remaining: <span className="tabular-nums font-medium">{formatMoney(p.remainingOutstanding, currency)}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Operational Timeline
          </h2>
          <span className="text-xs text-muted-foreground">Verified events</span>
        </div>

        <Card className="rounded-xl border shadow-subtle p-4">
          <div className="space-y-3.5">
            {activities.map((act) => {
              const isPayment = act.type === "payment";
              const isView = act.type === "view";
              const isReminder = act.type === "reminder";
              return (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <span
                    className={`h-2 w-2 mt-1 rounded-full shrink-0 ${
                      isPayment
                        ? "bg-success"
                        : isView
                          ? "bg-info"
                          : isReminder
                            ? "bg-warning"
                            : "bg-neutral-400"
                    }`}
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-medium text-foreground">{act.title}</div>
                    <div className="text-muted-foreground truncate">{act.detail}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {act.timeText}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
