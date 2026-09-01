import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "success" | "warning" | "critical" | "info" | "processing";

const styles: Record<Variant, string> = {
  neutral: "bg-neutral-50 text-neutral-700 border",
  success: "bg-success-subtle text-success border-success/20",
  warning: "bg-warning-subtle text-warning border-warning/20",
  critical: "bg-critical-subtle text-critical border-critical/20",
  info: "bg-info-subtle text-info border-info/20",
  processing: "bg-neutral-50 text-neutral-500 border animate-pulse",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium leading-none",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
