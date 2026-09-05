"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RecordPaymentPage() {
  const params = useParams<{ orgId: string }>();
  const router = useRouter();
  const orgId = params?.orgId ?? "org_demo";

  const [invoiceNumber, setInvoiceNumber] = React.useState("INV-1042");
  const [customerName, setCustomerName] = React.useState("Acme Ltd.");
  const [amount, setAmount] = React.useState("450000");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = React.useState("BANK_TRANSFER");
  const [reference, setReference] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate server confirmation
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    toast.success(`Payment of ₦${Number(amount).toLocaleString()} recorded successfully`);
    router.push(`/${orgId}/payments`);
  };

  return (
    <div className="space-y-6 max-w-[720px]">
      <PageHeader
        title="Record payment"
        description="Record verified bank transfer or manual settlement against an outstanding invoice."
        actions={
          <Link href={`/${orgId}/payments`}>
            <Button variant="ghost" size="sm">Cancel</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="rounded-xl border bg-surface shadow-subtle">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoice">Invoice</Label>
                <Input
                  id="invoice"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-1042"
                  className="mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Acme Ltd."
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount received (NGN)</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="450000"
                  className="mt-1 font-mono tabular-nums"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Server verifies: amount cannot exceed invoice outstanding.
                </p>
              </div>
              <div>
                <Label htmlFor="date">Payment date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Payment method</Label>
                <select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="PAYSTACK">Paystack online</option>
                  <option value="CASH">Cash deposit</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <Label htmlFor="reference">Bank / Transaction reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="GTB Ref 98213 / Session ID"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Link href={`/${orgId}/payments`}>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" size="sm" loading={isSubmitting}>
                Confirm payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
