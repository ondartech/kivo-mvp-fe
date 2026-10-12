"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/kivo/page-header";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrganizationId } from "@/hooks/use-active-organization";
import { useProfessionalOrganizationIdentity } from "@/features/professional-services/identity";
import {
  financialValue,
  labelState,
  planningComparison,
  usePlanningInbox,
  usePlanningWorkspace,
  useContributorInbox,
  type PlanningUnit,
} from "@/features/department-planning/api";

function dateLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-NG", {day: "numeric", month: "short", year: "numeric"}).format(parsed);
}

function StatePill({status}: {status: string}) {
  const variant = status === "SNAPSHOT_VERIFIED" || status === "ACCEPTED_FOR_CONSOLIDATION"
    ? "success" : status.includes("CHANGED") || status.includes("OVERDUE")
      ? "warning" : "neutral";
  return <Badge variant={variant}>{labelState(status)}</Badge>;
}

function SourcePanel({unit}: {unit: PlanningUnit}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{unit.unit_name || "Department"}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Organization unit · {unit.unit_id}
            </p>
          </div>
          <StatePill status={unit.source_integrity} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <dt className="text-xs text-muted-foreground">Plan packs</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{unit.plan_packs.length}</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs text-muted-foreground">Submissions</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{unit.submissions.length}</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs text-muted-foreground">Planning issues</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{unit.blockers.length}</dd>
          </div>
        </dl>

        <section aria-label={`${unit.unit_name} planning workflow`}>
          <h3 className="text-sm font-semibold">Planning lifecycle</h3>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {title:"Department submission", status:unit.submissions[0]?.status ?? "NOT_SUBMITTED"},
              {title:"Manager recommendation", status:unit.manager_reviews[0]?.status ?? "NOT_REVIEWED"},
              {title:"Finance review", status:unit.finance_reviews[0]?.status ?? "NOT_REVIEWED"},
              {title:"Corporate proposal roll-up", status:unit.consolidation?.status ?? "NOT_INCLUDED"},
            ].map(stage => (
              <li key={stage.title} className="flex flex-col gap-2 rounded-md border p-3">
                <span className="text-xs text-muted-foreground">{stage.title}</span>
                <span><StatePill status={stage.status} /></span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            A submitted plan, management recommendation, Finance acceptance, corporate sign-off
            and adopted budget are distinct. None of these status cards authorizes spending.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold">Targets — planning guidance only</h3>
          {unit.target_issues.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No target issue is available for this department.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {unit.target_issues.map(target => (
                <div key={target.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{target.target_key} · v{target.version}</span>
                    <StatePill status={target.source_integrity} />
                  </div>
                  <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {target.lines.map((line,index) => (
                      <li key={`${target.id}:${index}`}>
                        {line.category_key} · {line.period_key}: {line.currency} {line.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Target versus proposed planning cost</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only identical category, planning period and original currency are comparable.
            This is not budget-versus-actual variance.
          </p>
          {unit.planning_target_variances.length ? (
            <div className="mt-3 overflow-x-auto rounded-md border">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead className="bg-neutral-50 text-muted-foreground">
                  <tr>
                    <th scope="col" className="p-3">Category / period</th>
                    <th scope="col" className="p-3">Target</th>
                    <th scope="col" className="p-3">Proposal</th>
                    <th scope="col" className="p-3">Difference</th>
                    <th scope="col" className="p-3">Comparison</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.planning_target_variances.map((comparison,index) => (
                    <tr key={`${comparison.category_key}:${comparison.period_key}:${comparison.currency}:${index}`}
                        className="border-t">
                      <td className="p-3 font-medium">{comparison.category_key} / {comparison.period_key}</td>
                      <td className="p-3 tabular-nums">{planningComparison(comparison.target_amount, comparison.currency)}</td>
                      <td className="p-3 tabular-nums">{planningComparison(comparison.proposed_amount, comparison.currency)}</td>
                      <td className="p-3 tabular-nums">{planningComparison(comparison.variance_amount, comparison.currency)}</td>
                      <td className="p-3"><StatePill status={comparison.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">No source-verified DPLAN-013 comparison is available.</p>}
        </section>

        <section className="grid gap-4 lg:grid-cols-3" aria-label="Department initiatives and cross-team handoffs">
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-semibold">Initiatives &amp; requests</h3>
            <p className="mt-1 text-xs text-muted-foreground">Proposal evidence only, not a procurement or staffing approval.</p>
            {unit.initiatives.length ? (
              <ul className="mt-3 space-y-2">
                {unit.initiatives.map(item => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs">Proposal register v{item.version}</span>
                    <StatePill status={item.status}/>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-xs text-muted-foreground">No published initiative register.</p>}
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-semibold">Interdepartmental dependencies</h3>
            <p className="mt-1 text-xs text-muted-foreground">Receiver acknowledgments do not create spending authority.</p>
            {unit.dependencies.length ? (
              <ul className="mt-3 space-y-2">
                {unit.dependencies.map(item => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs">{item.dependency_key}</span>
                    <StatePill status={item.status}/>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-xs text-muted-foreground">No scoped dependency requests.</p>}
          </div>
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-semibold">Clarifications &amp; evidence</h3>
            <p className="mt-1 text-xs text-muted-foreground">Requests linked to this department's planning packs.</p>
            {unit.discussions.length ? (
              <ul className="mt-3 space-y-2">
                {unit.discussions.map(item => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs">{item.topic}</span>
                    <StatePill status={item.status}/>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-xs text-muted-foreground">No current discussion threads.</p>}
          </div>
        </section>

        {unit.replanning.length ? (
          <section>
            <h3 className="text-sm font-semibold">Mid-year replanning</h3>
            <ul className="mt-2 space-y-2">
              {unit.replanning.map(caseItem => (
                <li key={caseItem.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>Prospective from {dateLabel(caseItem.effective_date)}</span>
                    <StatePill status={caseItem.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Original signed baseline {caseItem.baseline_signoff_id}. Replanning never rewrites it.
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {unit.blockers.length ? (
          <section aria-label={`${unit.unit_name} attention items`} className="rounded-md border p-4">
            <h3 className="text-sm font-semibold">Needs attention</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {unit.blockers.map(blocker => <li key={blocker}>{labelState(blocker)}</li>)}
            </ul>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ContributorList({
  data, loading, onNext, onPrevious,
}: {
  data: ReturnType<typeof useContributorInbox>["data"];
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  if (loading) return <div aria-busy="true" className="text-sm text-muted-foreground">Loading assigned planning work…</div>;
  if (!data?.items.length) return null;
  return (
    <section className="rounded-lg border bg-surface p-4" aria-label="My assigned planning tasks">
      <h2 className="text-sm font-semibold">My PLAN-011 assignments</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Category-specific work, not access to another department's planning pack.
      </p>
      <ul className="mt-3 space-y-2">
        {data.items.map(item => (
          <li key={item.assignment_id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <span className="text-sm font-medium">{item.category_key} · {labelState(item.role)}</span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Due {dateLabel(item.due_at)}</span>
              <StatePill status={item.stage}/>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" disabled={data.offset===0} onClick={onPrevious}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={!data.has_more} onClick={onNext}>Next</Button>
      </div>
    </section>
  );
}

export default function DepartmentPlanningPage() {
  const membershipOrgId = useActiveOrganizationId() ?? "";
  const identity = useProfessionalOrganizationIdentity(membershipOrgId);
  const orgId = identity.publicOrganizationId ?? "";
  const [pageCursor, setPageCursor] = useState(0);
  const [previousCursors, setPreviousCursors] = useState<number[]>([]);
  const inbox = usePlanningInbox(orgId, pageCursor);
  const [assignmentOffset,setAssignmentOffset] = useState(0);
  const assignments = useContributorInbox(orgId,assignmentOffset);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const memberships = inbox.data?.items ?? [];
  const currentCampaign = memberships.some(item => item.campaign_id === selectedCampaignId)
    ? selectedCampaignId : memberships[0]?.campaign_id ?? "";
  const workspace = usePlanningWorkspace(orgId, currentCampaign);

  useEffect(() => {
    setSelectedCampaignId("");
    setPageCursor(0);
    setPreviousCursors([]);
    setAssignmentOffset(0);
  }, [orgId]);

  if (!membershipOrgId) return (
    <EmptyState title="Choose an organization"
      description="Planning is available only through your active authenticated organization membership." />
  );
  if (identity.isLoading) return (
    <main className="space-y-4" aria-busy="true" aria-label="Resolving organization">
      <Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" />
    </main>
  );
  if (identity.isError || !orgId) return (
    <ErrorState title="Could not verify your organization identity"
      description="An authenticated organization identity is required before loading departmental plans."
      retry={{label:"Retry",onClick:()=>void identity.refetch()}} />
  );
  if (inbox.isLoading) return (
    <main className="space-y-4" aria-busy="true" aria-label="Loading planning assignments">
      <Skeleton className="h-20 w-full" /><Skeleton className="h-44 w-full" />
    </main>
  );
  if (inbox.isError) return (
    <ErrorState title="Department planning inbox unavailable"
      description={inbox.error instanceof Error ? inbox.error.message : "Access is not available for this membership."}
      retry={{label:"Retry",onClick:()=>void inbox.refetch()}} />
  );
  if (!memberships.length && inbox.data?.has_more && inbox.data.next_cursor != null) return (
    <main className="space-y-5">
      <PageHeader eyebrow="Department planning" title="Planning workspace"
        description="No assigned campaign was found in this portion of the campaign index." />
      <Button variant="secondary" onClick={() => {
        setPreviousCursors(items => [...items, pageCursor]);
        setPageCursor(inbox.data!.next_cursor!);
      }}>Continue searching your authorized campaigns</Button>
    </main>
  );
  if (!memberships.length) return (
    <main className="space-y-5">
      <PageHeader eyebrow="Department planning" title="Planning workspace"
        description="Your assigned departmental campaigns and individual PLAN-011 work." />
      <ContributorList data={assignments.data} loading={assignments.isLoading}
        onNext={() => setAssignmentOffset(value => value + 25)}
        onPrevious={() => setAssignmentOffset(value => Math.max(0,value - 25))} />

      <PageHeader eyebrow="Department planning" title="Planning workspace"
        description="Your assigned departmental campaigns and governed decisions." />
      {!assignments.isLoading && !assignments.data?.items.length ? (
        <EmptyState title="No accessible planning campaigns"
          description="No published campaign or PLAN-011 assignment is linked to your current membership." />
      ) : null}
    </main>
  );

  const data = workspace.data;
  return (
    <main className="space-y-6 pb-10">
      <PageHeader eyebrow="Planning · Department workspace" title="Plans and decisions"
        description="Your department’s planning submissions, review status, corporate proposals and replanning evidence."
        actions={
          <Button variant="secondary" size="sm" onClick={() => {
            void inbox.refetch(); void workspace.refetch();
          }}>Refresh</Button>
        } />

      <ContributorList data={assignments.data} loading={assignments.isLoading}
        onNext={() => setAssignmentOffset(value => value + 25)}
        onPrevious={() => setAssignmentOffset(value => Math.max(0,value - 25))} />
      <section className="rounded-lg border bg-surface p-4" aria-label="Planning campaign selection">
        <label htmlFor="dplan-campaign" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned campaign
        </label>
        <select id="dplan-campaign" value={currentCampaign}
          onChange={event => setSelectedCampaignId(event.target.value)}
          className="mt-2 block w-full max-w-xl rounded-md border bg-surface px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          {memberships.map(item => (
            <option key={item.campaign_id} value={item.campaign_id}>
              {item.campaign_id} · {labelState(item.viewed_as)} · {item.unit_ids.length} unit(s)
            </option>
          ))}
        </select>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {previousCursors.length ? (
            <Button size="sm" variant="secondary" onClick={() => {
              const last = previousCursors[previousCursors.length - 1] ?? 0;
              setPageCursor(last);
              setPreviousCursors(items => items.slice(0, -1));
              setSelectedCampaignId("");
            }}>Previous page</Button>
          ) : null}
          {inbox.data?.has_more && inbox.data.next_cursor != null ? (
            <Button size="sm" variant="secondary" onClick={() => {
              setPreviousCursors(items => [...items, pageCursor]);
              setPageCursor(inbox.data?.next_cursor ?? 0);
              setSelectedCampaignId("");
            }}>Next page of accessible campaigns</Button>
          ) : null}
        </div>
      </section>

      {workspace.isLoading ? (
        <section className="space-y-4" aria-busy="true" aria-label="Loading campaign">
          <Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" />
        </section>
      ) : workspace.isError || !data ? (
        <ErrorState title="Campaign details unavailable"
          description={workspace.error instanceof Error
            ? workspace.error.message
            : "This campaign may no longer be accessible to your organizational responsibility."}
          retry={{label:"Retry campaign",onClick:()=>void workspace.refetch()}} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Campaign context">
            <Card><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Campaign / role</div>
              <div className="mt-2 font-semibold">{labelState(data.campaign_kind)}</div>
              <div className="mt-1"><StatePill status={data.viewed_as} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{labelState(data.campaign_status)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Submission deadline</div>
              <div className="mt-2 font-semibold">{dateLabel(data.submission_due_at)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Planning cycle · {data.cycle_id}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Review deadline</div>
              <div className="mt-2 font-semibold">{dateLabel(data.review_due_at)}</div>
              <p className="mt-1 text-xs text-muted-foreground">As of {dateLabel(data.campaign_as_of)}</p>
            </CardContent></Card>
          </section>

          {data.corporate_signoff ? (
            <section className="rounded-lg border p-4" aria-label="Corporate planning sign-off">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Corporate planning sign-off</h2>
                <StatePill status={data.corporate_signoff.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Quorum {data.corporate_signoff.quorum} · Documentary planning handoff, not budget adoption.
              </p>
            </section>
          ) : null}

          <section aria-label="Financial authority and variance">
            <h2 className="mb-2 text-base font-semibold">Budget, execution and forecast</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Source-backed financial metrics appear only after Finance/BUD/COMMIT/FCST mapping is certified.
              Unavailable does not mean zero.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.financial_sources).map(([key,slot]) => (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-muted-foreground">{labelState(key)}</div>
                    <div className="mt-2 text-sm font-semibold">{financialValue(slot)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Authority: {slot.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-label="Scoped departmental plans" className="space-y-4">
            <h2 className="text-base font-semibold">
              Accessible departments ({data.units.length})
            </h2>
            {data.units.map(unit => <SourcePanel key={unit.unit_id} unit={unit} />)}
          </section>
          <p className="text-xs text-muted-foreground">
            Refreshed {dateLabel(data.generated_at)}. This view is a planning evidence
            projection, not a requisition, budget approval or spending authorization.
          </p>
        </>
      )}
    </main>
  );
}
