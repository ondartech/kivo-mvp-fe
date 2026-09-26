import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const decimalStringSchema = z
  .string()
  .regex(/^-?\d+(?:\.\d+)?$/, "Amount must be a decimal string");

const nullableUuid = uuidSchema.nullable();
const nullableString = z.string().nullable();
const recordSchema = z.record(z.unknown());

export const bankAccountSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  bank_code: z.string(),
  bank_name: z.string(),
  account_number_masked: z.string(),
  account_number_last4: z.string(),
  account_name: z.string(),
  currency: z.string(),
  verification_status: z.string(),
  verification_match_type: nullableString,
  verified_at: nullableString,
  is_default: z.boolean(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentObligationSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  branch_id: nullableUuid,
  obligation_type: z.string(),
  source_type: z.string(),
  source_id: uuidSchema,
  counterparty_type: z.string(),
  counterparty_id: nullableUuid,
  currency: z.string(),
  original_amount: decimalStringSchema,
  outstanding_amount: decimalStringSchema,
  due_date: nullableString,
  earliest_payment_date: nullableString,
  status: z.string(),
  control_status: z.string(),
  hold_reason: nullableString,
  held_at: nullableString,
  held_by_user_id: nullableUuid,
  source_snapshot: recordSchema,
  beneficiary_snapshot: recordSchema,
  version: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentObligationListSchema = z.object({
  data: z.array(paymentObligationSchema),
  next_cursor: nullableString.optional().default(null),
});

export const paymentRunItemSchema = z.object({
  id: uuidSchema,
  payment_obligation_id: uuidSchema,
  branch_id: nullableUuid,
  allocated_amount: decimalStringSchema,
  currency: z.string(),
  obligation_outstanding_at_reservation: decimalStringSchema,
  obligation_version_at_reservation: z.number().int(),
  source_snapshot: recordSchema,
  beneficiary_snapshot: recordSchema,
  destination_configured: z.boolean().optional().default(false),
  destination_trust_id: nullableUuid.optional().default(null),
  destination_fingerprint: nullableString.optional().default(null),
  destination_bank_code: nullableString.optional().default(null),
  destination_bank_name: nullableString.optional().default(null),
  destination_account_number_last4: nullableString.optional().default(null),
  destination_account_name: nullableString.optional().default(null),
  destination_currency: nullableString.optional().default(null),
  destination_source: nullableString.optional().default(null),
  destination_verification_status: nullableString.optional().default(null),
  status: z.string(),
  created_at: z.string(),
  removed_at: nullableString.optional().default(null),
  removed_by_user_id: nullableUuid.optional().default(null),
});

export const paymentRunSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  run_number: z.string(),
  name: nullableString.optional().default(null),
  currency: z.string(),
  funding_bank_account_id: uuidSchema,
  funding_account_snapshot: recordSchema,
  scheduled_execution_date: nullableString.optional().default(null),
  status: z.string(),
  version: z.number().int(),
  version_hash: z.string(),
  submitted_material_hash: nullableString.optional().default(null),
  submitted_at: nullableString.optional().default(null),
  approval_request_id: nullableUuid.optional().default(null),
  approval_decided_at: nullableString.optional().default(null),
  approval_decided_by_user_id: nullableUuid.optional().default(null),
  cancelled_at: nullableString.optional().default(null),
  cancelled_by_user_id: nullableUuid.optional().default(null),
  cancellation_reason: nullableString.optional().default(null),
  exception_closed_at: nullableString.optional().default(null),
  exception_closed_by_user_id: nullableUuid.optional().default(null),
  exception_closure_reason: nullableString.optional().default(null),
  archived_at: nullableString.optional().default(null),
  archived_by_user_id: nullableUuid.optional().default(null),
  archive_reason: nullableString.optional().default(null),
  created_by_user_id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
  total_amount: decimalStringSchema,
  item_count: z.number().int(),
  branch_ids: z.array(uuidSchema),
  items: z.array(paymentRunItemSchema),
});

export const paymentRunListSchema = z.object({
  data: z.array(paymentRunSchema),
  next_cursor: nullableString.optional().default(null),
});

export const approvalVoteSchema = z.object({
  decided_by: uuidSchema,
  decision: z.string(),
  reason_code: nullableString.optional().default(null),
  comment: nullableString.optional().default(null),
  decided_at: z.string(),
  control_mode: nullableString.optional().default(null),
  segregation_override: z.boolean().optional().default(false),
});

