"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

type Emphasis = "primary" | "secondary" | "table" | "compact" | "display" | "document";

interface Props {
  amount: string; // Decimal string — authoritative, never float
  currency?: string;
  emphasis?: Emphasis;
  className?: string;
  compactThreshold?: number; // not used for authority, only display shortening
}

const styles: Record<Emphasis, string> = {
  display: "text-3xl md:text-4xl font-semibold tracking-tight tabular-nums leading-none",
  primary: "text-[1.375rem] font-semibold tracking-tight tabular-nums leading-none",
  secondary: "text-sm font-medium tabular-nums text-muted-foreground",
  table: "text-sm font-medium tabular-nums text-right whitespace-nowrap",
  compact: "text-sm font-medium tabular-nums",
  document: "text-base font-semibold tabular-nums",
};

export function MoneyAmount({ amount, currency = "NGN", emphasis = "primary", className }: Props) {
  // Display-only: delegate to lib/money.ts (en-NG, never calc)
  const formatted = formatMoney(amount, currency);

  // Compact shortening is display-only, not authoritative
  // For emphasis=compact we keep full formatted but allow truncation via props
  return <span className={cn(styles[emphasis], className)}>{formatted}</span>;
}

export function CompactMoney({ amount, currency = "NGN", className }: { amount: string; currency?: string; className?: string }) {
  // ₦2.4m style — display shortening, not precision change
  const num = Number(amount);
  if (Number.isNaN(num)) return <MoneyAmount amount={amount} currency={currency} emphasis="compact" className={className} />;
  const abs = Math.abs(num);
  let display = "";
  if (abs >= 1_000_000) display = `₦${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  else if (abs >= 1_000) display = `₦${(num / 1000).toFixed(0)}k`;
  else display = formatMoney(amount, currency);
  return <span className={cn("tabular-nums font-medium", className)}>{display}</span>;
}
