import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Confirmed money — date · customer · invoice · amount · method · reference." />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">₦450,000 paid</div>
            <Badge variant="success">Confirmed</Badge>
          </div>
          <div className="text-sm text-muted-foreground">Acme Ltd. · INV-1042 · Bank transfer · GTB Ref 123 · 23 Aug 2026</div>
          <div className="text-xs text-success mt-1">Remaining: ₦1,400,000 outstanding</div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-surface p-6 text-center">
        <div className="text-sm font-medium">Record manual payment</div>
        <div className="text-sm text-muted-foreground">Amount · Date · Method · Reference — authoritative after server confirmation.</div>
        <Button className="mt-3">Record payment</Button>
      </div>
    </div>
  );
}
