export type PaymentObligationStatus =
  | "OPEN"
  | "PARTIALLY_SETTLED"
  | "SETTLED"
  | "CANCELLED"
  | "VOIDED";

export type PaymentRunStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "READY"
  | "EXECUTING"
  | "PARTIALLY_SETTLED"
  | "SETTLED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED";

export type PaymentInstructionStatus =
  | "CREATED"
  | "SUBMITTED"
  | "DISPATCHED"
  | "ACCEPTED"
  | "IN_TRANSIT"
  | "SETTLED"
  | "FAILED"
  | "REJECTED"
  | "OUTCOME_UNKNOWN"
  | "CANCELLED";

export type PaymentObligation = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  obligation_type: string;
  source_type: string;
  source_id: string;
  counterparty_type: string;
  counterparty_id: string | null;
  currency: string;
  original_amount: string;
  outstanding_amount: string;
  due_date: string | null;
  earliest_payment_date: string | null;
  status: PaymentObligationStatus;
  control_status: "AVAILABLE" | "HELD";
  hold_reason: string | null;
  source_snapshot: Record<string, unknown>;
  beneficiary_snapshot: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
};

export type PaymentRunItem = {
  id: string;
  payment_obligation_id: string;
  branch_id: string | null;
  allocated_amount: string;
  currency: string;
  obligation_outstanding_at_reservation: string;
  obligation_version_at_reservation: number;
  source_snapshot: Record<string, unknown>;
  beneficiary_snapshot: Record<string, unknown>;
  status: string;
  created_at: string;
  destination_configured: boolean;
  destination_trust_id: string | null;
  destination_fingerprint: string | null;
  destination_bank_code: string | null;
  destination_bank_name: string | null;
  destination_account_number_last4: string | null;
  destination_account_name: string | null;
  destination_currency: string | null;
  destination_source: string | null;
  destination_verification_status: string | null;
};

export type PaymentRun = {
  id: string;
  organization_id: string;
  run_number: string;
  name: string | null;
  currency: string;
  funding_bank_account_id: string;
  funding_account_snapshot: Record<string, unknown>;
  scheduled_execution_date: string | null;
  status: PaymentRunStatus;
  version: number;
  version_hash: string;
  submitted_material_hash: string | null;
  submitted_at: string | null;
  approval_request_id: string | null;
  approval_decided_at: string | null;
  approval_decided_by_user_id: string | null;
  cancelled_at: string | null;
  cancelled_by_user_id: string | null;
  cancellation_reason: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  total_amount: string;
  item_count: number;
  branch_ids: string[];
  items: PaymentRunItem[];
};

export type ApprovalVote = {
  decided_by: string;
  decision: "APPROVE" | "REJECT";
  control_mode: "STRICT_DUAL_CONTROL" | "SINGLE_OPERATOR_CONTROL" | null;
  segregation_override: boolean;
  reason_code: string | null;
  comment: string | null;
  decided_at: string;
};

export type ApprovalRequest = {
  id: string;
  organization_id: string;
  object_type: string;
  object_id: string;
  submitted_by: string;
  policy_id: string | null;
  policy_key: string | null;
  policy_configuration_id: string | null;
  policy_configuration_version: number | null;
  policy_snapshot: Record<string, unknown> | null;
  policy_resolution_hash: string | null;
  reason: string;
  object_version: Record<string, unknown>;
  required_approvals: number;
  approval_votes: ApprovalVote[];
  decision_reason_code: string | null;
  status: string;
  decision: "APPROVE" | "REJECT" | null;
  decided_by: string | null;
  decided_at: string | null;
  comment: string | null;
  created_at: string;
  submitted_at: string | null;
};

