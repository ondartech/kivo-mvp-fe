import Link from "next/link";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyAmount } from "@/components/kivo/money-amount";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; invoiceId: string }>;
}) {
  const { orgId, invoiceId } = await params;
  const isPaid = invoiceId === "inv-1044";
  const isDraft = invoiceId === "inv-1045";

  return (
    <div className="space-y-6 max-w-[1100px]">
      <PageHeader
        eyebrow={`Invoice ${invoiceId.toUpperCase()}`}
        title={isDraft ? "Draft — review before issue" : "Acme Ltd. — ₦2,400,000"}
        description={
          isDraft
            ? "This invoice is not yet issued. Amount becomes immutable after issue."
            : "Issued · Sent · Viewed · Due in 4 days · Remind available"
        }
        actions={
          <div className="flex gap-2">
            <Link href={`/${orgId}/invoices`}>
              <Button variant="ghost" size="sm">Back</Button>
            </Link>
            {isDraft ? (
              <Button size="sm">Issue invoice — ₦2,400,000</Button>
            ) : (
              <Button variant="secondary" size="sm">Send / Share</Button>
            )}
            <Button variant="outline" size="sm">Download PDF</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={isDraft ? "neutral" : "info"}>{isDraft ? "DRAFT" : "ISSUED"}</Badge>
        <Badge variant={isPaid ? "success" : "warning"}>{isPaid ? "PAID" : "UNPAID"}</Badge>
        <Badge variant="critical">OVERDUE</Badge>
        <Badge variant="neutral">VIEWED</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Seller</div>
                  <div className="font-medium">Maro Labs · Lagos</div>
                  <div className="text-muted-foreground">BN 123456 · 08012345678</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</div>
                  <div className="font-medium">Acme Ltd.</div>
                  <div className="text-muted-foreground">acme@example.com · +234 801 234 5678</div>
                </div>
              </div>
              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span className="col-span-6">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-4 text-right">Amount</span>
                </div>
                <div className="mt-2 grid grid-cols-12 gap-2 text-sm">
                  <span className="col-span-6">March consulting engagement</span>
                  <span className="col-span-2 text-right tabular-nums">1</span>
                  <span className="col-span-4 text-right tabular-nums">₦2,000,000.00</span>
                </div>
              </div>
              <div className="mt-6 border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">₦2,000,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax 7.5%</span>
                  <span className="tabular-nums">₦150,000.00</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Total</span>
                  <MoneyAmount amount="2400000" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Activity</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="h-2 w-2 mt-2 rounded-full bg-success" />
                  <div>
                    <div className="font-medium">Invoice issued</div>
                    <div className="text-xs text-muted-foreground">23 Aug 2026 · 09:12 · Lagos</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="h-2 w-2 mt-2 rounded-full bg-info" />
                  <div>
                    <div className="font-medium">Invoice viewed</div>
                    <div className="text-xs text-muted-foreground">23 Aug 2026 · 10:02 · +234801···</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="h-2 w-2 mt-2 rounded-full bg-warning" />
                  <div>
                    <div className="font-medium">Reminder sent — Email</div>
                    <div className="text-xs text-muted-foreground">Yesterday · Delivered</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
