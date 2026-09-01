import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Separate dimensions — never collapse (AGENTS.md:7, DESIGN.md:10)
type DocumentStatus = "DRAFT" | "ISSUED" | "VOID";
type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "PENDING" | "FAILED";
type CollectionStatus = "CURRENT" | "DUE_SOON" | "DUE_TODAY" | "OVERDUE";
type ViewStatus = "UNVIEWED" | "VIEWED";

const docMap: Record<DocumentStatus, { label: string; variant: "neutral" | "info" | "critical" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  ISSUED: { label: "Issued", variant: "info" },
  VOID: { label: "Void", variant: "critical" },
};

const payMap: Record<PaymentStatus, { label: string; variant: "neutral" | "info" | "success" | "critical" | "processing" }> = {
  UNPAID: { label: "Unpaid", variant: "neutral" },
  PARTIALLY_PAID: { label: "Partially paid", variant: "info" },
  PAID: { label: "Paid", variant: "success" },
  PENDING: { label: "Pending", variant: "processing" },
  FAILED: { label: "Failed", variant: "critical" },
};

const colMap: Record<CollectionStatus, { label: string; variant: "neutral" | "warning" | "critical" }> = {
  CURRENT: { label: "Current", variant: "neutral" },
  DUE_SOON: { label: "Due soon", variant: "warning" },
  DUE_TODAY: { label: "Due today", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "critical" },
};

export function InvoiceStatus({ status }: { status: DocumentStatus }) {
  const s = docMap[status];
  return <Badge variant={s.variant === "info" ? "info" : s.variant}>{s.label}</Badge>;
}
export function PaymentState({ status }: { status: PaymentStatus }) {
  const s = payMap[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function CollectionState({ status }: { status: CollectionStatus }) {
  const s = colMap[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function ViewBadge({ status }: { status: ViewStatus }) {
  return status === "VIEWED" ? <Badge variant="neutral">Viewed</Badge> : <Badge variant="info">Unviewed</Badge>;
}

// Combined helper — hierarchy: financial state primary, operational secondary
export function InvoiceStatusGroup({
  documentStatus,
  paymentStatus,
  collectionStatus,
  className,
}: {
  documentStatus: DocumentStatus;
  paymentStatus: PaymentStatus;
  collectionStatus: CollectionStatus;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <InvoiceStatus status={documentStatus} />
      <PaymentState status={paymentStatus} />
      {/* collection only when actionable */}
      {(collectionStatus === "OVERDUE" || collectionStatus === "DUE_TODAY") && (
        <CollectionState status={collectionStatus} />
      )}
    </span>
  );
}
