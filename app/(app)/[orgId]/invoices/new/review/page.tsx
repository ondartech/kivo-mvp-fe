"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export default function InvoiceReviewPage() {
  const params = useParams<{ orgId: string }>();
  const router = useRouter();
  const orgId = params?.orgId ?? "org_demo";

  const [isIssuing, setIsIssuing] = React.useState(false);

  // Authoritative Review Snapshot
  const invoiceData = {
    customerName: "Acme Ltd.",
    customerEmail: "finance@acme.ng",
    customerPhone: "+234 801 234 5678",
    sellerName: "Maro Labs",
    sellerTaxId: "BN 1234567",
    sellerAddress: "Victoria Island, Lagos",
    issueDate: "2026-09-04",
    dueDate: "2026-09-18",
    currency: "NGN",
    items: [
      {
        description: "March commercial software engagement & cloud advisory",
        quantity: "1",
        unitPrice: "2000000",
        total: "2000000",
      },
    ],
    subtotal: "2000000",
    taxRate: "0.075",
    taxTotal: "150000",
    grandTotal: "2150000",
  };

  const handleConfirmIssue = async () => {
    setIsIssuing(true);
    // Simulate server issue mutation
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsIssuing(false);
    toast.success("Invoice INV-1047 issued successfully with immutable ledger seal");
    router.push(`/${orgId}/invoices/inv-1042`);
  };

  return (
    <div className="space-y-6 max-w-[920px]">
      <PageHeader
        eyebrow="Pre-Issue Review · INV-003"
        title="Review invoice before issuance"
        description="Verify all amounts, tax, and buyer details. Issuance permanently seals the invoice as legally and financially immutable."
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/${orgId}/invoices/new`}>
              <Button variant="outline" size="sm" disabled={isIssuing}>
                Back to Edit
              </Button>
            </Link>
            <Button size="sm" onClick={handleConfirmIssue} loading={isIssuing}>
              Confirm & Issue Invoice
            </Button>
          </div>
        }
      />

      {/* Consequential Commitment Warning Banner (DESIGN.md P-08) */}
      <div className="rounded-xl border border-warning/40 bg-warning-subtle/40 p-4 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-xs text-warning">
          <span className="h-2 w-2 rounded-full bg-warning" />
          Consequential Financial Action: Immutability Guarantee
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Once issued, the backend assigns a sequential invoice number (e.g.{" "}
          <span className="font-mono font-medium text-foreground">INV-1047</span>) and generates a
          deterministic SHA-256 PDF hash. Issued invoices cannot be edited or deleted; corrections
          require voiding or issuing a replacement invoice.
        </p>
      </div>

      {/* Invoice Document Preview Card */}
      <Card className="rounded-xl border bg-surface shadow-subtle overflow-hidden">
        <CardContent className="p-8 space-y-8">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">
                PROFORMA INVOICE PREVIEW
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official number will be allocated on issuance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral">PRE-ISSUE DRAFT</Badge>
              <Badge variant="warning">UNPAID</Badge>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div className="space-y-1.5">
              <span className="uppercase tracking-wider font-semibold text-muted-foreground">
                Seller (Issuer)
              </span>
              <div className="text-sm font-bold text-foreground">{invoiceData.sellerName}</div>
              <div className="text-muted-foreground">{invoiceData.sellerAddress}</div>
              <div className="text-muted-foreground">Registration: {invoiceData.sellerTaxId}</div>
            </div>

            <div className="space-y-1.5">
              <span className="uppercase tracking-wider font-semibold text-muted-foreground">
                Bill To (Customer)
              </span>
              <div className="text-sm font-bold text-foreground">{invoiceData.customerName}</div>
              <div className="text-muted-foreground">{invoiceData.customerEmail}</div>
              <div className="text-muted-foreground">{invoiceData.customerPhone}</div>
            </div>
          </div>

          {/* Dates & Terms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs">
            <div>
              <span className="text-muted-foreground">Issue Date</span>
              <div className="font-medium text-foreground mt-0.5">{invoiceData.issueDate}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date</span>
              <div className="font-medium text-foreground mt-0.5">{invoiceData.dueDate}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Currency</span>
              <div className="font-medium text-foreground mt-0.5">NGN (₦)</div>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Method</span>
              <div className="font-medium text-foreground mt-0.5">Bank transfer / Paystack</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground pb-2 border-b">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {invoiceData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 text-xs py-3 border-b last:border-0 items-center">
                <div className="col-span-6 font-medium text-foreground">{item.description}</div>
                <div className="col-span-2 text-right font-mono tabular-nums">{item.quantity}</div>
                <div className="col-span-2 text-right font-mono tabular-nums">
                  {formatMoney(item.unitPrice, invoiceData.currency)}
                </div>
                <div className="col-span-2 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatMoney(item.total, invoiceData.currency)}
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown & Totals */}
          <div className="flex justify-end pt-4 border-t">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-foreground">
                  {formatMoney(invoiceData.subtotal, invoiceData.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>VAT (7.5%)</span>
                <span className="font-mono tabular-nums text-foreground">
                  {formatMoney(invoiceData.taxTotal, invoiceData.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t text-foreground">
                <span>Total Due</span>
                <span className="font-mono tabular-nums text-base">
                  {formatMoney(invoiceData.grandTotal, invoiceData.currency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href={`/${orgId}/invoices/new`}>
          <Button variant="ghost" size="sm">
            ← Return to edit
          </Button>
        </Link>
        <Button size="sm" onClick={handleConfirmIssue} loading={isIssuing}>
          Confirm & Issue Invoice
        </Button>
      </div>
    </div>
  );
}
