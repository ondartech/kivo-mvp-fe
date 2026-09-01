import { PageHeader } from "@/components/kivo/page-header";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  return (
    <div className="space-y-6 max-w-[1100px]">
      <PageHeader
        title="Acme Ltd."
        description="sola@acme.ng · 0801 234 5678 · Lagos"
        actions={<Button>Create invoice</Button>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</div>
            <div className="mt-2">
              <MoneyAmount amount="2400000" />
            </div>
            <div className="text-xs text-critical">4 days overdue · 1 invoice</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</div>
            <div className="mt-2 text-xl font-semibold tabular-nums text-critical">₦2.4m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Paid historically</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">₦8.2m</div>
            <div className="text-xs text-muted-foreground">12 invoices</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold">History</div>
          <div className="mt-3 divide-y text-sm">
            <div className="flex justify-between py-2">
              <span>INV-1042 · Issued · ₦2.4m</span>
              <span className="text-muted-foreground">23 Aug</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-success">₦1m paid · INV-1042</span>
              <span className="text-muted-foreground">20 Aug</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Reminder sent · Email</span>
              <span className="text-muted-foreground">19 Aug</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
