import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FinancialPositionCockpit } from "@/components/kivo/financial-summary";
import { AttentionList, type OverdueItem } from "@/components/kivo/attention-list";
import { DueSoonCard, type DueSoonItem } from "@/components/kivo/due-soon-card";
import {
  RecentActivityFeed,
  type RecentPaymentItem,
  type ActivityFeedItem,
} from "@/components/kivo/recent-activity-feed";

// Authoritative Mock Data — backend is truth, this reflects the real financial model
const overdueItems: OverdueItem[] = [
  {
    id: "inv-1042",
    invoiceNumber: "INV-1042",
    customerName: "Acme Ltd.",
    customerEmail: "finance@acme.ng",
    customerPhone: "0801 234 5678",
    amount: "2400000",
    daysOverdue: 4,
    lastViewedText: "yesterday",
    channelHint: "WhatsApp & Email",
  },
  {
    id: "inv-1043",
    invoiceNumber: "INV-1043",
    customerName: "Bello Consulting",
    customerEmail: "bello@example.com",
    customerPhone: "0802 345 6789",
    amount: "850000",
    daysOverdue: 2,
    lastViewedText: "2h ago",
    channelHint: "WhatsApp delivery",
  },
  {
    id: "inv-1045",
    invoiceNumber: "INV-1045",
    customerName: "Nova Studio",
    customerEmail: "accounts@nova.ng",
    customerPhone: "0803 456 7890",
    amount: "450000",
    daysOverdue: 12,
    lastViewedText: "3 days ago",
    channelHint: "Email sent",
  },
];

const dueSoonItems: DueSoonItem[] = [
  {
    id: "inv-1046",
    invoiceNumber: "INV-1046",
    customerName: "Maro Ltd",
    amount: "320000",
    dueText: "Due today",
    isDueToday: true,
  },
  {
    id: "inv-1048",
    invoiceNumber: "INV-1048",
    customerName: "Apex Media",
    amount: "1150000",
    dueText: "Due tomorrow",
  },
  {
    id: "inv-1049",
    invoiceNumber: "INV-1049",
    customerName: "Zenith Legal",
    amount: "600000",
    dueText: "Due in 4 days",
  },
];

const recentPayments: RecentPaymentItem[] = [
  {
    id: "pay-101",
    amount: "450000",
    customerName: "Acme Ltd.",
    invoiceNumber: "INV-1042",
    dateText: "Today · 11:30",
    method: "Bank transfer · GTB Ref 98213",
    remainingOutstanding: "1400000",
  },
  {
    id: "pay-100",
    amount: "300000",
    customerName: "Bello Consulting",
    invoiceNumber: "INV-1043",
    dateText: "Yesterday",
    method: "Paystack online",
    remainingOutstanding: "550000",
  },
  {
    id: "pay-099",
    amount: "450000",
    customerName: "Nova Studio",
    invoiceNumber: "INV-1044",
    dateText: "3 days ago",
    method: "Bank transfer · Access Bank",
    remainingOutstanding: "0",
  },
];

const activityTimeline: ActivityFeedItem[] = [
  {
    id: "act-1",
    title: "Payment confirmed · ₦450,000",
    detail: "Acme Ltd. paid toward INV-1042 via bank transfer",
    timeText: "11:30",
    type: "payment",
  },
  {
    id: "act-2",
    title: "Invoice viewed by buyer",
    detail: "INV-1045 opened via WhatsApp payment link",
    timeText: "2h ago",
    type: "view",
  },
  {
    id: "act-3",
    title: "Payment reminder delivered",
    detail: "INV-1042 reminder email delivered to finance@acme.ng",
    timeText: "Yesterday",
    type: "reminder",
  },
  {
    id: "act-4",
    title: "Invoice INV-1046 issued",
    detail: "Issued to Maro Ltd for ₦320,000.00",
    timeText: "2 days ago",
    type: "issue",
  },
];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cockpit Header (Clean, spacious, aligned with kivo-mvp-web) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--kivo-line)]">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--kivo-green-dark)]">
            Your Receivables
          </p>
          <div className="mt-1 flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.03em] text-[var(--kivo-ink)]">
              Good morning, Maro Labs
            </h1>
            <Badge variant="paid">CAC Verified</Badge>
          </div>
          <p className="mt-0.5 text-xs text-[var(--kivo-muted)]">
            Updated just now · Nigerian banking hours · NGN (₦)
          </p>
        </div>

        {/* Primary Action Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href={`/${orgId}/invoices/new`}>
            <Button size="md" variant="primary" className="shadow-sm">
              + Create invoice
            </Button>
          </Link>
          <Link href={`/${orgId}/payments/new`}>
            <Button size="md" variant="secondary">
              Record payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Position Hierarchy: 3 Clean Hero Cards + Aging Strip */}
      <FinancialPositionCockpit
        outstandingAmount="12400000"
        outstandingCount={42}
        overdueAmount="1900000"
        overdueCount={3}
        collectedAmount="7800000"
        invoicedAmount="20200000"
        upcomingAmount="2070000"
        upcomingCount={3}
        currency="NGN"
        periodLabel="September 2026"
        orgId={orgId}
      />

      {/* Two-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Actionable Collections & Upcoming Inflows (60%) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Overdue Items Requiring Follow-Up */}
          <AttentionList items={overdueItems} currency="NGN" orgId={orgId} />

          {/* Upcoming Inflows (Due today & soon) */}
          <DueSoonCard items={dueSoonItems} currency="NGN" orgId={orgId} />
        </div>

        {/* Right Column: Confirmed Cash Movements & System Context (40%) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Payments & Real-time Verified Timeline */}
          <RecentActivityFeed
            payments={recentPayments}
            activities={activityTimeline}
            currency="NGN"
            orgId={orgId}
          />

          {/* Business Payout & Billing Status */}
          <div className="rounded-2xl border border-[var(--kivo-line)] bg-white p-5 shadow-card space-y-3.5">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
              Workspace Health
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--kivo-muted)]">Default Payout</span>
                <span className="font-semibold text-[var(--kivo-ink)]">GTBank · ••••6789</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--kivo-muted)]">Commercial Plan</span>
                <span className="font-semibold text-[var(--kivo-ink)]">Starter Trial (14 days remaining)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--kivo-muted)]">Core Invoicing</span>
                <Badge variant="paid">Unlimited (No caps)</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--kivo-muted)]">Payment Gateway</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--kivo-green-dark)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--kivo-green)]" />
                  Active (Paystack)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--kivo-line)] flex justify-between items-center text-xs">
              <Link
                href={`/${orgId}/settings/business`}
                className="text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] underline underline-offset-4"
              >
                Business Profile
              </Link>
              <Link
                href={`/${orgId}/settings/subscription`}
                className="text-[var(--kivo-green-dark)] font-semibold hover:underline"
              >
                Manage Subscription →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
