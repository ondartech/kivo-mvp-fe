"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomer } from "@/features/customers/api";
import { useOperatingBranches } from "@/features/organization/api";
import { useProjects } from "@/features/projects/api";
import {
  useConvertQuoteToInvoice,
  useQuote,
  useQuoteHistory,
  useSendQuote,
} from "@/features/quotes/api";
import {
  canConvertQuote,
  canSendQuote,
  quoteActionErrorMessage,
  quoteStatusVariant,
} from "@/features/quotes/quotes";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { formatMoney } from "@/lib/money";

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortId(value: string) {
  return value.slice(0, 8);
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const router = useRouter();
  const orgId = useActiveOrganizationId() ?? "";

  const quote = useQuote(orgId, quoteId);
  const history = useQuoteHistory(orgId, quoteId);
  const branchAccess = useOperatingBranches(orgId);

  const customer = useCustomer(orgId, quote.data?.customer_id ?? "");
  const projects = useProjects(orgId, {
    branchId: quote.data?.branch_id ?? null,
    customerId: quote.data?.customer_id ?? null,
    limit: 100,
    enabled: Boolean(quote.data?.branch_id && quote.data?.customer_id),
  });

  const sendQuote = useSendQuote(orgId, quoteId);
  const convertQuote = useConvertQuoteToInvoice(orgId, quoteId);
  const sendKey = useRef<string | null>(null);
  const convertKey = useRef<string | null>(null);

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );
  const projectById = useMemo(
    () =>
      new Map(
        (projects.data?.data ?? []).map((project) => [project.id, project]),
      ),
    [projects.data?.data],
  );

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening a Quote."
      />
    );
  }

  if (quote.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (quote.isError) {
    return (
      <ErrorState
        title="Quote unavailable"
        description={
          quote.error instanceof Error
            ? quote.error.message
            : "The Quote request failed."
        }
        retry={{ label: "Retry", onClick: () => void quote.refetch() }}
      />
    );
  }

  const record = quote.data;
  if (!record) {
    return (
      <EmptyState
        title="Quote unavailable"
        description="No Quote data was returned."
      />
    );
  }

  const branch = branchById.get(record.branch_id);
  const project = record.project_id
    ? projectById.get(record.project_id)
    : null;
  const branchLabel = branch
    ? `${branch.code} · ${branch.name}`
    : shortId(record.branch_id);
  const customerLabel =
    customer.data?.name ?? shortId(record.customer_id);

  const handleSend = async () => {
    if (
      !window.confirm(
        "Send this Quote? Ondar will freeze the customer-facing proposal snapshot and the sent Quote becomes immutable.",
      )
    ) {
      return;
    }
    sendKey.current ??= crypto.randomUUID();

    try {
      await sendQuote.mutateAsync(sendKey.current);
      sendKey.current = null;
      toast.success("Quote sent");
    } catch (error) {
      toast.error(quoteActionErrorMessage(error));
    }
  };

  const handleConvert = async () => {
    convertKey.current ??= crypto.randomUUID();

    try {
      const result = await convertQuote.mutateAsync(convertKey.current);
      convertKey.current = null;
      toast.success("Invoice draft created");
      router.push(`/app/invoices/${result.invoice_id}`);
    } catch (error) {
      toast.error(quoteActionErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${branchLabel} · Version ${record.quote_version}`}
        title={record.quote_number}
        description={`${customerLabel}${project ? ` · ${project.name}` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/app/quotes">All quotes</Link>
            </Button>
            {canSendQuote(record) ? (
              <Button
                disabled={sendQuote.isPending}
                onClick={() => void handleSend()}
              >
                {sendQuote.isPending ? "Sending…" : "Send quote"}
              </Button>
            ) : null}
            {canConvertQuote(record) ? (
              <Button
                disabled={convertQuote.isPending}
                onClick={() => void handleConvert()}
              >
                {convertQuote.isPending
                  ? "Creating invoice…"
                  : "Create invoice"}
              </Button>
            ) : null}
            {record.converted_invoice_id ? (
              <Button asChild>
                <Link href={`/app/invoices/${record.converted_invoice_id}`}>
                  Open invoice
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={quoteStatusVariant(record.status)}>
          {humanize(record.status)}
        </Badge>
        <Badge variant="neutral">{branchLabel}</Badge>
        {record.archetype ? (
          <Badge variant="neutral">{humanize(record.archetype)}</Badge>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {record.valid_until
            ? `Valid until ${record.valid_until}`
            : "No validity end date"}
        </span>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Proposal total
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(record.grand_total, record.currency)}
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This is commercial proposal value, not a Receivable. Financial
                obligation begins only after a separate Invoice is created and issued.
              </p>
            </div>
            <div className="grid min-w-64 gap-1 text-sm">
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatMoney(record.subtotal, record.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">
                  {formatMoney(record.discount_total, record.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">
                  {formatMoney(record.tax_total, record.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Charges</span>
                <span className="tabular-nums">
                  {formatMoney(record.charge_total, record.currency)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {record.line_items.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.line_number}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {line.item_name || line.description}
                  </div>
                  {line.item_name ? (
                    <div className="text-xs text-muted-foreground">
                      {line.description}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {line.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(line.unit_price, record.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(line.discount_amount, record.currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(line.tax_amount, record.currency)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(line.line_total, record.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(record.notes || record.terms) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {record.notes ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{record.notes}</p>
              </CardContent>
            </Card>
          ) : null}
          {record.terms ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Terms
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{record.terms}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <div className="text-sm font-semibold">Lifecycle</div>
          {history.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Loading Quote history…
            </p>
          ) : history.isError ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Quote history is temporarily unavailable.
            </p>
          ) : (history.data?.timeline.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No lifecycle events were returned.
            </p>
          ) : (
            <div className="mt-3 divide-y">
              {history.data?.timeline.map((item, index) => (
                <div
                  key={`${item.kind}-${item.at ?? index}`}
                  className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {humanize(item.kind)}
                    </div>
                    {item.metadata ? (
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(item.metadata)
                          .slice(0, 3)
                          .map(([key, value]) => `${humanize(key)}: ${String(value)}`)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(item.at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {record.status === "DRAFT" ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground">
            Sending freezes the customer-facing proposal snapshot. Sent and accepted
            Quotes are historical commercial evidence rather than mutable drafts.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
