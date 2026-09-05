import Link from "next/link";
import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

export default async function ReceivablesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receivables"
        description="Who owes me money, and what should I do? Overdue → Due today → Due soon."
        actions={
          <Link href={`/${orgId}/invoices/new`}>
            <Button size="sm">Create invoice</Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              Overdue <Badge variant="critical">3</Badge>
            </div>
            <Card className="mt-2">
              <div className="divide-y">
                {[
                  { c: "Acme Ltd.", id: "inv-1042", inv: "INV-1042", amt: "2400000", days: 4 },
                  { c: "Nova Studio", id: "inv-1045", inv: "INV-1045", amt: "450000", days: 12 },
                ].map((r) => (
                  <div key={r.inv} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">
                        <Link href={`/${orgId}/invoices/${r.id}`} className="hover:underline">
                          {r.c} · {r.inv}
                        </Link>
                      </div>
                      <div className="text-xs text-critical">{r.days} days overdue</div>
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums font-semibold">{formatMoney(r.amt, "NGN")}</div>
                      <Button size="sm" variant="secondary" className="mt-1">
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
              <div className="p-4 flex justify-between items-center">
                <div>
                  <Link href={`/${orgId}/invoices/inv-1043`} className="font-medium hover:underline">
                    Bello Consulting · INV-1043
                  </Link>
                  <div className="text-xs text-muted-foreground">Expected settlement today</div>
                </div>
                <div className="tabular-nums font-semibold">₦850,000.00</div>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold">Outstanding</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">₦12,400,000.00</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overdue</span>
                <span className="tabular-nums font-medium text-critical">₦1,900,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due soon</span>
                <span className="tabular-nums">₦3,200,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className="tabular-nums">₦7,300,000.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
