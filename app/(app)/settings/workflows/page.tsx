import { WorkflowCatalog } from "@/features/workflows/catalog";

export default function WorkflowSettingsPage() {
  return (
    <WorkflowCatalog
      eyebrow="Settings"
      title="Workflows & automation"
      description="Manage the organization-wide workflow definitions that control approvals, reviews, notifications and other allowed business-process actions."
    />
  );
}
