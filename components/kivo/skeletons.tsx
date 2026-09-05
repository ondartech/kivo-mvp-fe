import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Reusable Table Row Skeleton
 * Simulates table rows with staggered column widths and right-aligned amounts.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-surface overflow-hidden", className)}>
      {/* Table Header */}
      <div className="border-b bg-neutral-50 px-4 py-3 flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 hidden sm:block" />
        <Skeleton className="h-4 w-24 hidden md:block" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Table Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-4 py-3.5"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className={cn("h-4", i % 2 === 0 ? "w-40" : "w-32")} />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="hidden sm:block">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="hidden md:block">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard 4-Card KPI Skeleton
 * Staggered metric cards matching the exact layout of DashboardPage.
 */
export function KpiSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28 mt-2" />
            <Skeleton className="h-3 w-32 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Generic Card Skeleton with Header & Content
 */
export function CardSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Invoice Detail Layout Skeleton
 * Exact 3-column / 2-column split matching app/(app)/invoices/[invoiceId]/page.tsx.
 */
export function InvoiceDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 max-w-[1100px]", className)}>
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Badges Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Grid Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Document Body */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-6">
              {/* Seller / Buyer Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>

              {/* Line Items Table Skeleton */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between py-2 border-b">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between py-2 border-b">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Totals Section */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Skeleton */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions / Summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-full rounded-md mt-4" />
              <Skeleton className="h-9 w-full rounded-md" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer Detail Skeleton (Customer 360 View)
 */
export function CustomerDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 max-w-[1100px]", className)}>
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <TableSkeleton rows={4} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
            <div className="border-t pt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Public Invoice Skeleton (/i/[token])
 */
export function PublicInvoiceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-3 w-28" />
        </div>

        <Card className="mt-6">
          <CardContent className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between pt-3 border-t">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>

            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
