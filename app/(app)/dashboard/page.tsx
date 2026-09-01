import { PageHeader } from "@/components/kivo/page-header";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/kivo/empty-state";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

export default function DashboardPage() {
  // Mock authoritative data — backend is truth, this is display
  const hasInvoices = true;

  if (!hasInvoices) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="What is owed · what is collected · what needs attention" />
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice and start tracking what you're owed."
          action={{ label: "Create invoice", href: "/app/invoices/new" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning"
        description="Acme Services · Lagos — overview for 23 Aug 2026"
        actions={
          <>
            <Link href="/app/invoices/new">
              <Button variant="secondary" size="sm">
                Create invoice
              </Button>
            </Link>
            <Link href="/app/customers/new">
              <Button size="sm">Add customer</Button>
            </Link>
          </>
        }
      />

      {/* Financial position — hierarchy, not equal KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</div>
            <div className="mt-2">
              <MoneyAmount amount="12400000" emphasis="primary" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">42 invoices · 18 due</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums text-critical">₦1.9m</span>
              <Badge variant="critical">7</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Needs attention</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Collected · May</div>
            <div className="mt-2">
              <MoneyAmount amount="7800000" emphasis="primary" />
            </div>
            <div className="text-xs text-success mt-1">+12% vs Apr</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Invoiced</div>
            <div className="mt-2">
              <MoneyAmount amount="20200000" emphasis="primary" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">This quarter</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attention required — primary */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <Badge variant="warning">7 overdue</Badge>
          </div>
          <Card className="mt-3">
            <div className="divide-y">
              {[
                { customer: "Acme Ltd.", invoice: "INV-1042", amount: "2400000", days: 4, viewed: "Yesterday", state: "OVERDUE" },
                { customer: "Bello Consulting", invoice: "INV-1043", amount: "850000", days: 0, viewed: "2h ago", state: "DUE_TODAY" },
                { customer: "Nova Studio", invoice: "INV-1045", amount: "450000", days: 12, viewed: "3 days ago", state: "OVERDUE" },
              ].map((r) => (
                <div key={r.invoice} className="flex items-center justify-between p-4 gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {r.customer} · {r.invoice}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.days === 0 ? "Due today" : `${r.days} days overdue`} · Viewed {r.viewed} · WhatsApp / Email
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">{formatMoney(r.amount, "NGN")}</div>
                    <div className="mt-1 flex gap-1 justify-end">
                      <Button size="sm">Remind</Button>
                      <Link href={`/app/invoices/${r.invoice}`}>
                        <Button size="sm" variant="secondary">
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent activity — secondary */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Recent invoices</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>INV-1046 · Maro Ltd</span>
                  <span className="tabular-nums font-medium">₦320k</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>INV-1045 · Nova Studio</span>
                  <span className="tabular-nums">₦450k — Issued</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>INV-1044 · Acme Ltd</span>
                  <span className="tabular-nums">₦2.4m — Viewed</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Recent payments</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-success">₦450,000 paid</span>
                  <span className="text-muted-foreground text-xs">Today · Acme</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>₦300,000 paid</span>
                  <span className="text-xs">Yesterday · Bello — ₦150k remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
