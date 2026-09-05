"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/money";

export interface OverdueItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  amount: string;
  daysOverdue: number;
  lastViewedText: string;
  channelHint: string;
}

export function AttentionList({
  items,
  currency = "NGN",
  orgId = "org_demo",
}: {
  items: OverdueItem[];
  currency?: string;
  orgId?: string;
}) {
  const [selectedItem, setSelectedItem] = React.useState<OverdueItem | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  const handleCopyWhatsApp = (item: OverdueItem) => {
    const text = `Hello ${item.customerName}, gentle reminder regarding invoice ${item.invoiceNumber} for ${formatMoney(item.amount, currency)}, which was due ${item.daysOverdue} days ago. Please find your payment link here: https://pay.kivo.ng/i/demo-${item.id}`;
    navigator.clipboard.writeText(text);
    toast.success("WhatsApp message & payment link copied to clipboard");
    setSelectedItem(null);
  };

  const handleSendEmailReminder = async (item: OverdueItem) => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSending(false);
    toast.success(`Reminder sent to ${item.customerEmail || item.customerName}`);
    setSelectedItem(null);
  };

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border border-[var(--kivo-line)] bg-white shadow-card">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--kivo-green-soft)] text-[var(--kivo-green-dark)]">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[var(--kivo-ink)]">All caught up 🎉</h3>
          <p className="mt-1 text-xs text-[var(--kivo-muted)] max-w-[40ch] mx-auto">
            You have no overdue invoices. All customer payments are current.
          </p>
          <div className="mt-4">
            <Link href={`/${orgId}/invoices/new`}>
              <Button size="sm" variant="secondary">
                Create new invoice
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="needs-attention" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--kivo-ink)]">
            Needs Attention
          </h2>
          <Badge variant="overdue">{items.length} overdue</Badge>
        </div>
        <Link
          href={`/${orgId}/receivables`}
          className="text-xs text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] font-medium underline underline-offset-4"
        >
          View all receivables
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--kivo-line)] bg-white shadow-card overflow-hidden">
        <div className="divide-y divide-[var(--kivo-line)]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-4.5 gap-3 hover:bg-[#fbfcf9] transition-all"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/${orgId}/invoices/${item.id}`}
                    className="text-sm font-semibold text-[var(--kivo-ink)] hover:text-[var(--kivo-green-dark)] hover:underline transition-colors"
                  >
                    {item.customerName}
                  </Link>
                  <span className="text-xs text-[var(--kivo-muted)] font-mono">
                    · {item.invoiceNumber}
                  </span>
                  <Badge variant="overdue">
                    {item.daysOverdue} {item.daysOverdue === 1 ? "day" : "days"} overdue
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--kivo-muted)] flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#466f9f]" />
                    Viewed {item.lastViewedText}
                  </span>
                  <span>·</span>
                  <span>{item.channelHint}</span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="text-base font-bold text-[#b4534d] tabular-nums">
                  {formatMoney(item.amount, currency)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setSelectedItem(item)}
                  >
                    Remind
                  </Button>
                  <Link href={`/${orgId}/invoices/${item.id}`}>
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remind Action Modal */}
      {selectedItem ? (
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Send Payment Reminder</DialogTitle>
              <DialogDescription>
                Follow up with {selectedItem.customerName} regarding{" "}
                <span className="font-semibold text-foreground">
                  {selectedItem.invoiceNumber} ({formatMoney(selectedItem.amount, currency)})
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div className="rounded-lg border bg-neutral-50/70 p-3 text-xs space-y-1">
                <div className="text-muted-foreground font-medium">Recipient</div>
                <div className="font-semibold text-foreground">
                  {selectedItem.customerName} {selectedItem.customerPhone ? `(${selectedItem.customerPhone})` : ""}
                </div>
                <div className="text-muted-foreground">
                  Status: {selectedItem.daysOverdue} days overdue · Last viewed {selectedItem.lastViewedText}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Choose Follow-Up Channel
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto py-3 px-3 text-left flex flex-col items-start gap-1"
                    onClick={() => handleCopyWhatsApp(selectedItem)}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      WhatsApp Copy
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Copies message with payment link
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto py-3 px-3 text-left flex flex-col items-start gap-1"
                    disabled={isSending}
                    onClick={() => handleSendEmailReminder(selectedItem)}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-info" />
                      Email Dispatch
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {isSending ? "Sending..." : "Sends formal reminder email"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedItem(null)}
                disabled={isSending}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
