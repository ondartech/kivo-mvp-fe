import { z } from "zod";

export const taxFamilySchema = z.enum([
  "VAT",
  "WHT",
  "LEVY",
  "DUTY",
  "OTHER_STATUTORY",
]);

export const taxTreatmentSchema = z.enum([
  "TAXABLE",
  "ZERO_RATED",
  "EXEMPT",
  "OUT_OF_SCOPE",
]);

export const taxRecognitionRuleSchema = z.enum([
  "ON_DOCUMENT",
  "ON_PAYMENT_OR_SETTLEMENT",
  "EARLIER_OF_PAYMENT_OR_LIABILITY_RECOGNITION",
  "EARLIER_OF_PAYMENT_OR_INCOME_CREDIT",
  "NIGERIA_WHT_CONTEXTUAL",
]);

export const taxAccountingRoleSchema = z.enum([
  "OUTPUT_TAX",
  "INPUT_TAX",
  "WITHHOLDING_PAYABLE",
  "WITHHOLDING_RECEIVABLE",
  "TAX_PAYABLE",
  "TAX_RECEIVABLE",
]);

const decimalRateStringSchema = z
  .string()
  .trim()
  .regex(
    /^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/,
    "Use a decimal rate between 0 and 1, for example 0.075000 for 7.5%.",
  );

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.");

const optionalIsoDateSchema = isoDateSchema.nullable().optional();

export const taxCodeVersionSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    tax_code_id: z.string().uuid(),
    version: z.number().int().positive(),
    rate: z.string(),
    treatment: taxTreatmentSchema,
    recognition_rule: taxRecognitionRuleSchema,
    calculation_method: z.literal("PERCENT_OF_TAXABLE_BASE"),
    effective_from: isoDateSchema,
    effective_to: isoDateSchema.nullable(),
    authority_reference: z.string().nullable(),
    created_by_user_id: z.string().uuid().nullable(),
    created_at: z.string(),
  })
  .strict();

export const taxCodeSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    family: taxFamilySchema,
    jurisdiction_country: z.string().length(2),
    status: z.enum(["ACTIVE", "ARCHIVED"]),
    created_at: z.string(),
    updated_at: z.string(),
    current_version: taxCodeVersionSchema.nullable(),
  })
  .strict();

export const taxAccountMappingSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    tax_code_id: z.string().uuid(),
    accounting_role: taxAccountingRoleSchema,
    account_id: z.string().uuid(),
    effective_from: isoDateSchema,
    effective_to: isoDateSchema.nullable(),
    change_reason: z.string(),
    created_by_user_id: z.string().uuid().nullable(),
    created_at: z.string(),
  })
  .strict();

export const taxCodeDetailSchema = taxCodeSchema
  .extend({
    versions: z.array(taxCodeVersionSchema),
    account_mappings: z.array(taxAccountMappingSchema),
  })
  .strict();

export const taxCodeListSchema = z
  .object({
    data: z.array(taxCodeSchema),
  })
  .strict();

export const taxFilingDeadlineRuleSchema = z.enum([
  "UNSPECIFIED",
  "DAY_OF_MONTH_AFTER_PERIOD",
  "MONTHS_AFTER_PERIOD_END",
]);

export const taxRegistrationSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    authority_code: z.string(),
    registration_type: z.string(),
    registration_number: z.string().nullable(),
    remittance_frequency: z.enum([
      "MONTHLY",
      "QUARTERLY",
      "ANNUAL",
      "ON_DEMAND",
    ]),
    filing_deadline_rule: taxFilingDeadlineRuleSchema,
    filing_due_day: z.number().int().min(1).max(31).nullable(),
    filing_due_month_offset: z.number().int().min(0).max(24).nullable(),
    period_end_month: z.number().int().min(1).max(12),
    deadline_authority_reference: z.string().nullable(),
    effective_from: isoDateSchema,
    effective_to: isoDateSchema.nullable(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    created_at: z.string(),
  })
  .strict();

export const taxRegistrationListSchema = z
  .object({
    data: z.array(taxRegistrationSchema),
  })
  .strict();

