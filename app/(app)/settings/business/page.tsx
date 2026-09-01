import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BusinessSettingsPage() {
  return (
    <div className="space-y-6 max-w-[880px]">
      <PageHeader title="Business" description="Business identity used in invoices — name, address, logo. Frozen in snapshots after issue." />
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>Business name</Label>
            <Input defaultValue="Maro Labs" className="mt-1" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Contact email</Label>
              <Input defaultValue="hello@maro.ng" className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input defaultValue="0801 234 5678" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input defaultValue="Lekki Phase 1, Lagos" className="mt-1" />
          </div>
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <div className="font-medium">Logo</div>
            <div className="text-muted-foreground text-xs">PNG · 1:1 · Stored as Blob SAS logos/&#123;orgId&#125;/ · Shown in invoice PDF.</div>
            <Button variant="secondary" size="sm" className="mt-2">
              Upload logo
            </Button>
          </div>
          <Button>Save business</Button>
        </CardContent>
      </Card>
    </div>
  );
}