export const approvalRequestSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  object_type: z.string(),
  object_id: uuidSchema,
  submitted_by: uuidSchema,
  policy_id: nullableUuid,
  reason: z.string(),
  object_version: recordSchema,
  status: z.string(),
  decision: nullableString,
  decided_by: nullableUuid,
  decided_at: nullableString,
  comment: nullableString,
  created_at: z.string(),
  submitted_at: nullableString,
  policy_key: nullableString.optional().default(null),
  policy_configuration_id: nullableUuid.optional().default(null),
  policy_configuration_version: z.number().int().nullable().optional().default(null),
  policy_snapshot: recordSchema.nullable().optional().default(null),
  policy_resolution_hash: nullableString.optional().default(null),
  required_approvals: z.number().int(),
  approval_votes: z.array(approvalVoteSchema).optional().default([]),
  decision_reason_code: nullableString.optional().default(null),
});

export const paymentInstructionAttemptSchema = z.object({
  id: uuidSchema,
  attempt_number: z.number().int(),
  method: z.string(),
  provider_key: nullableString.optional().default(null),
  external_reference: nullableString.optional().default(null),
  status: z.string(),
  failure_code: nullableString.optional().default(null),
  failure_reason: nullableString.optional().default(null),
  evidence: recordSchema,
  submitted_at: nullableString.optional().default(null),
  concluded_at: nullableString.optional().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentInstructionReconciliationSchema = z.object({
  id: uuidSchema,
  attempt_number: z.number().int(),
  prior_instruction_status: z.string(),
  outcome: z.string(),
  evidence_type: z.string(),
  external_reference: z.string(),
  evidence_at: z.string(),
  settlement_reference: nullableString.optional().default(null),
  settled_at: nullableString.optional().default(null),
  funding_bank_account_id: uuidSchema,
  evidence: recordSchema,
  finance_status: z.string(),
  financial_event_id: nullableUuid.optional().default(null),
  journal_entry_id: nullableUuid.optional().default(null),
  finance_failure_code: nullableString.optional().default(null),
  reconciled_by_user_id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentInstructionSchema = z.object({
  id: uuidSchema,
  payment_run_item_id: uuidSchema,
  payment_obligation_id: uuidSchema,
  branch_id: nullableUuid,
  amount: decimalStringSchema,
  currency: z.string(),
  beneficiary_snapshot: recordSchema,
  destination_fingerprint: z.string(),
  destination_trust_id: uuidSchema,
  destination_account_number_last4: z.string(),
  status: z.string(),
  current_attempt_number: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  attempts: z.array(paymentInstructionAttemptSchema),
  reconciliations: z.array(paymentInstructionReconciliationSchema),
});

export const paymentExecutionSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  payment_run_id: uuidSchema,
  execution_number: z.number().int(),
  method: z.string(),
  status: z.string(),
  provider_key: nullableString.optional().default(null),
  external_batch_reference: nullableString.optional().default(null),
  risk_context_hash: nullableString.optional().default(null),
  risk_snapshot: recordSchema,
  step_up_grant_id: nullableUuid.optional().default(null),
  evidence: recordSchema,
  prepared_by_user_id: uuidSchema,
  prepared_at: z.string(),
  started_at: nullableString.optional().default(null),
  completed_at: nullableString.optional().default(null),
  created_at: z.string(),
  updated_at: z.string(),
  instructions: z.array(paymentInstructionSchema),
});

export const paymentOutcomeSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  branch_id: nullableUuid,
  payment_instruction_id: uuidSchema,
  payment_execution_id: uuidSchema,
  payment_run_id: uuidSchema,
  payment_run_item_id: uuidSchema,
  payment_obligation_id: uuidSchema,
  source_type: z.string(),
  source_id: uuidSchema,
  obligation_type: z.string(),
  counterparty_type: z.string(),
  counterparty_id: nullableUuid,
  execution_method: z.string(),
  outcome_type: z.string(),
  status: z.string(),
  amount: decimalStringSchema,
  currency: z.string(),
  settlement_reference: nullableString,
  outcome_at: z.string(),
  source_event_id: uuidSchema,
  financial_event_id: uuidSchema,
  journal_entry_id: uuidSchema,
  source_state: recordSchema.nullable(),
  attempt_count: z.number().int(),
  next_attempt_at: nullableString,
  last_error_code: nullableString,
  last_error_reason: nullableString,
  propagated_at: nullableString,
  quarantined_at: nullableString,
  quarantine_evidence_at: nullableString,
  quarantine_evidence_attempt_count: z.number().int(),
  quarantine_evidence_next_attempt_at: nullableString,
  quarantine_evidence_last_error: nullableString,
  quarantine_evidence_abandoned_at: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentRunItemDetailSchema = z.object({
  payment_run_id: uuidSchema,
  run_number: z.string(),
  item: paymentRunItemSchema,
  obligation: paymentObligationSchema,
  reservation_id: nullableUuid.optional().default(null),
  reservation_status: nullableString.optional().default(null),
  instruction: paymentInstructionSchema.nullable().optional().default(null),
  outcomes: z.array(paymentOutcomeSchema).optional().default([]),
});

export const paymentOperationsMetricSchema = z.object({
  count: z.number().int(),
  amount: decimalStringSchema.nullable().optional().default(null),
  currency: nullableString.optional().default(null),
});

export const paymentOperationsSummarySchema = z.object({
  organization_id: uuidSchema,
  branch_id: nullableUuid,
  currency: z.string(),
  as_of: z.string(),
  open_obligations: paymentOperationsMetricSchema,
  held_obligations: paymentOperationsMetricSchema,
  due_this_week: paymentOperationsMetricSchema,
  awaiting_approval: paymentOperationsMetricSchema,
  approved_awaiting_execution: paymentOperationsMetricSchema,
  in_flight: paymentOperationsMetricSchema,
  clearing: z.object({
    available: z.boolean(),
    balance: decimalStringSchema.nullable().optional().default(null),
    side: nullableString.optional().default(null),
    currency: nullableString.optional().default(null),
    account_id: nullableUuid.optional().default(null),
    reason_code: nullableString.optional().default(null),
  }),
  outcome_unknown: paymentOperationsMetricSchema,
  failed_instructions: paymentOperationsMetricSchema,
  unreconciled: paymentOperationsMetricSchema,
  upcoming_runs: paymentOperationsMetricSchema,
});

export const executionQueueItemSchema = z.object({
  execution_id: uuidSchema,
  payment_run_id: uuidSchema,
  run_number: z.string(),
  run_status: z.string(),
  method: z.string(),
  execution_status: z.string(),
  currency: z.string(),
  total_amount: decimalStringSchema,
  instruction_count: z.number().int(),
  in_flight_count: z.number().int(),
  outcome_unknown_count: z.number().int(),
  failed_count: z.number().int(),
  settled_count: z.number().int(),
  updated_at: z.string(),
});

export const executionQueueSchema = z.object({
  data: z.array(executionQueueItemSchema),
});

export const reconciliationQueueItemSchema = z.object({
  payment_instruction_id: uuidSchema,
  payment_execution_id: uuidSchema,
  payment_run_id: uuidSchema,
  run_number: z.string(),
  branch_id: nullableUuid,
  instruction_status: z.string(),
  amount: decimalStringSchema,
  currency: z.string(),
  current_attempt_number: z.number().int(),
  attention_state: z.string(),
  last_reconciliation: paymentInstructionReconciliationSchema
    .nullable()
    .optional()
    .default(null),
  updated_at: z.string(),
});

export const reconciliationQueueSchema = z.object({
  data: z.array(reconciliationQueueItemSchema),
});

export const paymentRunOperationsSchema = z.object({
  run: paymentRunSchema,
  approval: approvalRequestSchema.nullable().optional().default(null),
  approval_history: z.array(approvalRequestSchema),
  execution: paymentExecutionSchema.nullable().optional().default(null),
  generation_source: z
    .object({
      template_id: uuidSchema,
      occurrence_at: z.string(),
      planned_execution_date: z.string(),
      template_version: z.number().int(),
      generated_at: z.string(),
    })
    .nullable()
    .optional()
    .default(null),
});

export const paymentRunPreviewSchema = z.object({
  currency: z.string(),
  total_amount: decimalStringSchema,
  item_count: z.number().int(),
  branch_ids: z.array(uuidSchema),
  funding_account_valid: z.boolean(),
  items: z.array(
    z.object({
      payment_obligation_id: uuidSchema,
      branch_id: nullableUuid,
      requested_amount: decimalStringSchema,
      available_amount: decimalStringSchema,
      eligible: z.boolean(),
      beneficiary_ready: z.boolean(),
      warnings: z.array(z.string()),
    }),
  ),
  approval_path: z.object({
    required: z.boolean(),
    policy_id: nullableUuid,
    required_role: nullableString,
    required_approvals: z.number().int().nullable(),
    control_mode: nullableString,
    threshold: decimalStringSchema.nullable(),
  }),
  warnings: z.array(z.string()),
});

export const paymentRunTemplateSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  name: z.string(),
  cadence: z.enum(["WEEKLY", "MONTHLY"]),
  generation_rule: z.object({
    timezone: nullableString,
    hour: z.number().int(),
    minute: z.number().int(),
    weekday: z.number().int().nullable(),
    day_of_month: z.number().int().nullable(),
  }),
  planned_execution_rule: z.object({
    offset_days: z.number().int(),
  }),
  funding_bank_account_id: uuidSchema,
  currency: z.string(),
  source_filters: z.object({
    obligation_types: z.array(z.string()),
    source_types: z.array(z.string()),
    branch_id: nullableUuid,
    due_on_or_before_execution: z.boolean(),
    include_undated: z.boolean(),
    max_items: z.number().int(),
  }),
  approval_policy_id: nullableUuid,
  active: z.boolean(),
  version: z.number().int(),
  next_generation_at: z.string(),
  suspended_at: nullableString,
  suspended_by_user_id: nullableUuid,
  created_by_user_id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const paymentRunTemplateListSchema = z.object({
  data: z.array(paymentRunTemplateSchema),
});

export const workflowStepSchema = z.object({
  key: z.string(),
  type: z.enum(["NOOP", "HUMAN_TASK", "APPROVAL", "ACTION"]),
  title: nullableString.optional().default(null),
  assigned_role: nullableString.optional().default(null),
  assigned_user_id: nullableUuid.optional().default(null),
  approval_request_id_input: nullableString.optional().default(null),
  action_key: nullableString.optional().default(null),
  action_config: recordSchema.optional().default({}),
  max_attempts: z.number().int().optional().default(5),
});

export const workflowDefinitionSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  workflow_key: z.string(),
  domain: z.string(),
  workflow_type: nullableString,
  name: z.string(),
  description: nullableString,
  source_template_key: nullableString.optional().default(null),
  source_template_version: z.number().int().nullable().optional().default(null),
  created_at: z.string(),
});

