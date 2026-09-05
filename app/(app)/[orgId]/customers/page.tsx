"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { useCustomers, useArchiveCustomer, type CustomerOut } from "@/features/customers/api";
import { toast } from "sonner";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function OrgCustomersPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId as string;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const debouncedQ = useDebounced(q, 300);
  const [cursor, setCursor] = useState<string | null>(null);
  const queryQ = useMemo(() => debouncedQ.trim() || undefined, [debouncedQ]);
  useEffect(() => setCursor(null), [queryQ, status]);

  const { data, isLoading, isFetching, isError, error, refetch } = useCustomers(orgId, {
    q: queryQ,
    status,
    cursor,
    limit: 20,
    sort: "normalized_name:asc",
  });
  const archiveMut = useArchiveCustomer(orgId);
  const router = useRouter();
  const customers = data?.data ?? [];
  const nextCursor = data?.next_cursor ?? null;

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive ${name}?`)) return;
    try {
      await archiveMut.mutateAsync(id);
      toast.success(`${name} archived`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Long-term data asset — Customer → invoices → outstanding → activity."
        actions={
          <Link href={`/app/${orgId}/customers/new`}>
            <Button>Add customer</Button>
          </Link>
        }
      />
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search customer · name, email, phone"
          className="max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search customers"
        />
        {isFetching ? <span className="h-1 w-24 bg-brand/20 animate-pulse rounded" aria-hidden /> : null}
        <div className="flex gap-1" role="tablist" aria-label="Customer status">
          <button
            role="tab"
            aria-selected={status === "ACTIVE"}
            onClick={() => setStatus("ACTIVE")}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${status === "ACTIVE" ? "bg-brand text-white border-brand" : "bg-neutral-50 border-neutral-200"}`}
          >
            Active
          </button>
          <button
            role="tab"
            aria-selected={status === "ARCHIVED"}
            onClick={() => setStatus("ARCHIVED")}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${status === "ARCHIVED" ? "bg-brand text-white border-brand" : "bg-neutral-50 border-neutral-200"}`}
          >
            Archived
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load customers"
          description={(error as { message?: string })?.message ?? "An error occurred."}
          retry={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : customers.length === 0 && !queryQ ? (
        <EmptyState
          title="No customers yet"
          description="Customers are the starting point for invoices and receivables. Add your first customer to create an invoice."
          action={{ label: "Add your first customer", href: `/app/${orgId}/customers/new` }}
        />
      ) : customers.length === 0 && queryQ ? (
        <EmptyState
          title="No customers match"
          description={`No customers match "${queryQ}".`}
          action={{ label: "Clear search", onClick: () => setQ("") }}
        />
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 bg-neutral-50 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="col-span-4">Customer</span>
              <span className="col-span-3">Contact</span>
              <span className="col-span-2 text-right">Outstanding</span>
              <span className="col-span-1 text-center">Invoices</span>
              <span className="col-span-2"></span>
            </div>
            <div className="divide-y">
              {customers.map((c: CustomerOut) => (
                <div key={c.id} className="grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center">
                  <div className="md:col-span-4">
                    <Link href={`/app/${orgId}/customers/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.status === "ARCHIVED" ? <Badge variant="neutral" className="ml-2">Archived</Badge> : null}
                  </div>
                  <div className="hidden md:block md:col-span-3 text-sm text-muted-foreground truncate">
                    {c.email ?? c.phone ?? "—"}
                  </div>
                  <div className="md:col-span-2 text-right tabular-nums font-medium text-muted-foreground">—</div>
                  <div className="md:col-span-1 text-center text-sm">—</div>
                  <div className="md:col-span-2 flex gap-1 justify-end">
                    <Link href={`/app/${orgId}/customers/${c.id}`}>
                      <Button size="sm" variant="ghost">
                        Open
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" className="hidden md:inline-flex" onClick={() => router.push(`/app/${orgId}/invoices/new?customerId=${c.id}`)}>
                      Create invoice
                    </Button>
                    {c.status === "ACTIVE" ? (
                      <Button size="sm" variant="ghost" onClick={() => handleArchive(c.id, c.name)}>
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">{isFetching ? "Updating…" : `${customers.length} customers`}</div>
            <div className="flex gap-2">
              {nextCursor ? (
                <Button size="sm" variant="outline" onClick={() => setCursor(nextCursor)} disabled={isFetching}>
                  Next
                </Button>
              ) : null}
              {cursor ? (
                <Button size="sm" variant="outline" onClick={() => setCursor(null)} disabled={isFetching}>
                  First page
                </Button>
              ) : null}
            </div>
          </div>
        </>
      )}
      <Card className="border-dashed">
        <CardContent className="p-3 text-xs text-muted-foreground">Tip: Create invoice pre-fills /app/{orgId}/invoices/new?customerId — KIV-FE-021.</CardContent>
      </Card>
    </div>
  );
}
