import { z } from "zod";

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
}).strict();

export type PublicQuote = z.infer<typeof publicQuoteSchema>;
export type PublicAcceptance = z.infer<typeof publicAcceptanceSchema>;
