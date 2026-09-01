"use client";

import { useState } from "react";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyAmount } from "@/components/kivo/money-amount";

/* Quick + Standard progressive disclosure — server authoritative totals */

export default function NewInvoicePage() {
  const [mode, setMode] = useState<"quick" | "standard">("quick");
  const [amount, setAmount] = useState("2400000");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("2400000");

  return (
    <div className="space-y-6 max-w-[960px]">
      <PageHeader
        title="Create invoice"
        description="Quick: Customer → Description → Amount → Due. Then Review → Issue (immutable)."
        actions={<Button variant="secondary">Save draft</Button>}
      />

      <div className="flex gap-2">
        <Button variant={mode === "quick" ? "primary" : "secondary"} size="sm" onClick={() => setMode("quick")}>
          Quick
        </Button>
        <Button variant={mode === "standard" ? "primary" : "secondary"} size="sm" onClick={() => setMode("standard")}>
          Standard
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Input id="customer" placeholder="Acme Ltd." className="mt-1" />
              </div>
              {mode === "quick" ? (
                <>
                  <div>
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" placeholder="March consulting engagement" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="amount">Amount (NGN)</Label>
                      <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 tabular-nums" />
                      <p className="text-xs text-muted-foreground mt-1">Decimal string — no float. Server calculates.</p>
                    </div>
                    <div>
                      <Label htmlFor="due">Due date</Label>
                      <Input id="due" type="date" className="mt-1" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border p-3 space-y-3">
                    <div className="text-sm font-medium">Line items</div>
                    <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground">
                      <span className="col-span-6">Description</span>
                      <span className="col-span-2">Qty</span>
                      <span className="col-span-4">Unit price</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <Input className="col-span-6" placeholder="Consulting" />
                      <Input className="col-span-2 tabular-nums" value={qty} onChange={(e) => setQty(e.target.value)} />
                      <Input className="col-span-4 tabular-nums" value={unit} onChange={(e) => setUnit(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Issue date</Label>
                      <Input type="date" className="mt-1" />
                    </div>
                    <div>
                      <Label>Due date</Label>
                      <Input type="date" className="mt-1" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Review</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">₦2,000,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax 7.5%</span>
                  <span className="tabular-nums">₦150,000.00</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <MoneyAmount amount={amount} emphasis="table" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Server authoritative. Frontend never calculates.</p>
              <Button className="w-full mt-4">Review invoice</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground">
              Nigeria-native: NGN · bank transfer details · WhatsApp share ready. PDF inherits this data.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
