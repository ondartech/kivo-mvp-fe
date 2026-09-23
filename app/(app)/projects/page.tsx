"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
import { useCustomers } from "@/features/customers/api";
import { useOperatingBranches } from "@/features/organization/api";
import {
  type ProjectStatus,
  useProjects,
} from "@/features/projects/api";
import { resolveProjectReadScope } from "@/features/projects/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

type StatusFilter = ProjectStatus | null;

function shortId(value: string) {
  return value.slice(0, 8);
}

function statusVariant(status: ProjectStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "ON_HOLD") return "warning" as const;
  if (status === "CANCELLED") return "critical" as const;
  if (status === "COMPLETED") return "info" as const;
  return "neutral" as const;
}

export default function ProjectsPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const activeBranchId = useActiveBranchId();
  const [status, setStatus] = useState<StatusFilter>(null);

  const branchAccess = useOperatingBranches(orgId);
  const scope = resolveProjectReadScope(branchAccess.data, activeBranchId);
  const projects = useProjects(orgId, {
    branchId: scope.branchId,
    status,
    limit: 50,
    enabled: scope.ready,
  });
  const customers = useCustomers(orgId, {
    status: "ACTIVE",
    limit: 100,
    sort: "normalized_name:asc",
  });

  const branchById = useMemo(
    () =>
      new Map(
        (branchAccess.data?.branches ?? []).map((branch) => [branch.id, branch]),
      ),
    [branchAccess.data?.branches],
  );
  const customerById = useMemo(
    () =>
      new Map(
        (customers.data?.data ?? []).map((customer) => [customer.id, customer]),
      ),
    [customers.data?.data],
  );

  const selectedBranch = scope.branchId
    ? branchById.get(scope.branchId)
    : null;
  const scopeLabel = selectedBranch
    ? `${selectedBranch.code} · ${selectedBranch.name}`
    : branchAccess.data?.organization_wide === false
      ? "Select branch"
      : "All branches";

  const rows = projects.data?.data ?? [];

  if (!orgId) {
    return (
      <EmptyState
        title="Organization context required"
        description="Select an organization workspace before opening Projects."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={scopeLabel}
        title="Projects"
        description={
          scope.branchId
            ? "Operational work attributed to the selected Branch."
            : branchAccess.data?.organization_wide === false
              ? "Choose an authorized Branch to load Projects."
              : "Organization-wide Project view across authorized Branches."
        }
        actions={
          <Button asChild>
            <Link href="/app/projects/new">Create project</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            [null, "All"],
            ["PLANNING", "Planning"],
            ["ACTIVE", "Active"],
            ["ON_HOLD", "On hold"],
            ["COMPLETED", "Completed"],
            ["CANCELLED", "Cancelled"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={label}
            size="sm"
            variant={status === value ? "primary" : "secondary"}
            onClick={() => setStatus(value)}
          >
            {label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {scopeLabel}
        </span>
      </div>

      {branchAccess.isError ? (
        <ErrorState
          title="Could not resolve Branch access"
          description={
            branchAccess.error instanceof Error
              ? branchAccess.error.message
              : "The operating Branch request failed."
          }
          retry={{ label: "Retry", onClick: () => void branchAccess.refetch() }}
        />
      ) : branchAccess.data?.organization_wide === false &&
        branchAccess.data.branches.length === 0 ? (
        <EmptyState
          title="No operating Branch access"
          description="Your membership currently has no active Branch available for Projects."
        />
      ) : scope.selectionRequired ? (
        <Card>
          <CardContent className="p-5 text-sm">
            <div className="font-medium">Choose an operating Branch</div>
            <p className="mt-1 text-muted-foreground">
              Your access is Branch-scoped. Select one of your authorized Branches
              from the app context before loading Projects.
            </p>
          </CardContent>
        </Card>
      ) : branchAccess.isLoading || (scope.ready && projects.isLoading) ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : projects.isError ? (
        <ErrorState
          title="Could not load Projects"
          description={
            projects.error instanceof Error
              ? projects.error.message
              : "The Project request failed."
          }
          retry={{ label: "Retry", onClick: () => void projects.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={status ? "No Projects match this state" : "No Projects yet"}
          description={
            status
              ? "Try another status or operating Branch."
              : "Create a Project to organize internal work or customer delivery."
          }
          action={
            status
              ? { label: "Show all Projects", onClick: () => setStatus(null) }
              : { label: "Create project", href: "/app/projects/new" }
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((project) => {
                  const branch = branchById.get(project.branch_id);
                  const customer = project.customer_id
                    ? customerById.get(project.customer_id)
                    : null;
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {project.project_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{project.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {project.kind === "INTERNAL"
                          ? "Internal"
                          : customer?.name ??
                            (project.customer_id
                              ? shortId(project.customer_id)
                              : "—")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          {branch?.code ?? shortId(project.branch_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(project.status)}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {project.start_date ?? "No start"}
                        {" → "}
                        {project.target_end_date ?? "No target"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((project) => {
              const branch = branchById.get(project.branch_id);
              const customer = project.customer_id
                ? customerById.get(project.customer_id)
                : null;
              return (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {project.project_number}
                        </div>
                      </div>
                      <Badge variant={statusVariant(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="neutral">{project.kind}</Badge>
                      <Badge variant="neutral">
                        {branch?.code ?? shortId(project.branch_id)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {project.kind === "INTERNAL"
                        ? "Internal work"
                        : customer?.name ??
                          (project.customer_id
                            ? shortId(project.customer_id)
                            : "Customer")}
                      {" · "}
                      {project.start_date ?? "No start date"}
                      {" → "}
                      {project.target_end_date ?? "No target date"}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
