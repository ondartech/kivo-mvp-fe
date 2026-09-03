"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
  { label: "Settings", href: "/app/settings/business" },
  { label: "Team", href: "/app/settings/team" },
];

export function AppShell({ children, orgId = "org_demo" }: { children: React.ReactNode; orgId?: string }) {
  const pathname = usePathname();
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
            <div className="hidden sm:flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              demo — Lagos business
            </div>
            <div className="h-7 w-7 rounded-full bg-neutral-900 text-white grid place-items-center text-xs">O</div>
          </div>
        </div>
      </header>

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
