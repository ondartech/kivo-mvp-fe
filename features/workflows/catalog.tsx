"use client";

import Link from "next/link";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflowDefinitions } from "@/features/workflows/api";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

function humanize(value: string | null): string {
  if (!value) return "General";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function WorkflowCatalog({
  domain,
  eyebrow,
  title,
  description,
}: {
  domain?: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const organizationId = useActiveOrganizationId();
  const workflows = useWorkflowDefinitions(organizationId ?? "", { domain });

  if (!organizationId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before managing workflows."
      />
    );
  }

  const rows = workflows.data ?? [];

  return (
    <div className="max-w-[1040px] space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <Card>
        <CardContent className="p-5">
          <div className="text-sm font-medium">Configuration ownership</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Workflow definitions are centrally owned by Ondar&apos;s Workflow
            platform. Domain screens show a contextual view of the same
            definitions; they do not create separate configuration stores.
          </p>
        </CardContent>
      </Card>

      {workflows.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : workflows.isError ? (
        <ErrorState
          title="Workflows unavailable"
          description={workflows.error.message}
          retry={{ label: "Retry", onClick: () => void workflows.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={domain ? "No workflows for this domain" : "No workflows configured"}
          description={
            domain
              ? "No active workflow definitions are classified for this domain yet."
              : "Create or install a workflow definition before configuring event triggers."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{workflow.name}</div>
                      <Badge variant="neutral">
                        {humanize(workflow.domain)}
                      </Badge>
                      {workflow.workflow_type ? (
                        <Badge variant="neutral">
                          {humanize(workflow.workflow_type)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workflow.description ?? workflow.workflow_key}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Key:{" "}
                      <code className="rounded bg-neutral-50 px-1.5 py-0.5 text-foreground">
                        {workflow.workflow_key}
                      </code>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={"/app/settings/workflows/" + workflow.id}>
                      View configuration
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
