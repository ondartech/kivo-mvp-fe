"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/kivo/command-palette";

function KivoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--kivo-green)] text-xs font-semibold text-white shadow-sm">
        K
      </span>
      <span className="text-sm font-semibold tracking-tight text-[var(--kivo-ink)]">Kivo</span>
    </div>
  );
}

export function AppShell({
  children,
  orgId = "org_demo",
}: {
  children: React.ReactNode;
  orgId?: string;
}) {
  const pathname = usePathname();
  const [isNewMenuOpen, setIsNewMenuOpen] = React.useState(false);
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", href: `/${orgId}/dashboard` },
    { label: "Customers", href: `/${orgId}/customers` },
    { label: "Invoices", href: `/${orgId}/invoices` },
    { label: "Receivables", href: `/${orgId}/receivables` },
    { label: "Payments", href: `/${orgId}/payments` },
    { label: "Settings", href: `/${orgId}/settings/business` },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--kivo-cream)] text-[var(--kivo-ink)]">
      {/* Ambient background glows */}
      <div className="hero-glow pointer-events-none absolute inset-0 -z-0 opacity-60" />
      <div className="hero-grid pointer-events-none absolute inset-0 -z-0 opacity-40" />

      {/* Top Application Header */}
      <header className="sticky top-0 z-40 h-[64px] border-b border-[var(--kivo-line)] bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
          {/* Brand & Org Switcher */}
          <div className="flex items-center gap-6">
            <Link href={`/${orgId}/dashboard`}>
              <KivoMark />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--kivo-muted)] border-l border-[var(--kivo-line)] pl-4 py-1">
              <span className="h-2 w-2 rounded-full bg-[var(--kivo-green)]" />
              <span className="font-semibold text-[var(--kivo-ink)]">Maro Labs</span>
              <span className="text-[var(--kivo-muted)] text-[10px]">▾</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.label !== "Dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-sm transition-all duration-150",
                      active
                        ? "bg-[var(--kivo-green-soft)] text-[var(--kivo-green-dark)] font-semibold shadow-xs"
                        : "text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] hover:bg-[#f4f7f3] font-medium"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:inline-flex items-center gap-2 rounded-xl border border-[var(--kivo-line)] bg-white px-3 py-1.5 text-xs text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] hover:border-[#ccd4ca] transition-all shadow-sm"
            >
              <span>Search</span>
              <kbd className="pointer-events-none rounded bg-[var(--kivo-cream)] border border-[var(--kivo-line)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--kivo-muted)]">
                ⌘K
              </kbd>
            </button>

            {/* Global + New Action Menu */}
            <div className="relative" ref={menuRef}>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="gap-1.5 shadow-sm"
              >
                <span>+ New</span>
                <span className="text-[10px]">▾</span>
              </Button>

              {isNewMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--kivo-line)] bg-white p-2 shadow-card z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
                    Invoicing & Cash
                  </div>
                  <Link
                    href={`/${orgId}/invoices/new`}
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] hover:text-[var(--kivo-green-dark)] transition-colors"
                  >
                    <span>Create invoice</span>
                    <span className="font-mono text-[10px] text-[var(--kivo-muted)]">INV</span>
                  </Link>
                  <Link
                    href={`/${orgId}/customers/new`}
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] hover:text-[var(--kivo-green-dark)] transition-colors"
                  >
                    <span>Add customer</span>
                    <span className="font-mono text-[10px] text-[var(--kivo-muted)]">CUST</span>
                  </Link>
                  <Link
                    href={`/${orgId}/payments/new`}
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] hover:text-[var(--kivo-green-dark)] transition-colors"
                  >
                    <span>Record payment</span>
                    <span className="font-mono text-[10px] text-[var(--kivo-muted)]">PAY</span>
                  </Link>

                  <div className="my-1.5 border-t border-[var(--kivo-line)]" />

                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--kivo-muted)]">
                    Commercial Work
                  </div>
                  <Link
                    href={`/${orgId}/projects/new`}
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] hover:text-[var(--kivo-green-dark)] transition-colors"
                  >
                    <span>Create project</span>
                    <span className="rounded-md bg-[var(--kivo-green-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--kivo-green-dark)]">
                      Pro
                    </span>
                  </Link>
                  <Link
                    href={`/${orgId}/quotes/new`}
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] hover:text-[var(--kivo-green-dark)] transition-colors"
                  >
                    <span>Create quote</span>
                    <span className="rounded-md bg-[var(--kivo-green-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--kivo-green-dark)]">
                      Pro
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Plan / Subscription status */}
            <Link
              href={`/${orgId}/settings/subscription`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#faeab1] bg-[#fbf5df] px-3 py-1 text-xs font-medium text-[#927b31] hover:opacity-90 transition-all"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#927b31]" />
              <span>Starter Trial</span>
            </Link>

            {/* User Profile Avatar */}
            <Link
              href={`/${orgId}/settings/subscription`}
              className="h-8 w-8 rounded-full bg-[var(--kivo-ink)] text-white grid place-items-center text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              title="Subscription & Settings"
            >
              O
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <nav className="flex lg:hidden items-center gap-1.5 overflow-x-auto border-b border-[var(--kivo-line)] bg-white/95 px-4 py-2.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.label !== "Dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium border transition-all",
                active
                  ? "bg-[var(--kivo-green)] text-white border-[var(--kivo-green)] shadow-sm"
                  : "bg-white text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] border-[var(--kivo-line)]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      {/* App Footer */}
      <footer className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 py-8 text-xs text-[var(--kivo-muted)] border-t border-[var(--kivo-line)] mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-[var(--kivo-ink)]">Kivo</span> — Nigeria-first financial OS.
        </div>
        <div>
          <span>₦ · Bank transfer · WhatsApp · Email · Paystack</span>
        </div>
      </footer>

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        orgId={orgId}
      />
    </div>
  );
}
