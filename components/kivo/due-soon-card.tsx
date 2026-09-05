"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export interface DueSoonItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  dueText: string;
  isDueToday?: boolean;
}

export interface DueSoonCardProps {
  items: DueSoonItem[];
  currency?: string;
  orgId?: string;
}

export function DueSoonCard({
  items,
  currency = "NGN",
  orgId = "org_demo",
}: DueSoonCardProps) {
  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border border-[var(--kivo-line)] bg-white shadow-card">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-[var(--kivo-muted)]">
            No invoices due in the next 7 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--kivo-ink)]">
            Upcoming Inflows
          </h2>
          <Badge variant="viewed">{items.length} due soon</Badge>
        </div>
        <Link
          href={`/${orgId}/invoices`}
          className="text-xs text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] font-medium underline underline-offset-4"
        >
          View all invoices
        </Link>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="lift rounded-2xl border border-[var(--kivo-line)] bg-white p-4 shadow-card hover:border-[#ccd4ca]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${orgId}/invoices/${item.id}`}
                    className="font-mono text-xs text-[var(--kivo-muted)] hover:underline"
                  >
                    {item.invoiceNumber}
                  </Link>
                  <span className="text-[var(--kivo-muted)]">·</span>
                  <span className="text-sm text-[var(--kivo-ink)] font-semibold">
                    {item.customerName}
                  </span>
                  {item.isDueToday ? (
                    <Badge variant="warning">Due today</Badge>
                  ) : (
                    <Badge variant="neutral">{item.dueText}</Badge>
                  )}
                </div>
                <div className="text-xs text-[var(--kivo-muted)]">
                  Expected settlement in Nigerian banking hours
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--kivo-line)]">
                <span className="font-mono text-base font-bold tracking-tight text-[var(--kivo-ink)]">
                  {formatMoney(item.amount, currency)}
                </span>
                <Link href={`/${orgId}/invoices/${item.id}`}>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
