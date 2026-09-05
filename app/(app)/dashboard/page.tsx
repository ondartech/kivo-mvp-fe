import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialPositionCockpit } from "@/components/kivo/financial-summary";
import { AttentionList, type OverdueItem } from "@/components/kivo/attention-list";
import { DueSoonCard, type DueSoonItem } from "@/components/kivo/due-soon-card";
import {
  RecentActivityFeed,
  type RecentPaymentItem,
  type ActivityFeedItem,
} from "@/components/kivo/recent-activity-feed";

// Authoritative Mock Data — represents backend financial truth
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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Operational Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Receivables Cockpit
            </h1>
            <span className="hidden sm:inline text-muted-foreground">·</span>
            <span className="text-sm font-medium text-foreground">Maro Labs</span>
            <Badge variant="success">CAC Verified</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Lagos business hours · Nigerian financial ledger · NGN (₦)
          </p>
        </div>

        {/* Primary Action Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/app/invoices/new">
            <Button size="sm" variant="primary">
              Create invoice
            </Button>
          </Link>
          <Link href="/app/payments">
            <Button size="sm" variant="secondary">
              Record payment
            </Button>
          </Link>
          <Link href="/app/customers/new">
            <Button size="sm" variant="outline">
              Add customer
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial Position Hierarchy: Outstanding, Overdue, Cashflow, Aging */}
      <FinancialPositionCockpit
        outstandingAmount="12400000"
        outstandingCount={42}
        overdueAmount="1900000"
        overdueCount={7}
        collectedAmount="7800000"
        invoicedAmount="20200000"
        currency="NGN"
        periodLabel="Q3 2026"
      />

      {/* Two-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Actionable Collections & Upcoming Inflows (60%) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Overdue Items Requiring Follow-Up */}
          <AttentionList items={overdueItems} currency="NGN" />

          {/* Upcoming Inflows (Due today & soon) */}
          <DueSoonCard items={dueSoonItems} currency="NGN" />
        </div>

        {/* Right Column: Confirmed Cash Movements & System Context (40%) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Payments & Real-time Verified Timeline */}
          <RecentActivityFeed
            payments={recentPayments}
            activities={activityTimeline}
            currency="NGN"
          />

          {/* Business Payout & Billing Status */}
          <Card className="rounded-xl border shadow-subtle p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Workspace Health
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Default Payout</span>
                <span className="font-medium text-foreground">GTBank · ••••6789</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plan Invoices</span>
                <span className="font-medium text-foreground">16 / 20 used (Starter)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Public Payment Gateway</span>
                <span className="inline-flex items-center gap-1 text-success font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active (Paystack)
                </span>
              </div>
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-xs">
              <Link
                href="/app/settings/business"
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Business Profile
              </Link>
              <Link
                href="/app/settings/subscription"
                className="text-foreground font-medium hover:underline"
              >
                Manage Billing →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
