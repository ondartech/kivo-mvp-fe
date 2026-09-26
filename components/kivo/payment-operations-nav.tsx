"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const items = [
  { href: "/app/payments", label: "Overview" },
  { href: "/app/payments/obligations", label: "Obligations" },
  { href: "/app/payments/runs", label: "Payment runs" },
  { href: "/app/payments/approvals", label: "Approvals" },
  { href: "/app/payments/executions", label: "Executions" },
  { href: "/app/payments/reconciliation", label: "Reconciliation" },
  { href: "/app/payments/templates", label: "Templates" },
] as const;

export function PaymentOperationsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Payment Operations"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {items.map((item) => {
        const active =
          item.href === "/app/payments"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button
            key={item.href}
            size="sm"
            variant={active ? "primary" : "outline"}
            asChild
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