export const workflowVersionSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  workflow_definition_id: uuidSchema,
  version: z.number().int(),
  status: z.string(),
  steps: z.array(recordSchema),
  published_at: nullableString,
  created_at: z.string(),
});

export const workflowTriggerSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  workflow_definition_id: uuidSchema,
  trigger_key: z.string(),
  event_type: z.string(),
  event_schema_version: z.number().int(),
  status: z.enum(["ACTIVE", "DISABLED"]),
  scope: z.enum(["ORGANIZATION", "BRANCH"]),
  branch_id: nullableUuid,
  active_since: z.string(),
  conditions: z.array(recordSchema),
  input_mapping: z.record(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const workflowDeliverySchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  workflow_trigger_id: uuidSchema,
  workflow_definition_id: uuidSchema,
  workflow_version_id: uuidSchema,
  domain_event_id: uuidSchema,
  event_type: z.string(),
  branch_id: nullableUuid,
  event_snapshot: recordSchema,
  trigger_snapshot: recordSchema,
  status: z.string(),
  condition_result: recordSchema.nullable(),
  workflow_run_id: nullableUuid,
  attempt_count: z.number().int(),
  next_attempt_at: nullableString,
  last_error_code: nullableString,
  last_error_reason: nullableString,
  processed_at: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});

export const workflowDefinitionDetailSchema = z.object({
  definition: workflowDefinitionSchema,
  versions: z.array(workflowVersionSchema),
  triggers: z.array(workflowTriggerSchema),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type PaymentObligation = z.infer<typeof paymentObligationSchema>;
export type PaymentRun = z.infer<typeof paymentRunSchema>;
export type PaymentRunItem = z.infer<typeof paymentRunItemSchema>;
export type PaymentRunItemDetail = z.infer<typeof paymentRunItemDetailSchema>;
export type PaymentOperationsSummary = z.infer<typeof paymentOperationsSummarySchema>;
export type PaymentExecution = z.infer<typeof paymentExecutionSchema>;
export type PaymentInstruction = z.infer<typeof paymentInstructionSchema>;
export type PaymentRunPreview = z.infer<typeof paymentRunPreviewSchema>;
export type PaymentRunTemplate = z.infer<typeof paymentRunTemplateSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;
export type WorkflowDelivery = z.infer<typeof workflowDeliverySchema>;
