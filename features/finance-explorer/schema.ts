import { z } from "zod";

export const accountClassSchema = z.enum([
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "CONTRA_REVENUE",
  "COST_OF_SALES",
  "EXPENSE",
  "OTHER_INCOME",
  "OTHER_EXPENSE",
]);

export const financeAccountSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  account_class: accountClassSchema,
  account_type: z.string(),
  parent_account_id: z.string().uuid().nullable(),
  normal_balance: z.enum(["DEBIT", "CREDIT"]),
  management_type: z.enum(["SYSTEM", "USER"]),
  system_key: z.string().nullable(),
  template_version: z.string().nullable(),
  is_control_account: z.boolean(),
  control_type: z.string().nullable(),
  allows_manual_posting: z.boolean(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  archived_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
}).strict();

export const financeAccountListSchema = z.object({
  data: z.array(financeAccountSchema),
}).strict();

export const sourceReferenceSchema = z.object({
  source_domain: z.string(),
  source_type: z.string(),
  source_id: z.string().uuid(),
  source_event_id: z.string().uuid(),
  source_event_type: z.string(),
  source_event_version: z.number().int(),
  source_aggregate_type: z.string(),
}).strict();

export const reportingRateEvidenceSchema = z.object({
  legal_entity_id: z.string().uuid(),
  functional_currency: z.string().length(3),
  presentation_currency: z.string().length(3),
  basis: z.enum(["CLOSING", "PERIOD_AVERAGE"]),
  translated: z.boolean(),
  reporting_rate_snapshot_id: z.string().uuid().nullable(),
  effective_rate: z.string().nullable(),
  policy_version: z.string().nullable(),
  constituent_rate_hash: z.string().nullable(),
}).strict();

export const reportTranslationContextSchema = z.object({
  id: z.string().uuid().nullable(),
  report_type: z.enum(["TRIAL_BALANCE", "ACCOUNT_ACTIVITY", "PROFIT_AND_LOSS"]),
  report_classification: z.enum([
    "FUNCTIONAL_BOOKS",
    "PRESENTATION_REPORT",
    "COMBINED_MANAGEMENT",
  ]),
  presentation_currency: z.string().length(3),
  translation_basis: z.enum(["CLOSING", "PERIOD_AVERAGE"]),
  translated: z.boolean(),
  from_date: z.string(),
  to_date: z.string(),
  source_report_hash: z.string(),
  rate_set_hash: z.string().nullable(),
  context_hash: z.string().nullable(),
  scope_payload: z.record(z.unknown()),
  rate_snapshot_ids: z.array(z.string().uuid()).default([]),
  legal_entity_ids: z.array(z.string().uuid()).default([]),
  functional_currencies: z.array(z.string().length(3)).default([]),
  policy_versions: z.array(z.string()).default([]),
  rate_evidence: z.array(reportingRateEvidenceSchema).default([]),
  created_by_user_id: z.string().uuid().nullable(),
  created_at: z.string().nullable(),
}).strict();

export const accountActivityLineSchema = z.object({
  line_id: z.string().uuid(),
  accounting_date: z.string(),
  journal_entry_id: z.string().uuid(),
  entry_number: z.string(),
  entry_type: z.string(),
  journal_status: z.string(),
  posted_at: z.string(),
  line_number: z.number().int().positive(),
  description: z.string(),
  debit_base: z.string(),
  credit_base: z.string(),
  running_debit: z.string(),
  running_credit: z.string(),
  running_balance: z.string(),
  running_balance_side: z.enum(["DEBIT", "CREDIT", "ZERO"]),
  presentation_debit: z.string(),
  presentation_credit: z.string(),
  presentation_running_debit: z.string(),
  presentation_running_credit: z.string(),
  presentation_running_balance: z.string(),
  presentation_running_balance_side: z.enum(["DEBIT", "CREDIT", "ZERO"]),
  legal_entity_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable(),
  project_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid().nullable(),
  vendor_id: z.string().uuid().nullable(),
  order_id: z.string().uuid().nullable(),
  commercial_item_id: z.string().uuid().nullable(),
  inventory_location_id: z.string().uuid().nullable(),
  dimensions: z.record(z.unknown()),
  reversal_of_entry_id: z.string().uuid().nullable(),
  reversed_by_entry_id: z.string().uuid().nullable(),
  financial_event_id: z.string().uuid(),
  financial_event_status: z.string(),
  posting_profile_key: z.string(),
  posting_rule_key: z.string(),
  posting_rule_version: z.number().int(),
  correlation_id: z.string().nullable(),
  source: sourceReferenceSchema,
}).strict();