export const taxComplianceCalendarItemSchema = z
  .object({
    registration_id: z.string().uuid(),
    authority_code: z.string(),
    registration_type: z.string(),
    registration_number: z.string().nullable(),
    remittance_frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
    period_start: isoDateSchema,
    period_end: isoDateSchema,
    due_date: isoDateSchema,
    deadline_state: z.enum(["UPCOMING", "DUE_TODAY", "PAST_DUE"]),
    completion_state: z.literal("UNTRACKED"),
    filing_deadline_rule: taxFilingDeadlineRuleSchema,
    deadline_authority_reference: z.string(),
  })
  .strict();

export const taxComplianceCalendarGapSchema = z
  .object({
    registration_id: z.string().uuid(),
    authority_code: z.string(),
    registration_type: z.string(),
    registration_number: z.string().nullable(),
    remittance_frequency: z.enum([
      "MONTHLY",
      "QUARTERLY",
      "ANNUAL",
      "ON_DEMAND",
    ]),
    reason: z.enum(["ON_DEMAND", "DEADLINE_RULE_MISSING"]),
  })
  .strict();

export const taxComplianceCalendarSchema = z
  .object({
    organization_id: z.string().uuid(),
    from_date: isoDateSchema,
    to_date: isoDateSchema,
    as_of_date: isoDateSchema,
    generated_at: z.string(),
    item_count: z.number().int().nonnegative(),
    items: z.array(taxComplianceCalendarItemSchema),
    gaps: z.array(taxComplianceCalendarGapSchema),
    coverage: z
      .object({
        schedule_coverage: z.enum(["COMPLETE", "INCOMPLETE"]),
        recurring_registration_count: z.number().int().nonnegative(),
        scheduled_registration_count: z.number().int().nonnegative(),
        unscheduled_registration_count: z.number().int().nonnegative(),
        completion_tracking: z.literal("NOT_IMPLEMENTED"),
        warning_codes: z.array(z.string()),
        warnings: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export const taxCodeVersionInputSchema = z
  .object({
    rate: decimalRateStringSchema,
    treatment: taxTreatmentSchema,
    recognition_rule: taxRecognitionRuleSchema,
    effective_from: isoDateSchema,
    effective_to: optionalIsoDateSchema,
    authority_reference: z.string().trim().max(4000).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.effective_to &&
      value.effective_to.localeCompare(value.effective_from) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effective_to"],
        message: "End date cannot precede the effective date.",
      });
    }
    if (
      ["ZERO_RATED", "EXEMPT", "OUT_OF_SCOPE"].includes(value.treatment) &&
      !/^0(?:\.0{1,6})?$/.test(value.rate)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rate"],
        message: value.treatment + " requires a zero rate.",
      });
    }
  });

export const taxCodeCreateInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
    name: z.string().trim().min(2).max(160),
    family: taxFamilySchema,
    jurisdiction_country: z.literal("NG"),
    initial_version: taxCodeVersionInputSchema,
  })
  .strict();

export const taxAccountMappingInputSchema = z
  .object({
    accounting_role: taxAccountingRoleSchema,
    account_id: z.string().uuid("Choose a Finance account."),
    effective_from: isoDateSchema,
    effective_to: optionalIsoDateSchema,
    reason: z.string().trim().min(8).max(2000),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.effective_to &&
      value.effective_to.localeCompare(value.effective_from) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effective_to"],
        message: "End date cannot precede the effective date.",
      });
    }
  });

