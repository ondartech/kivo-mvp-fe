"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useJournalEntry,
  useJournalSourceTrace,
} from "@/features/finance-explorer/api";
import { humanize, shortIdentifier } from "@/features/finance-explorer/schema";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value));
}

export default function FinanceJournalDetailPage() {
  const { journalId } = useParams<{ journalId: string }>();
  const organizationId = useActiveOrganizationId();
  const journal = useJournalEntry(organizationId ?? "", journalId);
  const trace = useJournalSourceTrace(organizationId ?? "", journalId);

  if (!organizationId) {
    return <EmptyState title="Organization context required" description="Select an organization workspace before opening a journal." />;
  }
  if (journal.isLoading || trace.isLoading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>;
  }
  if (journal.isError) {
    return <ErrorState title="Journal unavailable" description={journal.error.message} retry={{ label: "Retry", onClick: () => void journal.refetch() }} />;
  }
  if (trace.isError) {
    return <ErrorState title="Source trace unavailable" description={trace.error.message} retry={{ label: "Retry", onClick: () => void trace.refetch() }} />;
  }

  const entry = journal.data;
  const source = trace.data;
  if (!entry || !source) return <EmptyState title="Journal unavailable" description="No journal data was returned." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance · Journal explorer"
        title={entry.entry_number}
        description="Immutable General Ledger entry with source lineage and reversal metadata."
        actions={<Button variant="outline" asChild><Link href="/app/finance/accounts">Accounts</Link></Button>}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant={entry.entry_type === "SYSTEM" ? "warning" : "neutral"}>{humanize(entry.entry_type)}</Badge>
        <Badge variant={entry.status === "POSTED" ? "success" : "critical"}>{humanize(entry.status)}</Badge>
        {entry.entry_type === "SYSTEM" ? <Badge variant="warning">No client-side creation path</Badge> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accounting date</div>
          <div className="mt-1 font-semibold tabular-nums">{entry.accounting_date}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created timestamp</div>
          <div className="mt-1 text-sm font-medium">{formatTimestamp(entry.created_at)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Posted timestamp</div>
          <div className="mt-1 text-sm font-medium">{formatTimestamp(entry.posted_at)}</div>
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Journal metadata</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Profile</span><span className="font-medium">{entry.posting_profile_key}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Rule</span><span className="font-medium">{entry.posting_rule_key} v{entry.posting_rule_version}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Currency</span><span className="font-medium">{entry.transaction_currency} → {entry.base_currency}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Created by</span><span className="font-medium">{entry.created_by_principal}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Correlation</span><span className="font-mono text-xs">{entry.correlation_id ?? "—"}</span></div>
            {entry.reversal_of_entry_id ? <div className="flex justify-between gap-4"><span className="text-muted-foreground">Reverses</span><Link className="font-medium hover:underline" href={`/app/finance/journals/${entry.reversal_of_entry_id}`}>{shortIdentifier(entry.reversal_of_entry_id)}</Link></div> : null}
            {entry.reversed_by_entry_id ? <div className="flex justify-between gap-4"><span className="text-muted-foreground">Reversed by</span><Link className="font-medium hover:underline" href={`/app/finance/journals/${entry.reversed_by_entry_id}`}>{shortIdentifier(entry.reversed_by_entry_id)}</Link></div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Authoritative source trace</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Domain</span><span className="font-medium">{humanize(source.source.source_domain)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Type</span><span className="font-medium">{humanize(source.source.source_type)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Source ID</span><span className="font-mono text-xs">{source.source.source_id}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Source event</span><span className="font-medium">{humanize(source.source.source_event_type)} v{source.source.source_event_version}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Financial event</span><span className="font-mono text-xs">{shortIdentifier(source.financial_event_id)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Event status</span><Badge variant={source.financial_event_status === "POSTED" ? "success" : "neutral"}>{humanize(source.financial_event_status)}</Badge></div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Journal lines</h2>
        <Table>
          <TableHeader><TableRow>
            <TableHead>#</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {entry.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="tabular-nums">{line.line_number}</TableCell>
                <TableCell>
                  <Link href={`/app/finance/accounts/${line.account_id}`} className="font-mono text-xs underline-offset-4 hover:underline">
                    {shortIdentifier(line.account_id)}
                  </Link>
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(line.debit_base, entry.base_currency)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(line.credit_base, entry.base_currency)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="font-semibold">Totals</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMoney(entry.total_debit_base, entry.base_currency)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatMoney(entry.total_credit_base, entry.base_currency)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