export const accountActivitySchema = z.object({
  organization_id: z.string().uuid(),
  report_scope_type: z.enum(["ORGANIZATION", "LEGAL_ENTITY", "BRANCH"]),
  legal_entity_id: z.string().uuid().nullable(),
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  account_class: z.string(),
  account_type: z.string(),
  normal_balance: z.enum(["DEBIT", "CREDIT"]),
  account_status: z.enum(["ACTIVE", "ARCHIVED"]),
  base_currency: z.string().length(3),
  presentation_currency: z.string().length(3),
  from_date: z.string(),
  to_date: z.string(),
  branch_id: z.string().uuid().nullable(),
  project_id: z.string().uuid().nullable(),
  opening_debit: z.string(),
  opening_credit: z.string(),
  activity_debit: z.string(),
  activity_credit: z.string(),
  closing_debit: z.string(),
  closing_credit: z.string(),
  presentation_opening_debit: z.string(),
  presentation_opening_credit: z.string(),
  presentation_activity_debit: z.string(),
  presentation_activity_credit: z.string(),
  presentation_closing_debit: z.string(),
  presentation_closing_credit: z.string(),
  translation_context: reportTranslationContextSchema,
  data: z.array(accountActivityLineSchema),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
}).strict();

export const journalLineSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  journal_entry_id: z.string().uuid(),
  line_number: z.number().int().positive(),
  account_id: z.string().uuid(),
  description: z.string(),
  debit_transaction: z.string(),
  credit_transaction: z.string(),
  debit_base: z.string(),
  credit_base: z.string(),
  branch_id: z.string().uuid().nullable(),
  project_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid().nullable(),
  vendor_id: z.string().uuid().nullable(),
  order_id: z.string().uuid().nullable(),
  commercial_item_id: z.string().uuid().nullable(),
  inventory_location_id: z.string().uuid().nullable(),
  dimensions: z.record(z.unknown()),
}).strict();

export const journalEntrySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  entry_number: z.string(),
  entry_type: z.enum(["SYSTEM", "OPENING", "ADJUSTMENT", "REVERSAL"]),
  status: z.enum(["POSTED", "REVERSED"]),
  accounting_date: z.string(),
  occurred_at: z.string().nullable(),
  created_at: z.string(),
  posted_at: z.string(),
  source_domain: z.string(),
  source_type: z.string(),
  source_id: z.string().uuid(),
  source_event_id: z.string().uuid(),
  financial_event_id: z.string().uuid(),
  posting_profile_key: z.string(),
  posting_rule_key: z.string(),
  posting_rule_version: z.number().int(),
  posting_rule_version_id: z.string().uuid(),
  transaction_currency: z.string().length(3),
  base_currency: z.string().length(3),
  fx_rate: z.string().nullable(),
  total_debit_base: z.string(),
  total_credit_base: z.string(),
  reversal_of_entry_id: z.string().uuid().nullable(),
  reversed_by_entry_id: z.string().uuid().nullable(),
  memo: z.string().nullable(),
  reason: z.string().nullable(),
  created_by_principal: z.string(),
  correlation_id: z.string().nullable(),
  causation_id: z.string().uuid().nullable(),
  lines: z.array(journalLineSchema),
}).strict();

export const journalSourceTraceSchema = z.object({
  organization_id: z.string().uuid(),
  journal_entry_id: z.string().uuid(),
  entry_number: z.string(),
  entry_type: z.string(),
  journal_status: z.string(),
  accounting_date: z.string(),
  reversal_of_entry_id: z.string().uuid().nullable(),
  reversed_by_entry_id: z.string().uuid().nullable(),
  financial_event_id: z.string().uuid(),
  financial_event_status: z.string(),
  event_type: z.string(),
  posting_profile_key: z.string(),
  posting_rule_key: z.string(),
  posting_rule_version: z.number().int(),
  posting_rule_version_id: z.string().uuid(),
  correlation_id: z.string().nullable(),
  causation_id: z.string().uuid().nullable(),
  source: sourceReferenceSchema,
}).strict();

export type FinanceAccount = z.infer<typeof financeAccountSchema>;
export type AccountActivity = z.infer<typeof accountActivitySchema>;
export type AccountActivityLine = z.infer<typeof accountActivityLineSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type JournalSourceTrace = z.infer<typeof journalSourceTraceSchema>;

export function accountProtectionLabels(account: FinanceAccount): string[] {
  const labels: string[] = [];
  if (account.management_type === "SYSTEM") labels.push("System");
  if (account.is_control_account) labels.push("Control");
  if (!account.allows_manual_posting) labels.push("Manual posting blocked");
  return labels;
}

export function shortIdentifier(value: string | null): string {
  if (!value) return "—";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function humanize(value: string): string {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
