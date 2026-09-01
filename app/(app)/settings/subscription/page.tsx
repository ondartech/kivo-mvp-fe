import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionPage() {
  return (
    <div className="space-y-6 max-w-[880px]">
      <PageHeader title="Subscription" description="Plan · usage · entitlement · invoices created." />
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Free — 20 invoices</div>
              <div className="text-sm text-muted-foreground">₦0 / month · Upgrade for 1,000</div>
            </div>
            <Badge variant="warning">8 / 20 used</Badge>
          </div>
          <div className="mt-4 h-2 rounded-full bg-neutral-100">
            <div className="h-2 rounded-full bg-warning" style={{ width: "40%" }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Invoices reset monthly · Entitlement is display-only, backend enforces.</div>
          <Button className="mt-4">Upgrade to Pro</Button>
        </CardContent>
      </Card>
    </div>
  );
}
