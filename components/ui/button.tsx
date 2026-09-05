"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--kivo-green)] text-white hover:bg-[var(--kivo-green-dark)] active:scale-[0.98] shadow-sm font-semibold",
  secondary:
    "bg-white text-[var(--kivo-ink)] border border-[var(--kivo-line)] hover:bg-[var(--kivo-cream)] hover:border-[#ccd4ca] active:scale-[0.98] font-medium shadow-sm",
  ghost:
    "bg-transparent text-[var(--kivo-muted)] hover:text-[var(--kivo-ink)] hover:bg-[var(--kivo-green-soft)] active:scale-[0.98] font-medium",
  outline:
    "bg-white border border-[var(--kivo-line)] text-[var(--kivo-ink)] hover:bg-[var(--kivo-cream)] active:scale-[0.98] font-medium",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-xl",
  md: "h-9 px-4 text-[13px] rounded-xl",
  lg: "h-11 px-5 text-sm rounded-xl",
  icon: "h-9 w-9 rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, asChild, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none select-none",
      variantStyles[variant],
      sizeStyles[size],
      loading && "opacity-70 pointer-events-none",
      className
    );
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }
    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
