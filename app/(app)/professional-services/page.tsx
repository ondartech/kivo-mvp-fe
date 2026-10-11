"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { PageHeader } from "@/components/kivo/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProfessionalEffectiveWorkspace, useProfessionalTerminology,
  type EngagementPattern, type InstallationStatus,
} from "@/features/professional-services/api";
import {
  engagementSections, findAuthorizedAction, financialLifecycleNotes,
  readableWorkspaceProblem, relevantProfessionalPattern, terminologyLabel,
} from "@/features/professional-services/workspace";
import { useOperatingBranches } from "@/features/organization/api";
import { useProjects } from "@/features/projects/api";
import { resolveProjectReadScope } from "@/features/projects/branching";
import { useActiveBranchId } from "@/hooks/use-active-branch";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";

const PATTERNS: Array<{key: EngagementPattern | null; label: string}> = [
  { key: null, label: "Recommended" },
  { key: "PROJECT", label: "Projects" },
  { key: "RETAINER", label: "Retainers" },
  { key: "TIME_BASED", label: "Time-based" },
];

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function installVariant(state: string): "success" | "warning" | "neutral" | "critical" {
  if (state === "ACTIVE" || state === "AVAILABLE_IN_CONTEXT") return "success";
  if (state === "DRIFTED" || state === "INSTALLED_CONTEXT_BLOCKED") return "warning";
  if (state === "DEACTIVATED" || state === "RETIRED") return "critical";
  return "neutral";
}
function InstallationStatusRow({label,status,detail}: {label: string; status: InstallationStatus | string; detail?: string}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 border-b py-3 last:border-0">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        {detail ? <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <Badge variant={installVariant(status)}>{humanize(status)}</Badge>
    </li>
  );
}