export const taxRegistrationInputSchema = z
  .object({
    authority_code: z.string().trim().min(2).max(32),
    registration_type: z.string().trim().min(2).max(48),
    registration_number: z.string().trim().max(128).nullable().optional(),
    remittance_frequency: z.enum([
      "MONTHLY",
      "QUARTERLY",
      "ANNUAL",
      "ON_DEMAND",
    ]),
    filing_deadline_rule: taxFilingDeadlineRuleSchema.default("UNSPECIFIED"),
    filing_due_day: z.number().int().min(1).max(31).nullable().default(null),
    filing_due_month_offset: z
      .number()
      .int()
      .min(1)
      .max(24)
      .nullable()
      .default(null),
    period_end_month: z.number().int().min(1).max(12).default(12),
    deadline_authority_reference: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .default(null),
    effective_from: isoDateSchema,
    effective_to: optionalIsoDateSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.effective_to &&
      value.effective_to.localeCompare(value.effective_from) < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effective_to"],
        message: "End date cannot precede the effective date.",
      });
    }

    if (value.remittance_frequency === "ON_DEMAND") {
      if (value.filing_deadline_rule !== "UNSPECIFIED") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filing_deadline_rule"],
          message: "On-demand registrations do not have recurring deadlines.",
        });
      }
      return;
    }

    if (value.filing_deadline_rule === "UNSPECIFIED") {
      if (
        value.filing_due_day !== null ||
        value.filing_due_month_offset !== null ||
        value.deadline_authority_reference !== null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filing_deadline_rule"],
          message: "Choose a deadline rule before entering deadline parameters.",
        });
      }
      return;
    }

    if (!value.deadline_authority_reference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline_authority_reference"],
        message: "Record the statutory or policy authority for this deadline.",
      });
    }

    if (value.filing_deadline_rule === "DAY_OF_MONTH_AFTER_PERIOD") {
      if (value.filing_due_day === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filing_due_day"],
          message: "Enter the filing day of month.",
        });
      }
      if (value.filing_due_month_offset === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filing_due_month_offset"],
          message: "Enter the month offset after the tax period.",
        });
      }
      return;
    }

    if (value.filing_due_day !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["filing_due_day"],
        message: "Months-after-period rules preserve the period-end day.",
      });
    }
    if (
      value.filing_due_month_offset === null ||
      value.filing_due_month_offset < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["filing_due_month_offset"],
        message: "Enter at least one month after the tax period.",
      });
    }
  });


const nonNegativeDecimalStringSchema = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/, "Expected an exact non-negative decimal string.");

export const taxReserveBankAccountSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    bank_code: z.string(),
    bank_name: z.string(),
    account_number_masked: z.string(),
    account_number_last4: z.string(),
    account_name: z.string(),
    currency: z.string().length(3),
    verification_status: z.string(),
    verification_match_type: z.string().nullable(),
    verified_at: z.string().nullable(),
    is_default: z.boolean(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .strict();

export const taxReserveDestinationSchema = z
  .object({
    bank_account_id: z.string().uuid(),
    bank_name: z.string(),
    account_name: z.string(),
    account_number_last4: z.string(),
    currency: z.string().length(3),
    verification_status: z.string(),
  })
  .strict();

export const taxReservePolicyStatusSchema = z.enum(["ACTIVE", "PAUSED"]);

export const taxReservePolicySchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    status: taxReservePolicyStatusSchema,
    reserve_basis: z.literal("GROSS_POSITIVE_LIABILITY"),
    destination: taxReserveDestinationSchema,
    created_by_user_id: z.string().uuid().nullable(),
    updated_by_user_id: z.string().uuid().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .strict();

export const taxReservePolicyInputSchema = z
  .object({
    destination_bank_account_id: z.string().uuid("Choose a bank account."),
    status: taxReservePolicyStatusSchema,
  })
  .strict();

export const taxReserveInstructionSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    policy_id: z.string().uuid(),
    status: z.enum(["PENDING_EXTERNAL_EXECUTION", "SUPERSEDED"]),
    reserve_basis: z.literal("GROSS_POSITIVE_LIABILITY"),
    execution_semantics: z.literal("ENSURE_MINIMUM_BALANCE"),
    execution_authority: z.literal("EXTERNAL_TREASURY_REQUIRED"),
    releases_authorized: z.literal(false),
    as_of_date: isoDateSchema,
    position_from_date: isoDateSchema,
    position_to_date: isoDateSchema,
    target_reserve_balance: nonNegativeDecimalStringSchema,
    currency: z.string().length(3),
    destination_bank_account_id: z.string().uuid(),
    calculation_hash: z.string().min(1),
    event_id: z.string().uuid(),
    superseded_at: z.string().nullable(),
    superseded_by_instruction_id: z.string().uuid().nullable(),
    created_by_user_id: z.string().uuid().nullable(),
    created_at: z.string(),
  })
  .strict();

