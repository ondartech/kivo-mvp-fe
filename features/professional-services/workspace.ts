import type {
  EngagementPattern, ProfessionalAction, ProfessionalEffectiveWorkspace,
  ProfessionalTerminology,
} from "./api";

const DESTINATIONS: Record<string, { destination: string; href: string }> = {
  "create-customer": { destination: "customers.create", href: "/app/customers/new" },
  "create-quote": { destination: "quotes.create", href: "/app/quotes/new" },
  "create-contract": { destination: "contracts.create", href: "/app/contracts/new" },
  "create-project": { destination: "projects.create", href: "/app/projects/new" },
  "create-task": { destination: "tasks.create", href: "/app/tasks/new" },
  "create-invoice": { destination: "invoicing.create", href: "/app/invoices/new" },
  "record-payment": { destination: "payments.record", href: "/app/payments" },
};
// The frontend does not yet implement dedicated Contract/Task creation pages.
// A backend-authorized action is not sufficient to invent a local destination.
const IMPLEMENTED_DESTINATIONS = new Set([
  "create-customer", "create-quote", "create-project", "create-invoice",
]);

export function safeProfessionalActionHref(
  action: ProfessionalAction,
  organizationId: string,
  activeBranchId: string | null,
): string | null {
  const expected = DESTINATIONS[action.key];
  if (!expected || !IMPLEMENTED_DESTINATIONS.has(action.key)) return null;
  if (action.organization_public_id !== organizationId) return null;
  if (action.destination_key !== expected.destination) return null;
  // A branch-specific deep-link may not be silently redirected to a different
  // active branch. The owning creation page still validates the entity scope.
  if (action.branch_public_id && action.branch_public_id !== activeBranchId) return null;
  return expected.href;
}

export function findAuthorizedAction(
  actions: ProfessionalAction[],
  actionKey: string,
  orgId: string,
  activeBranchId: string | null,
): { label: string; href: string } | null {
  const match = actions.find(row => row.key === actionKey);
  if (!match) return null;
  const href = safeProfessionalActionHref(match, orgId, activeBranchId);
  return href ? { label: match.label, href } : null;
}

export type EngagementSection = {
  key: string; title: string; description: string;
  owner: string; actionKey: string | null;
};

export function engagementSections(pattern: EngagementPattern | null): EngagementSection[] {
  const common: EngagementSection[] = [
    {
      key: "proposal", title: "Proposals & clients",
      description: "Start with a quote; proposals and customers retain their own approval and identity rules.",
      owner: "Quotes · Customers", actionKey: "create-quote",
    },
    {
      key: "engagement", title: "Engagement & SOW",
      description: "A contract-backed statement of work is not signed or issued simply because a source exists.",
      owner: "Contracts · IDOC", actionKey: null,
    },
  ];
  const delivery: EngagementSection[] = pattern === null
    ? [
        { key: "delivery", title: "Engagement delivery",
          description: "Choose an engagement model to see project, time-based or retainer handoffs.",
          owner: "Projects · Contracts", actionKey: null },
      ]
    : pattern === "RETAINER"
    ? [
        { key: "retainer", title: "Retainer periods",
          description: "Signed terms and authorized periods govern billing; a renewal is never assumed.",
          owner: "Contracts · PRO-004", actionKey: null },
        { key: "delivery", title: "Time & services",
          description: "Operational time approval is distinct from customer tariff and invoice authority.",
          owner: "PRO-003 · PRO-006", actionKey: null },
      ]
    : pattern === "TIME_BASED"
      ? [
          { key: "delivery", title: "Time & billable work",
            description: "Review approved time and contractual rates before preparing any invoice.",
            owner: "PRO-003 · PRO-006", actionKey: null },
          { key: "review", title: "Client evidence",
            description: "Submit current evidence and obtain a governed acceptance decision.",
            owner: "Projects · Evidence", actionKey: null },
        ]
      : [
          { key: "delivery", title: "Project delivery",
            description: "Track engagement milestones independently from customer acceptance.",
            owner: "Projects", actionKey: "create-project" },
          { key: "review", title: "Deliverables & acceptance",
            description: "Client acceptance applies to an exact revision and does not itself earn revenue.",
            owner: "PRO-005 · Evidence", actionKey: null },
        ];
  return [
    ...common, ...delivery,
    { key: "billing", title: "Billing & collections",
      description: "Invoice, WHT, settlement, fiscalization and revenue recognition are separate governed lifecycles.",
      owner: "Invoicing · Finance · NRS", actionKey: "create-invoice" },
  ];
}

export function terminologyLabel(
  terms: ProfessionalTerminology | undefined,
  key: string,
  generic: string,
): string {
  const label = terms?.labels?.[key];
  return typeof label === "string" && label.trim() ? label : generic;
}

export function relevantProfessionalPattern(
  workspace: ProfessionalEffectiveWorkspace,
  selected: EngagementPattern | null,
): EngagementPattern | null {
  if (selected) return selected;
  const signalled = workspace.catalogue.engagement_patterns.filter(
    item => item.recommendation_source === "BIZ_SIGNAL",
  );
  return signalled.length === 1 ? signalled[0].key : null;
}

export function readableWorkspaceProblem(error: unknown): string {
  const candidate = error as { status?: number; message?: string } | null;
  if (candidate?.status === 401 || candidate?.status === 403) {
    return "Your current organization membership is not authorized for this workspace.";
  }
  if (candidate?.status === 404) {
    return "The Professional Services workspace API is not available on this backend environment.";
  }
  return candidate?.message ?? "The Professional Services workspace could not be loaded.";
}

export function financialLifecycleNotes() {
  return [
    "Approved time is not an invoice.",
    "Accepted delivery is not automatically earned revenue.",
    "A draft document is not a signed or issued document.",
    "Invoice payment and NRS fiscalization have separate statuses.",
  ] as const;
}
