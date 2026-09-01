import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyAmount } from "@/components/kivo/money-amount";

/* Public invoice — no Kivo account, minimal PII, mobile-first, ETag, payment CTA */

export default function PublicInvoicePage({ params }: { params: { token: string } }) {
  const isPaid = false;
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <div className="text-center">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-brand text-brand-foreground font-semibold">K</div>
          <div className="mt-2 text-xs text-muted-foreground">Kivo · Trusted invoice</div>
        </div>

        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>INV-1042 · Issued 23 Aug 2026</span>
              <Badge variant={isPaid ? "success" : "warning"}>{isPaid ? "Paid" : "Unpaid"}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">From</div>
                <div className="font-medium">Maro Labs</div>
                <div className="text-muted-foreground">Lekki, Lagos · 0801 234 5678</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</div>
                <div className="font-medium">Acme Ltd.</div>
              </div>
            </div>
            <div className="mt-6">
              <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-4 text-right">Amount</span>
              </div>
              <div className="mt-2 grid grid-cols-12 gap-2 text-sm">
                <span className="col-span-6">March consulting</span>
                <span className="col-span-2 text-right tabular-nums">1</span>
                <span className="col-span-4 text-right tabular-nums">₦2,000,000.00</span>
              </div>
              <div className="mt-4 border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <MoneyAmount amount="2400000" />
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="tabular-nums font-medium">₦2,400,000.00</span>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-warning-subtle border border-warning/20 p-3 text-sm">
              <div className="font-medium text-warning">Due 30 Aug 2026 · 4 days overdue</div>
              <div className="text-warning/80 text-xs">Bank transfer · GTB 0123456789 · Ref INV-1042</div>
            </div>
            <Button className="w-full mt-4" size="lg">
              Pay ₦2,400,000 — Paystack
            </Button>
            <div className="mt-2 text-center text-xs text-muted-foreground">Secure · Paystack handoff · Backend confirmation required</div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">This is a secure Kivo invoice link · Token {params.token.slice(0, 8)}… · Revokable by sender</div>
      </div>
    </div>
  );
}
