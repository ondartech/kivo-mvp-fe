"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalSearch, type RetrievalEvidence } from "@/features/foundation/api";

function useOrgId(): string {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("orgId") ??
      localStorage.getItem("organization_id") ??
      "00000000-0000-0000-0000-000000000000"
    );
  }
  return "00000000-0000-0000-0000-000000000000";
}

function entityHref(item: RetrievalEvidence): string | null {
  if (!item.entity_id) return null;
  switch (item.entity_type) {
    case "CUSTOMER":
      return `/app/customers/${item.entity_id}`;
    case "INVOICE":
      return `/app/invoices/${item.entity_id}`;
    case "QUOTE":
      return `/app/quotes/${item.entity_id}`;
    case "CONTRACT":
      return `/app/contracts/${item.entity_id}`;
    case "PROJECT":
      return `/app/projects/${item.entity_id}`;
    case "PAYMENT":
      return `/app/payments/${item.entity_id}`;
    default:
      return null;
  }
}

export default function GlobalSearchPage() {
  const orgId = useOrgId();
  const [query, setQuery] = useState("");
  const search = useGlobalSearch(orgId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    await search.mutateAsync({ text, limit: 30 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Foundation"
        title="Global search"
        description="Search authorized Ondar business records across parties, commercial documents, finance and compliance."
      />

      <form onSubmit={submit} className="flex max-w-3xl gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a customer, invoice, receivable, NRS submission…"
          aria-label="Global search"
          autoFocus
        />
        <Button type="submit" loading={search.isPending} disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {search.isError ? (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Search failed</div>
            <div className="mt-1 text-muted-foreground">
              {search.error instanceof Error ? search.error.message : "Unable to search Ondar records."}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {search.data ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {search.data.evidence.length} results for “{search.data.query}”
          </div>

          {search.data.evidence.length ? (
            <div className="divide-y rounded-lg border">
              {search.data.evidence.map((item) => {
                const href = entityHref(item);
                const body = (
                  <div className="p-4 hover:bg-neutral-50">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.entity_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.authoritative ? "Authoritative" : item.authority}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.mode}</span>
                    </div>
                    <div className="mt-1 font-medium">{item.title}</div>
                    {item.snippet ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.snippet}</p>
                    ) : null}
                    {item.source_reference ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <code>{item.source_reference}</code>
                      </div>
                    ) : null}
                  </div>
                );
                return href ? (
                  <Link key={item.evidence_id} href={href} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={item.evidence_id}>{body}</div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                No authorized records matched this search.
              </CardContent>
            </Card>
          )}

          {search.data.unknowns.length ? (
            <div className="text-xs text-muted-foreground">
              Unknowns: {search.data.unknowns.join(" · ")}
            </div>
          ) : null}
          {search.data.conflicts.length ? (
            <div className="text-xs text-muted-foreground">
              Conflicts: {search.data.conflicts.join(" · ")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
