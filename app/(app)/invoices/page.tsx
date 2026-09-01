import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

const invoices = [
  { id: "inv-1042", number: "INV-1042", customer: "Acme Ltd.", amount: "2400000", outstanding: "2400000", due: "4 days overdue", doc: "ISSUED", pay: "UNPAID", col: "OVERDUE" },
  { id: "inv-1043", number: "INV-1043", customer: "Bello Consulting", amount: "850000", outstanding: "850000", due: "Due tomorrow", doc: "ISSUED", pay: "UNPAID", col: "DUE_SOON" },
  { id: "inv-1044", number: "INV-1044", customer: "Nova Studio", amount: "450000", outstanding: "0", due: "—", doc: "ISSUED", pay: "PAID", col: "CURRENT" },
  { id: "inv-1045", number: "—", customer: "Maro Ltd", amount: "320000", outstanding: "320000", due: "Draft", doc: "DRAFT", pay: "UNPAID", col: "CURRENT" },
];

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Customer · Amount · Outstanding · Due · State — sorted by attention."
        actions={
          <Link href="/app/invoices/new">
            <Button>Create invoice</Button>
          </Link>
        }
      />

      {/* Filters — practical, not BI */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="neutral">All</Badge>
        <Badge variant="critical">Overdue</Badge>
        <Badge>Draft</Badge>
        <Badge>Issued</Badge>
        <Badge variant="success">Paid</Badge>
        <span className="ml-auto text-xs text-muted-foreground">₦ · NGN · No float · Server totals</span>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Customer</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.customer}</TableCell>
              <TableCell className="tabular-nums">{inv.number}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(inv.amount, "NGN")}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatMoney(inv.outstanding, "NGN")}</TableCell>
              <TableCell className="text-xs">{inv.due}</TableCell>
              <TableCell>
                <span className="inline-flex gap-1">
                  <Badge variant={inv.doc === "DRAFT" ? "neutral" : inv.pay === "PAID" ? "success" : "info"}>{inv.doc}</Badge>
                  <Badge variant={inv.col === "OVERDUE" ? "critical" : inv.col === "DUE_SOON" ? "warning" : "neutral"}>
                    {inv.pay}
                  </Badge>
                </span>
              </TableCell>
              <TableCell>
                <Link href={`/app/invoices/${inv.id}`}>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mobile transformation — stacked */}
      <div className="md:hidden space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-lg border bg-surface p-4">
            <div className="flex justify-between">
              <span className="font-medium">{inv.customer}</span>
              <span className="tabular-nums font-semibold">{formatMoney(inv.amount, "NGN")}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {inv.number} · {inv.due}
            </div>
            <div className="mt-2 flex gap-2">
              <Badge>{inv.doc}</Badge>
              <Badge variant="critical">{inv.pay}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
