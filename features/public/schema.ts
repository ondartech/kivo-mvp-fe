import { z } from "zod";

export const publicInvoiceLineSchema = z.object({
  description: z.string(),
  quantity: z.string(),
  unit_price: z.string(),
  line_total: z.string(),
});

export const publicInvoiceSchema = z.object({
  invoice_number: z.string(),
  seller: z.record(z.unknown()),
  buyer: z.record(z.unknown()),
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string(),
  line_items: z.array(publicInvoiceLineSchema),
  subtotal: z.string(),
  discount_total: z.string(),
  tax_total: z.string(),
  charge_total: z.string(),
  grand_total: z.string(),
  payment_state: z.string(),
  collection_state: z.string().nullable().optional(),
  payment_cta_label: z.string().nullable().optional(),
  payment_url: z.string().nullable().optional(),
  outstanding: z.string(),
  amount_paid: z.string().nullable().optional(),
  cash_applied: z.string().optional(),
  withholding_applied: z.string().optional(),
  other_noncash_applied: z.string().optional(),
  amount_due: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  created_at: z.string(),
});

// IPACK-UI-002: public projections never contain PSP credentials or bank accounts.
export const publicPspOptionSchema = z.object({
  provider_key: z.string().min(1),
  provider_name: z.string().min(1),
  connection_id: z.string().min(1),
  is_preferred: z.boolean(),
  readiness: z.string(),
  checkout_enabled: z.boolean(),
});

export const publicInvoicePaymentOptionsSchema = z.object({
  invoice_number: z.string(),
  currency: z.string().length(3),
  checkout_enabled: z.boolean(),
  options: z.array(publicPspOptionSchema),
});

export const publicInvoicePaymentSessionSchema = z.object({
  state: z.string(),
  version: z.number().int().min(0),
  selected_provider: z.string().nullable(),
  selected_connection_id: z.string().nullable(),
  checkout_enabled: z.boolean(),
  fee_quote_available: z.boolean(),
});

export const publicInvoiceFeePreviewSchema = z.object({
  choice_version: z.number().int().positive(),
  provider_key: z.string(),
  connection_id: z.string(),
  currency: z.string().length(3),
  invoice_amount: z.string(),
  provider_fee: z.string(),
  ondar_fee: z.string(),
  buyer_fee: z.string(),
  merchant_fee: z.string(),
  buyer_total: z.string(),
  fee_payer: z.enum(["BUYER", "MERCHANT"]),
  quote_valid_until: z.string(),
  terms_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  checkout_enabled: z.boolean(),
  fee_quote_available: z.boolean(),
  is_frozen: z.boolean(),
});

export type PublicInvoicePaymentOptions = z.infer<typeof publicInvoicePaymentOptionsSchema>;
export type PublicInvoicePaymentSession = z.infer<typeof publicInvoicePaymentSessionSchema>;
export type PublicInvoiceFeePreview = z.infer<typeof publicInvoiceFeePreviewSchema>;

export const publicQuoteLineSchema = z.object({
  description: z.string(),
  quantity: z.string(),
  unit_price: z.string(),
  line_total: z.string(),
}).strict();

export const publicQuoteSchema = z.object({
  quote_number: z.string(),
  quote_version: z.number().int(),
  status: z.string(),
  status_label: z.string(),
  seller_name: z.string(),
  customer_name: z.string(),
  currency: z.string(),
  valid_until: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  line_items: z.array(publicQuoteLineSchema),
  subtotal: z.string(),
  discount_total: z.string(),
  tax_total: z.string(),
  charge_total: z.string(),
  grand_total: z.string(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  project_name: z.string().nullable().optional(),
}).strict();

export const publicEvidenceReviewSchema = z.object({
  revision_number: z.number().int().positive(),
  revision_hash: z.string().regex(/^[a-f0-9]{64}$/),
  manifest_hash: z.string().regex(/^[a-f0-9]{64}$/),
  artifacts: z.array(z.object({
    ordinal: z.number().int().positive(),
    artifact_id: z.string().uuid(),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/),
    media_type: z.string().nullable().optional(),
    download_available: z.boolean(),
  }).strict()),
  all_downloadable: z.boolean(),
  acknowledgement_is_not_proof_of_reading: z.boolean(),
}).strict();

export const publicAcceptanceSchema = z.object({
  merchant_name: z.string(),
  project_name: z.string(),
  milestone_name: z.string(),
  milestone_description: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  deliverables: z.string().nullable().optional(),
  submitted_at: z.string(),
  status: z.string(),
  decided_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  evidence_review: publicEvidenceReviewSchema.nullable().optional(),
}).strict();

export type PublicInvoice = z.infer<typeof publicInvoiceSchema>;
export type PublicQuote = z.infer<typeof publicQuoteSchema>;
export type PublicAcceptance = z.infer<typeof publicAcceptanceSchema>;
