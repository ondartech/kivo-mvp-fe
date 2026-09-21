import { z } from "zod";

export const matchModeSchema = z.enum(["TWO_WAY", "THREE_WAY", "NOT_REQUIRED"]);
export const matchResultSchema = z.enum([
  "MATCHED",
  "PARTIAL_MATCH",
  "MISMATCH",
  "REVIEW_REQUIRED",
  "NOT_REQUIRED",
]);
export const matchLineResultSchema = z.enum([
  "MATCHED",
  "PARTIAL_MATCH",
  "MISMATCH",
  "REVIEW_REQUIRED",
]);
export const matchExceptionTypeSchema = z.enum([
  "QUANTITY_VARIANCE",
  "PRICE_VARIANCE",
  "TAX_VARIANCE",
  "CURRENCY_VARIANCE",
  "MISSING_RECEIPT",
  "MISSING_ORDER",
  "UNKNOWN_REFERENCE",
  "DUPLICATE_BILL",
  "SOURCE_VERSION_STALE",
]);
export const matchExceptionStatusSchema = z.enum(["OPEN", "RESOLVED"]);
export const matchResolutionCodeSchema = z.enum([
  "ACCEPT_VARIANCE",
  "CONFIRM_REFERENCE",
  "DUPLICATE_REVIEWED",
  "OTHER",
]);

export const matchReviewQueueItemSchema = z
  .object({
    supplier_bill_id: z.string().uuid(),
    bill_number: z.string(),
    supplier_party_id: z.string().uuid(),
    supplier_snapshot: z.record(z.unknown()),
    supplier_invoice_number: z.string(),
    bill_date: z.string(),
    due_date: z.string().nullable(),
    currency: z.string().length(3),
    grand_total: z.string(),
    bill_status: z.string(),
    bill_version: z.number().int().positive(),
    source_type: z.string(),
    purchase_order_id: z.string().uuid().nullable(),
    latest_evaluation_id: z.string().uuid().nullable(),
    match_mode: matchModeSchema.nullable(),
    match_result: matchResultSchema.nullable(),
    evaluation_hash: z.string().nullable(),
    evaluated_at: z.string().nullable(),
    open_exception_count: z.number().int().nonnegative(),
    open_material_exception_count: z.number().int().nonnegative(),
  })
  .strict();

export const matchReviewQueueSchema = z
  .object({
    data: z.array(matchReviewQueueItemSchema),
  })
  .strict();

export const matchLineSchema = z
  .object({
    id: z.string().uuid(),
    evaluation_id: z.string().uuid(),
    bill_line_id: z.string().uuid(),
    order_line_id: z.string().uuid().nullable(),
    result: matchLineResultSchema,
    application_ids: z.array(z.string()),
    billed_quantity: z.string(),
    applied_quantity: z.string(),
    ordered_quantity: z.string().nullable(),
    evidence_quantity: z.string().nullable(),
    bill_unit_price: z.string(),
    order_unit_price: z.string().nullable(),
    bill_tax_amount: z.string(),
    order_tax_amount: z.string().nullable(),
    description_match: z.boolean().nullable(),
    comparison: z.record(z.unknown()),
    source_snapshot: z.record(z.unknown()),
    created_at: z.string(),
  })
  .strict();

export const matchEvaluationSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    supplier_bill_id: z.string().uuid(),
    bill_version: z.number().int().positive(),
    match_mode: matchModeSchema,
    result: matchResultSchema,
    evaluation_hash: z.string(),
    application_ids: z.array(z.string()),
    summary: z.record(z.unknown()),
    evidence_snapshot: z.record(z.unknown()),
    evaluated_by_user_id: z.string().uuid().nullable(),
    created_at: z.string(),
    line_results: z.array(matchLineSchema),
  })
  .strict();

export const matchEvaluationListSchema = z
  .object({
    data: z.array(matchEvaluationSchema),
  })
  .strict();

export const matchExceptionSchema = z
  .object({
    id: z.string().uuid(),
    supplier_bill_id: z.string().uuid(),
    evaluation_id: z.string().uuid(),
    match_line_id: z.string().uuid().nullable(),
    bill_line_id: z.string().uuid().nullable(),
    bill_version: z.number().int().positive(),
    exception_type: matchExceptionTypeSchema,
    status: matchExceptionStatusSchema,
    material: z.boolean(),
    fingerprint: z.string(),
    variance: z.record(z.unknown()),
    evidence: z.record(z.unknown()),
    resolution_code: z.string().nullable(),
    resolution_reason: z.string().nullable(),
    resolved_by_user_id: z.string().uuid().nullable(),
    resolved_at: z.string().nullable(),
    created_at: z.string(),
    current_bill_version: z.boolean(),
    current_evaluation: z.boolean(),
  })
  .strict();

export const matchExceptionListSchema = z
  .object({
    data: z.array(matchExceptionSchema),
  })
  .strict();

export type MatchReviewQueueItem = z.infer<typeof matchReviewQueueItemSchema>;
export type MatchEvaluation = z.infer<typeof matchEvaluationSchema>;
export type MatchLine = z.infer<typeof matchLineSchema>;
export type MatchException = z.infer<typeof matchExceptionSchema>;
export type MatchResolutionCode = z.infer<typeof matchResolutionCodeSchema>;

export function supplierDisplayName(snapshot: Record<string, unknown>): string {
  for (const key of ["display_name", "legal_name", "name", "trading_name"]) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Supplier";
}

export function billLineDescription(line: MatchLine): string {
  const billLine = line.source_snapshot.bill_line;
  if (billLine && typeof billLine === "object" && !Array.isArray(billLine)) {
    const value = (billLine as Record<string, unknown>).description;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Supplier bill line";
}

export function needsReview(item: MatchReviewQueueItem): boolean {
  if (!item.latest_evaluation_id) return true;
  if (item.open_exception_count > 0) return true;
  return !["MATCHED", "NOT_REQUIRED"].includes(item.match_result ?? "");
}

export function reviewPriority(item: MatchReviewQueueItem): number {
  if (item.open_material_exception_count > 0) return 0;
  if (!item.latest_evaluation_id) return 1;
  if (item.match_result === "MISMATCH") return 2;
  if (item.match_result === "REVIEW_REQUIRED") return 3;
  if (item.match_result === "PARTIAL_MATCH") return 4;
  return 5;
}


export function formatDecimalText(value: string | null): string {
  if (value === null) return "—";
  if (!value.includes(".")) return value;
  const trimmed = value.replace(/0+$/, "").replace(/\.$/, "");
  return trimmed || "0";
}
