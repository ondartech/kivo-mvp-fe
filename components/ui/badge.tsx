import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "neutral"
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "processing"
  | "paid"
  | "sent"
  | "viewed"
  | "overdue"
  | "draft";

const styles: Record<Variant, string> = {
  neutral: "bg-[#f5f7f4] text-[#626862] border-[#e2e6e0]",
  draft: "bg-[#f5f7f4] text-[#626862] border-[#e2e6e0]",
  success: "bg-[#edf7ee] text-[#34713d] border-[#cbe6cf]",
  paid: "bg-[#edf7ee] text-[#34713d] border-[#cbe6cf]",
  warning: "bg-[#fbf5df] text-[#927b31] border-[#faeab1]",
  viewed: "bg-[#fbf5df] text-[#927b31] border-[#faeab1]",
  critical: "bg-[#fdf0ee] text-[#b4534d] border-[#fad4ce]",
  overdue: "bg-[#fdf0ee] text-[#b4534d] border-[#fad4ce]",
  info: "bg-[#eff4fb] text-[#466f9f] border-[#cde0f5]",
  sent: "bg-[#eff4fb] text-[#466f9f] border-[#cde0f5]",
  processing: "bg-[#edf6ec] text-[#2f7d3c] border-[#cbe6cf] animate-pulse",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-normal transition-colors",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
