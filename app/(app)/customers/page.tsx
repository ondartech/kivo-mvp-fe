import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

const customers = [
  { id: "c-acme", name: "Acme Ltd.", contact: "sola@acme.ng · 0801 234 5678", outstanding: "2400000", invoices: 4 },
  { id: "c-bello", name: "Bello Consulting", contact: "bello@example.com", outstanding: "850000", invoices: 2 },
  { id: "c-nova", name: "Nova Studio", contact: "hello@nova.ng", outstanding: "0", invoices: 6 },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Long-term data asset — Customer → invoices → outstanding → activity."
        actions={
          <Link href="/app/customers/new">
            <Button>Add customer</Button>
          </Link>
        }
      />

      <div className="flex gap-2">
        <Input placeholder="Search customer · name, email, phone" className="max-w-md" />
        <Badge>All</Badge>
        <Badge variant="neutral">Active</Badge>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 bg-neutral-50 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="col-span-4">Customer</span>
          <span className="col-span-3">Contact</span>
          <span className="col-span-2 text-right">Outstanding</span>
          <span className="col-span-1 text-center">Invoices</span>
          <span className="col-span-2"></span>
        </div>
        <div className="divide-y">
          {customers.map((c) => (
            <div key={c.id} className="grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center">
              <div className="md:col-span-4">
                <Link href={`/app/customers/${c.id}`} className="font-medium hover:underline">
                  {c.name}
                </Link>
                <div className="text-xs text-muted-foreground md:hidden">{c.contact}</div>
              </div>
              <div className="hidden md:block md:col-span-3 text-sm text-muted-foreground truncate">{c.contact}</div>
              <div className="md:col-span-2 text-right tabular-nums font-medium">{formatMoney(c.outstanding, "NGN")}</div>
              <div className="md:col-span-1 text-center text-sm">{c.invoices}</div>
              <div className="md:col-span-2 flex gap-1 justify-end">
                <Link href={`/app/customers/${c.id}`}>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" className="hidden md:inline-flex">
                  Create invoice
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
