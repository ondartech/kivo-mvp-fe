import { MoneyAmount, CompactMoney } from "@/components/kivo/money-amount";
import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  amount: string;
  currency?: string;
  hint?: string;
  emphasis?: "primary" | "secondary";
}

export function FinancialSummary({ metrics, className }: { metrics: Metric[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</div>
          <div className="mt-2">
            <MoneyAmount amount={m.amount} currency={m.currency} emphasis={m.emphasis ?? "primary"} />
          </div>
          {m.hint ? <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function OutstandingAmount({
  amount,
  dueLabel,
  currency = "NGN",
  className,
}: {
  amount: string;
  dueLabel?: string;
  currency?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <MoneyAmount amount={amount} currency={currency} emphasis="primary" />
      <span className="text-sm text-muted-foreground">outstanding</span>
      {dueLabel ? <span className="text-xs text-critical">· {dueLabel}</span> : null}
    </div>
  );
}