export const taxReserveCoverageSchema = z
  .object({
    ledger_authority: z.literal("POSTED_GENERAL_LEDGER"),
    finance_cutover_date: isoDateSchema,
    posting_coverage: z.enum(["COMPLETE", "INCOMPLETE"]),
    unposted_tax_event_count: z.number().int().nonnegative(),
    accepted_tax_event_count: z.number().int().nonnegative(),
    posting_tax_event_count: z.number().int().nonnegative(),
    posting_failed_tax_event_count: z.number().int().nonnegative(),
    unattributed_mapped_account_line_count: z.number().int().nonnegative(),
    remittance_coverage: z.literal("NOT_IMPLEMENTED"),
    warning_codes: z.array(z.string()),
    warnings: z.array(z.string()),
  })
  .strict();

export const taxReservePositionSchema = z
  .object({
    organization_id: z.string().uuid(),
    base_currency: z.string().length(3),
    as_of_date: isoDateSchema,
    reserve_basis: z.literal("GROSS_POSITIVE_LIABILITY"),
    target_reserve_balance: nonNegativeDecimalStringSchema,
    policy: taxReservePolicySchema,
    calculation_hash: z.string().min(1),
    latest_instruction: taxReserveInstructionSchema.nullable(),
    instruction_current: z.boolean(),
    execution_semantics: z.literal("ENSURE_MINIMUM_BALANCE"),
    execution_authority: z.literal("EXTERNAL_TREASURY_REQUIRED"),
    releases_authorized: z.literal(false),
    coverage: taxReserveCoverageSchema,
  })
  .strict();

export type TaxReserveBankAccount = z.infer<typeof taxReserveBankAccountSchema>;
export type TaxReservePolicy = z.infer<typeof taxReservePolicySchema>;
export type TaxReservePolicyStatus = z.infer<typeof taxReservePolicyStatusSchema>;
export type TaxReservePolicyInput = z.infer<typeof taxReservePolicyInputSchema>;
export type TaxReserveInstruction = z.infer<typeof taxReserveInstructionSchema>;
export type TaxReservePosition = z.infer<typeof taxReservePositionSchema>;

export function isTaxReserveEligibleBankAccount(
  account: TaxReserveBankAccount,
): boolean {
  return account.status === "ACTIVE" && account.verification_status === "VERIFIED";
}

export type TaxFamily = z.infer<typeof taxFamilySchema>;
export type TaxTreatment = z.infer<typeof taxTreatmentSchema>;
export type TaxRecognitionRule = z.infer<typeof taxRecognitionRuleSchema>;
export type TaxAccountingRole = z.infer<typeof taxAccountingRoleSchema>;
export type TaxCode = z.infer<typeof taxCodeSchema>;
export type TaxCodeDetail = z.infer<typeof taxCodeDetailSchema>;
export type TaxCodeVersion = z.infer<typeof taxCodeVersionSchema>;
export type TaxAccountMapping = z.infer<typeof taxAccountMappingSchema>;
export type TaxRegistration = z.infer<typeof taxRegistrationSchema>;
export type TaxComplianceCalendar = z.infer<typeof taxComplianceCalendarSchema>;
export type TaxFilingDeadlineRule = z.infer<typeof taxFilingDeadlineRuleSchema>;
export type TaxCodeCreateInput = z.infer<typeof taxCodeCreateInputSchema>;
export type TaxCodeVersionInput = z.infer<typeof taxCodeVersionInputSchema>;
export type TaxAccountMappingInput = z.infer<
  typeof taxAccountMappingInputSchema
>;
export type TaxRegistrationInput = z.infer<
  typeof taxRegistrationInputSchema
>;

export function taxRolesForFamily(family: TaxFamily): TaxAccountingRole[] {
  if (family === "VAT") return ["OUTPUT_TAX", "INPUT_TAX"];
  if (family === "WHT") {
    return ["WITHHOLDING_PAYABLE", "WITHHOLDING_RECEIVABLE"];
  }
  return ["TAX_PAYABLE", "TAX_RECEIVABLE"];
}

export function financeAccountClassForTaxRole(
  role: TaxAccountingRole,
): "ASSET" | "LIABILITY" {
  return ["INPUT_TAX", "WITHHOLDING_RECEIVABLE", "TAX_RECEIVABLE"].includes(
    role,
  )
    ? "ASSET"
    : "LIABILITY";
}

export function defaultRecognitionRuleForFamily(
  family: TaxFamily,
): TaxRecognitionRule {
  return family === "WHT" ? "NIGERIA_WHT_CONTEXTUAL" : "ON_DOCUMENT";
}

export function humanizeTaxValue(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
