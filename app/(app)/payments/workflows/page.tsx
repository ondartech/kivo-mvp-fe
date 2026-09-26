import { WorkflowCatalog } from "@/features/workflows/catalog";

export default function PaymentWorkflowSettingsPage() {
  return (
    <WorkflowCatalog
      domain="PAYMENTS"
      eyebrow="Payments"
      title="Payment workflows"
      description="Configure the workflows that apply after payment outcomes, exceptions and other Payments-domain events. These are the same centrally owned definitions shown under Workflows & automation."
    />
  );
}
