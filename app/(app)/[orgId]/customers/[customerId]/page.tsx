"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { MoneyAmount } from "@/components/kivo/money-amount";
import { formatMoney } from "@/lib/money";
import { useCustomer, useCustomerBalance, useCustomerHistory, useArchiveCustomer, useRestoreCustomer, useContacts, type ContactOut, type CustomerHistoryOut } from "@/features/customers/api";
import { toast } from "sonner";

export default function OrgCustomerDetailPage() {
  const params = useParams<{ orgId: string; customerId: string }>();
  const orgId = params.orgId as string;
  const customerId = params.customerId as string;
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "contacts" | "history">("overview");

  const { data: customer, isLoading, isError, error, refetch } = useCustomer(orgId, customerId);
  const { data: balance } = useCustomerBalance(orgId, customerId);
  const { data: historyData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: historyLoading } = useCustomerHistory(orgId, customerId);
  const { data: contactsData } = useContacts(orgId, customerId);
  const archiveMut = useArchiveCustomer(orgId);
  const restoreMut = useRestoreCustomer(orgId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1100px]">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    const code = (error as { code?: string })?.code;
    const notFound = code === "CUSTOMER_NOT_FOUND" || (error as Error)?.message?.includes("404") || (error as { status?: number })?.status === 404;
    if (notFound) {
      return (
        <div className="max-w-[760px] mx-auto py-10">
          <EmptyState
            title="Customer not found in this workspace"
            description="This customer does not exist in this workspace or you do not have access. Switch workspace or check the link."
            action={{ label: "Switch workspace", href: `/app/${orgId}/customers` }}
          />
        </div>
      );
    }
    return (
      <div className="max-w-[760px]">
        <ErrorState title="Could not load customer" description={(error as Error)?.message ?? "An error occurred."} retry={{ label: "Retry", onClick: () => refetch() }} />
      </div>
    );
  }

  if (!customer) return null;
  const isArchived = customer.status === "ARCHIVED";

  const handleArchive = async () => {
    if (!confirm(`Archive ${customer.name}? Past invoices remain readable.`)) return;
    try {
      await archiveMut.mutateAsync(customerId);
      toast.success(`${customer.name} archived`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };
  const handleRestore = async () => {
    try {
      await restoreMut.mutateAsync(customerId);
      toast.success(`${customer.name} restored`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    }
  };

  const historyItems = historyData?.pages.flatMap((p) => (p as unknown as { data: never[] }).data ?? []) ?? [];

  return (
    <div className="space-y-6 max-w-[1100px]">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {customer.name}
            {isArchived ? <Badge variant="neutral">Archived</Badge> : <Badge>Active</Badge>}
          </span>
        }
        description={`${customer.email ?? ""} ${customer.phone ? `· ${customer.phone}` : ""} ${customer.billing_address ? `· ${(customer.billing_address as { city?: string })?.city ?? ""}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/app/${orgId}/invoices/new?customerId=${customerId}`)}>Create invoice</Button>
            <Link href={`/app/${orgId}/customers/${customerId}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            {isArchived ? (
              <Button variant="outline" onClick={handleRestore} disabled={restoreMut.isPending}>
                Restore
              </Button>
            ) : (
              <Button variant="outline" onClick={handleArchive} disabled={archiveMut.isPending}>
                Archive
              </Button>
            )}
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">{balance ? formatMoney(balance.outstanding, balance.currency) : <Skeleton className="h-6 w-24" />}</div>
            <div className="text-xs text-muted-foreground">{balance ? `${balance.invoice_count} invoices` : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</div>
            <div className="mt-2 text-xl font-semibold tabular-nums text-critical">{balance ? formatMoney(balance.overdue, balance.currency) : <Skeleton className="h-6 w-24" />}</div>
            <div className="text-xs text-muted-foreground">{balance ? `${balance.overdue_count} overdue` : ""}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Paid historically</div>
            <div className="mt-2 text-xl font-semibold tabular-nums">{balance ? formatMoney(balance.paid, balance.currency) : <Skeleton className="h-6 w-24" />}</div>
            <div className="text-xs text-muted-foreground">—</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("overview")} className={`px-3 py-2 text-sm border-b-2 ${tab === "overview" ? "border-brand font-medium" : "border-transparent text-muted-foreground"}`}>
          Overview
        </button>
        <button onClick={() => setTab("contacts")} className={`px-3 py-2 text-sm border-b-2 ${tab === "contacts" ? "border-brand font-medium" : "border-transparent text-muted-foreground"}`}>
          Contacts
        </button>
        <button onClick={() => setTab("history")} className={`px-3 py-2 text-sm border-b-2 ${tab === "history" ? "border-brand font-medium" : "border-transparent text-muted-foreground"}`}>
          History
        </button>
      </div>

      {tab === "overview" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="text-sm font-semibold">Info</div>
              <div className="text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span> {customer.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span> {customer.email ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {customer.phone ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Billing:</span> {customer.billing_address ? JSON.stringify(customer.billing_address) : "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Tax:</span> {customer.tax_identifier ?? "—"} {customer.tax_identifier_type ? `(${customer.tax_identifier_type})` : ""}
                </div>
                <div>
                  <span className="text-muted-foreground">Notes:</span> {customer.notes ?? "—"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/app/${orgId}/invoices/new?customerId=${customerId}`)}>
                  New invoice for customer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTab("history")}>
                  View history
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "contacts" ? (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold">Contacts</div>
            {contactsData?.data?.length ? (
              <div className="mt-3 divide-y">
                {contactsData.data.map((c: ContactOut) => (
                  <div key={c.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {c.name} {c.is_primary ? <Badge>Primary</Badge> : null}
                    </span>
                    <span className="text-muted-foreground">{c.email ?? c.phone ?? "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-muted-foreground">No contacts.</div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "history" ? (
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold">History</div>
            {historyLoading ? (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No history yet" description="Create an invoice for this customer to see history." action={{ label: "Create invoice", href: `/app/${orgId}/invoices/new?customerId=${customerId}` }} />
              </div>
            ) : (
              <>
                <div className="mt-3 divide-y text-sm">
                  {historyItems.map((h: CustomerHistoryOut["data"] extends (infer U)[] ? U : never) => (
                    <div key={(h as unknown as { id: string }).id} className="flex justify-between py-2">
                      <span>
                        {(h as unknown as { type: string }).type} · {(h as unknown as { id: string }).id.slice(0, 8)} · {(h as unknown as { amount?: string }).amount ?? "—"}
                      </span>
                      <span className="text-muted-foreground">{new Date((h as unknown as { date: string }).date).toLocaleDateString("en-NG")}</span>
                    </div>
                  ))}
                </div>
                {hasNextPage ? (
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? "Loading…" : "Load more"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
