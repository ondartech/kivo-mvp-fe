import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6 max-w-[760px]">
      <PageHeader title="Add customer" description="Fast — name is required, rest can be added later. After creation: Create invoice." />
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Acme Ltd." className="mt-1" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input placeholder="sola@acme.ng" className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="0801 234 5678" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input placeholder="Lekki, Lagos" className="mt-1" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button>Create customer</Button>
            <Button variant="secondary">Create & invoice</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
