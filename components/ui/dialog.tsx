"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode };
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto rounded-lg border bg-surface shadow-overlay animate-slide-in">
        {children}
      </div>
    </div>
  );
}
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-3", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold leading-none", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-sm text-muted-foreground", className)} {...props} />;
}
export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-3", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 p-6 pt-3", className)} {...props} />;
}