export type PaymentInstructionReconciliation = {
  id: string;
  attempt_number: number;
  prior_instruction_status: string;
  outcome: "IN_TRANSIT" | "SETTLED" | "NOT_SETTLED";
  evidence_type: string;
  external_reference: string;
  evidence_at: string;
  settlement_reference: string | null;
  settled_at: string | null;
  funding_bank_account_id: string;
  evidence: Record<string, unknown>;
  finance_status: "NOT_REQUIRED" | "PENDING" | "POSTED" | "POSTING_FAILED";
  financial_event_id: string | null;
  journal_entry_id: string | null;
  finance_failure_code: string | null;
  reconciled_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type PaymentInstruction = {
  id: string;
  payment_run_item_id: string;
  payment_obligation_id: string;
  branch_id: string | null;
  amount: string;
  currency: string;
  beneficiary_snapshot: Record<string, unknown>;
  destination_fingerprint: string;
  destination_trust_id: string;
  destination_account_number_last4: string;
  status: PaymentInstructionStatus;
  current_attempt_number: number;
  created_at: string;
  updated_at: string;
  attempts: Array<{
    id: string;
    attempt_number: number;
    method: string;
    provider_key: string | null;
    external_reference: string | null;
    status: string;
    failure_code: string | null;
    failure_reason: string | null;
    evidence: Record<string, unknown>;
    submitted_at: string | null;
    concluded_at: string | null;
    created_at: string;
    updated_at: string;
  }>;
  reconciliations: PaymentInstructionReconciliation[];
};

export type PaymentExecution = {
  id: string;
  organization_id: string;
  payment_run_id: string;
  execution_number: number;
  method: "MANUAL" | "CSV_EXPORT" | "BANK_FILE_EXPORT";
  status: "PREPARED" | "EXECUTING" | "PARTIAL" | "COMPLETED" | "FAILED" | "CANCELLED";
  provider_key: string | null;
  external_batch_reference: string | null;
  risk_context_hash: string | null;
  risk_snapshot: Record<string, unknown>;
  step_up_grant_id: string | null;
  evidence: Record<string, unknown>;
  prepared_by_user_id: string;
  prepared_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  instructions: PaymentInstruction[];
};

export type PaymentOperationsMetric = {
  count: number;
  amount: string | null;
  currency: string | null;
};

export type PaymentOperationsSummary = {
  organization_id: string;
  branch_id: string | null;
  currency: string;
  as_of: string;
  open_obligations: PaymentOperationsMetric;
  held_obligations: PaymentOperationsMetric;
  due_this_week: PaymentOperationsMetric;
  awaiting_approval: PaymentOperationsMetric;
  approved_awaiting_execution: PaymentOperationsMetric;
  in_flight: PaymentOperationsMetric;
  clearing: {
    available: boolean;
    balance: string | null;
    side: string | null;
    currency: string | null;
    account_id: string | null;
    reason_code: string | null;
  };
  outcome_unknown: PaymentOperationsMetric;
  failed_instructions: PaymentOperationsMetric;
  unreconciled: PaymentOperationsMetric;
  upcoming_runs: PaymentOperationsMetric;
};

export type PaymentRunOperations = {
  run: PaymentRun;
  approval: ApprovalRequest | null;
  approval_history: ApprovalRequest[];
  execution: PaymentExecution | null;
  generation_source: {
    template_id: string;
    occurrence_at: string;
    planned_execution_date: string;
    template_version: number;
    generated_at: string;
  } | null;
};

export type PaymentExecutionQueueItem = {
  execution_id: string;
  payment_run_id: string;
  run_number: string;
  run_status: string;
  method: string;
  execution_status: string;
  currency: string;
  total_amount: string;
  instruction_count: number;
  in_flight_count: number;
  outcome_unknown_count: number;
  failed_count: number;
  settled_count: number;
  updated_at: string;
};

export type PaymentReconciliationQueueItem = {
  payment_instruction_id: string;
  payment_execution_id: string;
  payment_run_id: string;
  run_number: string;
  branch_id: string | null;
  instruction_status: string;
  amount: string;
  currency: string;
  current_attempt_number: number;
  attention_state: string;
  last_reconciliation: PaymentInstructionReconciliation | null;
  updated_at: string;
};

export type PaymentRunTemplate = {
  id: string;
  organization_id: string;
  name: string;
  cadence: "WEEKLY" | "MONTHLY";
  generation_rule: {
    timezone: string | null;
    hour: number;
    minute: number;
    weekday: number | null;
    day_of_month: number | null;
  };
  planned_execution_rule: { offset_days: number };
  funding_bank_account_id: string;
  currency: string;
  source_filters: {
    obligation_types: string[];
    source_types: string[];
    branch_id: string | null;
    due_on_or_before_execution: boolean;
    include_undated: boolean;
    max_items: number;
  };
  approval_policy_id: string | null;
  active: boolean;
  version: number;
  next_generation_at: string;
  suspended_at: string | null;
  suspended_by_user_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type BankAccount = {
  id: string;
  organization_id: string;
  bank_code: string;
  bank_name: string;
  account_number_masked: string;
  account_number_last4: string;
  account_name: string;
  currency: string;
  verification_status: string;
  verification_match_type: string | null;
  verified_at: string | null;
  is_default: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PaymentSafetyControl = {
  id: string;
  capability: string;
  scope: "ORGANIZATION" | "BRANCH";
  scope_key: string;
  organization_id: string;
  branch_id: string | null;
  mode: "ENABLED" | "RESTRICTED" | "MANUAL_ONLY" | "APPROVAL_REQUIRED" | "HOLD" | "DISABLED";
  reason: string;
  source: string;
  effective_from: string;
  expires_at: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantEmergencyPosture = {
  organization_id: string;
  financial_frozen: boolean;
  external_actions_frozen: boolean;
  read_only: boolean;
  quarantined: boolean;
  active_controls: string[];
  controls: unknown[];
};

export type ApprovalPolicy = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  object_type: string;
  trigger: string;
  threshold: string;
  required_role: string;
  required_approvals: number;
  control_mode: "STRICT_DUAL_CONTROL" | "SINGLE_OPERATOR_CONTROL";
  approver_user_id: string | null;
  active: boolean;
  policy_configuration_id: string | null;
  policy_configuration_version: number | null;
  created_at: string;
  updated_at: string | null;
};
