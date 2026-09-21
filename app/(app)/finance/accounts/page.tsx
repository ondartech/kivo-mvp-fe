"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFinanceAccounts } from "@/features/finance-explorer/api";
import {
  accountProtectionLabels,
  humanize,
} from "@/features/finance-explorer/schema";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

export default function FinanceAccountsPage() {
  const organizationId = useActiveOrganizationId();
  const accounts = useFinanceAccounts(organizationId ?? "");
  const [query, setQuery] = useState("");

  const rows = accounts.data?.data ?? [];
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((account) =>
      [account.code, account.name, account.account_class, account.account_type]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [query, rows]);

  const systemCount = rows.filter((row) => row.management_type === "SYSTEM").length;
  const controlCount = rows.filter((row) => row.is_control_account).length;
  const archivedCount = rows.filter((row) => row.status === "ARCHIVED").length;

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Finance accounts."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Accounts"
        description="Read-only chart-of-accounts explorer with protected-account visibility and ledger drill-down."
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/finance/matching">Supplier bill matching</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">System accounts</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{accounts.isLoading ? "—" : systemCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Control accounts</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{accounts.isLoading ? "—" : controlCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Archived</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{accounts.isLoading ? "—" : archivedCount}</div>
        </CardContent></Card>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search code, name, class or type"
        aria-label="Search Finance accounts"
      />

      {accounts.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : accounts.isError ? (
        <ErrorState
          title="Finance accounts unavailable"
          description={accounts.error.message}
          retry={{ label: "Retry", onClick: () => void accounts.refetch() }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={rows.length ? "No matching accounts" : "No Finance accounts"}
          description={rows.length ? "Try a different search term." : "The organization has no chart-of-accounts records yet."}
        />
      ) : (
        <Table>
          <TableHeader><TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Protection</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {visible.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="font-medium">{account.code} · {account.name}</div>
                  <div className="text-xs text-muted-foreground">{humanize(account.normal_balance)} normal balance</div>
                </TableCell>
                <TableCell>
                  <div>{humanize(account.account_class)}</div>
                  <div className="text-xs text-muted-foreground">{humanize(account.account_type)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {accountProtectionLabels(account).length ? accountProtectionLabels(account).map((label) => (
                      <Badge key={label} variant={label === "System" || label === "Control" ? "warning" : "neutral"}>{label}</Badge>
                    )) : <Badge variant="neutral">User account</Badge>}
                  </div>
                  {account.control_type ? <div className="mt-1 text-xs text-muted-foreground">{humanize(account.control_type)}</div> : null}
                </TableCell>
                <TableCell><Badge variant={account.status === "ACTIVE" ? "success" : "neutral"}>{humanize(account.status)}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/app/finance/accounts/${account.id}`}>View activity</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
