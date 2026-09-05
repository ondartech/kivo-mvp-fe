import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export interface DueSoonItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  dueText: string;
  isDueToday?: boolean;
}

export function DueSoonCard({
  items,
  currency = "NGN",
}: {
  items: DueSoonItem[];
  currency?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Upcoming Inflows
        </h2>
        <span className="text-xs text-muted-foreground">Due next 7 days</span>
      </div>

      <Card className="rounded-xl border shadow-subtle overflow-hidden">
        <div className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 hover:bg-neutral-50/50 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/app/invoices/${item.id}`}
                    className="text-sm font-medium hover:underline text-foreground truncate"
                  >
                    {item.customerName}
                  </Link>
                  <span className="text-xs text-muted-foreground font-mono">
                    · {item.invoiceNumber}
                  </span>
                </div>
                <div className="text-xs">
                  {item.isDueToday ? (
                    <Badge variant="warning">Due today</Badge>
                  ) : (
                    <span className="text-muted-foreground">{item.dueText}</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {formatMoney(item.amount, currency)}
                </div>
                <Link
                  href={`/app/invoices/${item.id}`}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  View invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
