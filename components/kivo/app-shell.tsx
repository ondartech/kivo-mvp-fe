"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOpenAttentionCount } from "@/features/foundation/api";

// Kivo wordmark — K with flow (avoid ₦/wallet/coin)
function KivoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-brand-foreground font-semibold text-sm">
        K
      </div>
      <span className="text-sm font-semibold tracking-tight">Kivo</span>
    </div>
  );
}

const nav = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Invoices", href: "/app/invoices" },
  { label: "Customers", href: "/app/customers" },
  { label: "Receivables", href: "/app/receivables" },
  { label: "Payments", href: "/app/payments" },
  { label: "Search", href: "/app/search" },
  { label: "Settings", href: "/app/settings/business" },
];

export function AppShell({ children, orgId = "org_demo" }: { children: React.ReactNode; orgId?: string }) {
  const pathname = usePathname();
  const [activeOrgId, setActiveOrgId] = useState(orgId);

  useEffect(() => {
    const stored = localStorage.getItem("orgId") ?? localStorage.getItem("organization_id");
    if (stored) setActiveOrgId(stored);
  }, [orgId]);

  const attention = useOpenAttentionCount(activeOrgId);
  const attentionCount = attention.data?.count ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 h-[64px] border-b bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href={`/app/dashboard`}>
              <KivoMark />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active ? "bg-neutral-100 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-neutral-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app/ask"
              className={cn(
                "inline-flex items-center rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover",
                pathname?.startsWith("/app/ask") && "ring-2 ring-ring",
              )}
            >
              Ask Ondar
            </Link>
            <Link
              href="/app/attention"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-neutral-50",
                pathname?.startsWith("/app/attention") && "bg-neutral-100"
              )}
              aria-label={`Attention${attentionCount ? `: ${attentionCount} open items` : ""}`}
            >
              <span>Attention</span>
              {attentionCount ? (
                <span
                  className={cn(
                    "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px]",
                    (attention.data?.critical ?? 0) > 0
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-foreground"
                  )}
                >
                  {attentionCount > 99 ? "99+" : attentionCount}
                </span>
              ) : null}
            </Link>
            <div className="hidden sm:flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              demo — Lagos business
            </div>
            <div className="h-7 w-7 rounded-full bg-neutral-900 text-white grid place-items-center text-xs">O</div>
          </div>
        </div>
      </header>

      {/* Mobile Ask remains primary; navigation is secondary. */}
      <div className="border-b bg-surface px-4 py-2 md:hidden">
        <Link
          href="/app/ask"
          className={cn(
            "flex w-full items-center justify-between rounded-lg border bg-neutral-50 px-3 py-2 text-sm font-medium",
            pathname?.startsWith("/app/ask") && "border-brand bg-surface",
          )}
        >
          <span>Ask Ondar</span>
          <span className="text-xs text-muted-foreground">Primary input</span>
        </Link>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center gap-1 overflow-x-auto border-b bg-surface px-4 py-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium border",
              pathname?.startsWith(item.href) ? "bg-brand text-brand-foreground" : "bg-surface"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6">{children}</main>

      <footer className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 text-xs text-muted-foreground border-t mt-8">
        Kivo — Nigeria-first. Globally credible. <span className="ml-2">₦ · Bank transfer · WhatsApp · Email · Paystack</span>
      </footer>
    </div>
  );
}
