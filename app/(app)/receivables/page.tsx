import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

export default function ReceivablesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Receivables" description="Who owes me money, and what should I do? Overdue → Due today → Due soon." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              Overdue <Badge variant="critical">3</Badge>
            </div>
            <Card className="mt-2">
              <div className="divide-y">
                {[
                  { c: "Acme Ltd.", inv: "INV-1042", amt: "2400000", days: 4 },
                  { c: "Nova Studio", inv: "INV-1045", amt: "450000", days: 12 },
                ].map((r) => (
                  <div key={r.inv} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{r.c} · {r.inv}</div>
                      <div className="text-xs text-critical">{r.days} days overdue</div>
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums font-semibold">{formatMoney(r.amt, "NGN")}</div>
                      <Button size="sm" className="mt-1">
                        Remind
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <div className="text-sm font-semibold">Due today</div>
            <Card className="mt-2">
              <div className="p-4 flex justify-between">
                <div>Bello Consulting · INV-1043</div>
                <div className="tabular-nums font-medium">₦850k</div>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold">Outstanding</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">₦12.4m</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Overdue</span>
                <span className="tabular-nums font-medium text-critical">₦1.9m</span>
              </div>
              <div className="flex justify-between">
                <span>Due soon</span>
                <span className="tabular-nums">₦3.2m</span>
              </div>
              <div className="flex justify-between">
                <span>Current</span>
                <span className="tabular-nums">₦7.3m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