export default function ProfessionalServicesPage() {
  const orgId = useActiveOrganizationId() ?? "";
  const branchId = useActiveBranchId();
  const [selectedPattern, setSelectedPattern] = useState<EngagementPattern | null>(null);
  const effective = useProfessionalEffectiveWorkspace(orgId, selectedPattern);
  const terminology = useProfessionalTerminology(orgId, Boolean(effective.data));
  const branchAccess = useOperatingBranches(orgId);
  const scope = resolveProjectReadScope(branchAccess.data, branchId);

  const canLoadEngagements = Boolean(effective.data?.sections.some(
    section => section.workspace_key === "sales" || section.workspace_key === "operations",
  ));
  // Existing Projects endpoint is the only source of real commercial projects.
  // It retains its own branch/membership checks; 403 is never an empty project list.
  const projects = useProjects(orgId, {
    branchId: scope.branchId, limit: 10, sort: "created_at:desc",
    enabled: canLoadEngagements && scope.ready,
  });
  const workspace = effective.data;
  const pattern = workspace ? relevantProfessionalPattern(workspace, selectedPattern) : null;
  const clientLabel = terminologyLabel(terminology.data, "party.customer", "Customer");
  const quoteLabel = terminologyLabel(terminology.data, "commercial.quote", "Quote");
  const projectLabel = terminologyLabel(terminology.data, "work.project", "Project");
  const authorized = workspace?.authorized_actions ?? [];
  const getAction = (key: string) => findAuthorizedAction(authorized, key, orgId, branchId);
  const relevantIndustry = workspace && (
    ["professional_services", "project_services"].includes(workspace.catalogue.primary_industry_key ?? "") ||
    workspace.catalogue.pack_recommendation_state === "AVAILABLE_FOR_PLANNING"
  );

  if (!orgId) return (
    <EmptyState
      title="Select an organization"
      description="Professional Services needs an authenticated organization context. Choose an organization in Ondar first."
    />
  );

  if (effective.isLoading) return (
    <main className="space-y-5" aria-busy="true" aria-label="Loading Professional Services workspace">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-52" /><Skeleton className="h-52" /><Skeleton className="h-52" />
      </div>
      <Skeleton className="h-60" />
    </main>
  );

  if (effective.isError || !workspace) return (
    <ErrorState
      title="Professional Services workspace unavailable"
      description={readableWorkspaceProblem(effective.error)}
      retry={{label: "Try again", onClick: () => void effective.refetch()}}
    />
  );

  if (!relevantIndustry) return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Industry workspace"
        title="Professional Services"
        description="This organization's current industry or pack recommendation does not enable a Professional Services workspace."
      />
      <EmptyState
        title="Professional Services is not recommended for this profile"
        description="Review the organization's industry classification and CMP composition recommendations. The workspace cannot activate modules or bypass the acceptance process."
      />
    </div>
  );

  const steps = engagementSections(pattern);
  const visibleEngagements = projects.data?.data.filter(row => row.kind === "COMMERCIAL") ?? [];
  const planAllowed = workspace.catalogue.installation.state === "AVAILABLE_FOR_PLANNING"
    && Boolean(workspace.catalogue.installation.preview_token);
  const activeDashboards = workspace.dashboards.filter(x => x.status === "AVAILABLE_IN_CONTEXT");

  return (
    <main className="space-y-7 pb-10">
      <PageHeader
        eyebrow="Industry workspace · Professional Services"
        title="Client work, from proposal to payment"
        description="One view of your engagement workflow, with separate controls for client acceptance, billing, tax and revenue."
        actions={getAction("create-project") ? (
          <Button asChild size="sm">
            <Link href={getAction("create-project")!.href}>New {projectLabel.toLowerCase()}</Link>
          </Button>
        ) : undefined}
      />

      <section className="rounded-xl border bg-surface p-5 sm:p-6" aria-label="Workspace context">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engagement model</p>
            <h2 className="mt-1 text-lg font-semibold">{pattern ? humanize(pattern) : "Choose a way of working"}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Switching this view only changes recommendations. It never changes your registered industry, installs a pack or changes a contract.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Engagement pattern">
            {PATTERNS.map(item => (
              <button
                type="button" key={item.label}
                aria-pressed={selectedPattern === item.key}
                onClick={() => setSelectedPattern(item.key)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedPattern === item.key ? "border-neutral-900 bg-neutral-900 text-white" : "bg-surface hover:bg-neutral-50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4 text-xs">
          <Badge variant={planAllowed ? "info" : "neutral"}>
            {planAllowed ? "Pack can be reviewed for installation" : humanize(workspace.catalogue.installation.state)}
          </Badge>
          <span className="text-muted-foreground">
            CMP registry v{workspace.catalogue.composition_registry_version}
          </span>
          <span className="text-muted-foreground">
            User access from effective IUX / ICTL / WFP controls
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {planAllowed
            ? "Installing this pack requires a separate CMP plan and explicit organization approval. Nothing is installed from this page."
            : "There is no eligible CMP installation preview in the current profile. Existing capabilities remain subject to their own access and installation rules."}
        </p>
      </section>

      <section aria-labelledby="journey-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="journey-title" className="text-base font-semibold">Your service lifecycle</h2>
            <p className="mt-1 text-xs text-muted-foreground">Handoffs to the responsible Ondar modules, never assumed completions.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => {
            const action = step.actionKey ? getAction(step.actionKey) : null;
            return (
              <Card key={step.key} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">STEP {index + 1}</span>
                    <Badge variant="neutral">Governed handoff</Badge>
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Authority: {step.owner}</p>
                    {action ? (
                      <Link
                        href={action.href}
                        className="inline-flex rounded-md border px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                      >
                        {action.label} <span aria-hidden="true" className="ml-2">↗</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {step.actionKey ? "No authorized action in this context" : "Use the governing module to continue"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="engagements-title">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle id="engagements-title">Recent {projectLabel.toLowerCase()}s</CardTitle>
                <Badge variant="info">Projects authority</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Commercial work among the latest projects in your authorized Branch scope. Project completion is not client acceptance or earned revenue.
              </p>
            </CardHeader>
            <CardContent>
              {!canLoadEngagements ? (
                <p className="text-sm text-muted-foreground">No authorized Projects workspace is available for this principal.</p>
              ) : branchAccess.isLoading ? (
                <p className="text-sm text-muted-foreground">Checking Branch access…</p>
              ) : branchAccess.isError ? (
                <p className="text-sm text-muted-foreground">Could not verify Branch access.</p>
              ) : !scope.ready ? (
                <p className="text-sm text-muted-foreground">Choose an authorized Branch in the application header to see engagements.</p>
              ) : projects.isLoading ? (
                <Skeleton className="h-32" />
              ) : projects.isError ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Project data is unavailable or not permitted for this membership.
                </p>
              ) : visibleEngagements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No commercial engagements were returned for this scope.</p>
              ) : (
                <ul className="divide-y">
                  {visibleEngagements.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <Link href={`/app/projects/${encodeURIComponent(item.id)}`} className="block truncate rounded-sm text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2" aria-label={`Open ${item.name} project`}>
                          {item.name}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">{item.project_number}</div>
                      </div>
                      <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "ON_HOLD" ? "warning" : "neutral"}>
                        {humanize(item.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
        <section aria-labelledby="setup-title">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="setup-title">Set up your workspace</CardTitle>
              <p className="mt-2 text-xs text-muted-foreground">
                IUX guided setup; only approved actions can be opened.
              </p>
            </CardHeader>
            <CardContent>
              {workspace.guided_steps.length ? (
                <ul className="divide-y">
                  {workspace.guided_steps.slice(0, 7).map(step => {
                    const action = step.action_key ? getAction(step.action_key) : null;
                    return (
                      <li key={step.key} className="flex items-start justify-between gap-3 py-2.5">
                        <div>
                          <div className="text-sm font-medium">{step.title}</div>
                          <div className="text-xs text-muted-foreground">{humanize(step.status)}</div>
                        </div>
                        {action ? (
                          <Link className="shrink-0 rounded-md border px-2 py-1 text-xs font-semibold" href={action.href}>
                            Open
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No guided setup actions are currently available to this user.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="tools-title">
          <Card>
            <CardHeader>
              <CardTitle id="tools-title">Dashboards & workflow access</CardTitle>
              <p className="mt-2 text-xs text-muted-foreground">
                Catalogued definitions are not active installations or user permissions.
              </p>
            </CardHeader>
            <CardContent>
              <ul>
                {workspace.dashboards.map(item => (
                  <InstallationStatusRow key={item.key} label={humanize(item.key)}
                    status={item.status}
                    detail={item.status === "AVAILABLE_IN_CONTEXT"
                      ? `${item.visible_widget_keys.length} authorized widget(s) visible`
                      : "No effective dashboard content available"} />
                ))}
                <InstallationStatusRow label="Professional Services role pack" status={workspace.role_pack.status}
                  detail="An installed role pack never grants this user an IAM role by itself." />
                {workspace.workflow_packs.map(item => (
                  <InstallationStatusRow key={item.key} label={humanize(item.key)} status={item.status}
                    detail="Workflow activation is owned by WFP; an ACTIVE pack does not execute by itself." />
                ))}
              </ul>
              {activeDashboards.length === 0 ? (
                <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  No installed dashboard is currently visible in your authorized context.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
        <section aria-labelledby="documents-title">
          <Card>
            <CardHeader>
              <CardTitle id="documents-title">Client documents & evidence</CardTitle>
              <p className="mt-2 text-xs text-muted-foreground">
                Document families are available for source governance. This view does not assert a signed, rendered or issued file.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {workspace.catalogue.document_families.map(item => (
                  <li key={item.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <div className="font-medium">{item.key === "PROPOSAL" ? quoteLabel : item.label}</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.source_authority}</p>
                    </div>
                    <Badge variant="neutral">Source governed</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                {clientLabel} decisions, revision hashes, approvals, signatures and downloadable evidence must be verified in their owning workflows.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="rounded-lg border p-5" aria-labelledby="boundaries-title">
        <h2 className="text-sm font-semibold" id="boundaries-title">Financial and approval boundaries</h2>
        <ul className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
          {financialLifecycleNotes().map(note => (
            <li key={note} className="flex gap-2">
              <span aria-hidden="true">—</span><span>{note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Workspace configuration does not post journals, issue fiscal documents or accept client deliverables.
          Source of access: principal resolution {workspace.principal_resolution_hash.slice(0, 10)}…
        </p>
      </section>

      {terminology.isError ? (
        <p role="status" className="text-xs text-muted-foreground">
          Industry terminology is unavailable; generic resource labels are shown.
        </p>
      ) : null}
    </main>
  );
}
