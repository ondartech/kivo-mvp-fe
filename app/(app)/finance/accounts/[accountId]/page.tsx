"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useAccountActivity,
  useFinanceAccount,
} from "@/features/finance-explorer/api";
import {
  accountProtectionLabels,
  humanize,
} from "@/features/finance-explorer/schema";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function balanceText(debit: string, credit: string, currency: string): string {
  if (debit !== "0" && !/^0(?:\.0+)?$/.test(debit)) return `${formatMoney(debit, currency)} DR`;
  if (credit !== "0" && !/^0(?:\.0+)?$/.test(credit)) return `${formatMoney(credit, currency)} CR`;
  return formatMoney("0", currency);
}

export default function FinanceAccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const organizationId = useActiveOrganizationId();
  const account = useFinanceAccount(organizationId ?? "", accountId);
  const activity = useAccountActivity(organizationId ?? "", accountId);

  if (!organizationId) {
    return <EmptyState title="Organization context required" description="Select an organization workspace before opening account activity." />;
  }

  if (account.isLoading || activity.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-72 w-full" /></div>;
  }

  if (account.isError) {
    return <ErrorState title="Account unavailable" description={account.error.message} retry={{ label: "Retry", onClick: () => void account.refetch() }} />;
  }

  if (activity.isError) {
    return <ErrorState title="Account activity unavailable" description={activity.error.message} retry={{ label: "Retry", onClick: () => void activity.refetch() }} />;
  }

  const record = account.data;
  const first = activity.data?.pages[0];
  const lines = activity.data?.pages.flatMap((page) => page.data) ?? [];

  if (!record || !first) return <EmptyState title="Account unavailable" description="No Finance account data was returned." />;

  const protection = accountProtectionLabels(record);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance · Account explorer"
        title={`${record.code} · ${record.name}`}
        description={`${humanize(record.account_class)} · ${humanize(record.account_type)} · ${humanize(record.normal_balance)} normal balance`}
        actions={<Button variant="outline" asChild><Link href="/app/finance/accounts">All accounts</Link></Button>}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={record.status === "ACTIVE" ? "success" : "neutral"}>{humanize(record.status)}</Badge>
        {protection.map((label) => <Badge key={label} variant={label === "System" || label === "Control" ? "warning" : "neutral"}>{label}</Badge>)}
        {record.control_type ? <Badge variant="info">{humanize(record.control_type)}</Badge> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opening</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{balanceText(first.opening_debit, first.opening_credit, first.base_currency)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Period activity</div>
          <div className="mt-1 text-sm tabular-nums">DR {formatMoney(first.activity_debit, first.base_currency)}</div>
          <div className="text-sm tabular-nums">CR {formatMoney(first.activity_credit, first.base_currency)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Closing</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{balanceText(first.closing_debit, first.closing_credit, first.base_currency)}</div>
        </CardContent></Card>
      </div>

      <div className="text-xs text-muted-foreground">
        Accounting range: <span className="font-medium text-foreground">{first.from_date}</span> to <span className="font-medium text-foreground">{first.to_date}</span>.
        Ledger order is accounting date, entry number, line number, then line identity.
      </div>

      {lines.length === 0 ? (
        <EmptyState title="No ledger activity" description="This account has no posted General Ledger lines in the selected Finance range." />
      ) : (
        <>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Accounting date</TableHead>
              <TableHead>Journal</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Running balance</TableHead>
              <TableHead>Source</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.line_id}>
                  <TableCell className="tabular-nums">{line.accounting_date}</TableCell>
                  <TableCell>
                    <Link href={`/app/finance/journals/${line.journal_entry_id}`} className="font-medium underline-offset-4 hover:underline">
                      {line.entry_number}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant={line.entry_type === "SYSTEM" ? "warning" : "neutral"}>{humanize(line.entry_type)}</Badge>
                      {line.journal_status === "REVERSED" ? <Badge variant="critical">Reversed</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(line.debit_base, first.base_currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(line.credit_base, first.base_currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(line.running_balance, first.base_currency)} {line.running_balance_side === "ZERO" ? "" : line.running_balance_side === "DEBIT" ? "DR" : "CR"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{humanize(line.source.source_domain)} · {humanize(line.source.source_type)}</div>
                    <div className="text-xs text-muted-foreground">{humanize(line.source.source_event_type)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {activity.hasNextPage ? (
            <div className="flex justify-center">
              <Button variant="outline" disabled={activity.isFetchingNextPage} onClick={() => void activity.fetchNextPage()}>
                {activity.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
