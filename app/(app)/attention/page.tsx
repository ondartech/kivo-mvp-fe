"use client";

import { PageHeader } from "@/components/kivo/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { isOrganizationId, useAttention } from "@/features/foundation/api";

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

const activeStatuses = new Set(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"]);

export default function AttentionPage() {
  const orgId = useOrgId();
  const attention = useAttention(orgId);
  const hasOrganization = isOrganizationId(orgId);
  const items = (attention.data ?? []).filter((item) => activeStatuses.has(item.status));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Foundation"
        title="Attention"
        description="Operational items that require review. The source domain remains authoritative for the underlying business state."
      />

      {!hasOrganization ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Organization context is not available. Select a workspace to load Attention.
          </CardContent>
        </Card>
      ) : attention.isLoading ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">Loading attention items…</CardContent>
        </Card>
      ) : attention.isError ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Could not load Attention</div>
            <div className="mt-1 text-muted-foreground">
              {attention.error instanceof Error ? attention.error.message : "The Attention request failed."}
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No active attention items.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-lg border">
          {items.map((item) => (
            <article key={item.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.severity}
                </span>
                <span className="text-xs text-muted-foreground">{item.source_domain}</span>
                <span className="text-xs text-muted-foreground">{item.status}</span>
                {item.occurrence_count > 1 ? (
                  <span className="text-xs text-muted-foreground">
                    {item.occurrence_count} occurrences
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 font-medium">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Reason: {item.reason}
                {item.source_reference ? (
                  <>
                    {" · "}
                    <code>{item.source_reference}</code>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
