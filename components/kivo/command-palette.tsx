"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommandItem {
  id: string;
  category: "Actions" | "Invoices" | "Customers" | "Settings";
  title: string;
  subtitle?: string;
  badge?: string;
  href: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  orgId = "org_demo",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const items: CommandItem[] = React.useMemo(
    () => [
      // Actions
      {
        id: "act-create-inv",
        category: "Actions",
        title: "Create invoice",
        subtitle: "Draft a new customer invoice",
        badge: "+ New",
        href: `/${orgId}/invoices/new`,
      },
      {
        id: "act-add-cust",
        category: "Actions",
        title: "Add customer",
        subtitle: "Register buyer master record",
        badge: "+ New",
        href: `/${orgId}/customers/new`,
      },
      {
        id: "act-record-pay",
        category: "Actions",
        title: "Record payment",
        subtitle: "Record manual bank transfer or receipt",
        badge: "+ New",
        href: `/${orgId}/payments/new`,
      },
      // Invoices
      {
        id: "inv-1042",
        category: "Invoices",
        title: "INV-1042 · Acme Ltd.",
        subtitle: "₦2,400,000 · 4 days overdue",
        badge: "OVERDUE",
        href: `/${orgId}/invoices/inv-1042`,
      },
      {
        id: "inv-1043",
        category: "Invoices",
        title: "INV-1043 · Bello Consulting",
        subtitle: "₦850,000 · Due tomorrow",
        badge: "DUE_SOON",
        href: `/${orgId}/invoices/inv-1043`,
      },
      {
        id: "inv-1044",
        category: "Invoices",
        title: "INV-1044 · Nova Studio",
        subtitle: "₦450,000 · Settled in full",
        badge: "PAID",
        href: `/${orgId}/invoices/inv-1044`,
      },
      // Customers
      {
        id: "cust-1",
        category: "Customers",
        title: "Acme Ltd.",
        subtitle: "finance@acme.ng · +234 801 234 5678",
        href: `/${orgId}/customers`,
      },
      {
        id: "cust-2",
        category: "Customers",
        title: "Bello Consulting",
        subtitle: "bello@example.com · Lagos",
        href: `/${orgId}/customers`,
      },
      {
        id: "cust-3",
        category: "Customers",
        title: "Nova Studio",
        subtitle: "accounts@nova.ng · Abuja",
        href: `/${orgId}/customers`,
      },
      // Settings
      {
        id: "set-sub",
        category: "Settings",
        title: "Subscription & Commercial Plans",
        subtitle: "Starter Trial · Unlimited Invoicing",
        href: `/${orgId}/settings/subscription`,
      },
      {
        id: "set-biz",
        category: "Settings",
        title: "Business Profile & CAC Verification",
        subtitle: "Entity registration and banking details",
        href: `/${orgId}/settings/business`,
      },
    ],
    [orgId]
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (item: CommandItem) => {
    onOpenChange(false);
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border bg-surface shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>

        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--kivo-line)] bg-white">
          <svg
            className="h-4 w-4 text-[var(--kivo-muted)] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search invoices, customers, payments, or actions..."
            className="flex-1 bg-transparent text-sm text-[var(--kivo-ink)] placeholder:text-[var(--kivo-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline rounded-lg bg-[var(--kivo-cream)] border border-[var(--kivo-line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--kivo-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-[var(--kivo-line)]/50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--kivo-muted)]">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-[var(--kivo-green-soft)] text-[var(--kivo-green-dark)] font-medium"
                      : "hover:bg-[#f4f7f3] text-[var(--kivo-ink)]"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{item.title}</span>
                      <span className="text-[10px] text-[var(--kivo-muted)] uppercase tracking-wider">
                        · {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-[var(--kivo-muted)] truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <Badge
                      variant={
                        item.badge === "OVERDUE"
                          ? "overdue"
                          : item.badge === "PAID"
                            ? "paid"
                            : item.badge === "DUE_SOON"
                              ? "warning"
                              : "neutral"
                      }
                      className="shrink-0 text-[10px] px-2 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-t flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> select
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> close
            </span>
          </div>
          <span>Kivo Financial Command</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
