"use client";

import { z } from "zod";

export const billingAddressSchema = z
  .object({
    street_name: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    postal_zone: z.string().max(20).optional().nullable(),
    state_code: z.string().max(10).optional().nullable(),
    lga_code: z.string().max(10).optional().nullable(),
    country_code: z.string().length(2).default("NG").optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

export const contactSchema = z
  .object({
    name: z.string().min(1, "Contact name is required").max(200),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().max(32).optional().nullable().or(z.literal("")),
    type: z.enum(["BILLING", "PRIMARY"]).default("BILLING"),
    is_primary: z.boolean().default(false),
    email_opt_in: z.boolean().default(true).optional(),
    whatsapp_opt_in: z.boolean().default(false).optional(),
  })
  .strict();

const customerBaseSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().max(32).optional().nullable().or(z.literal("")),
    billing_address: billingAddressSchema,
    tax_identifier: z.string().max(100).optional().nullable().or(z.literal("")),
    tax_identifier_type: z
      .enum(["NG_TIN", "INCORPORATION_NUMBER", "FOREIGN_TAX_ID"])
      .optional()
      .nullable(),
    business_description: z.string().max(200).optional().nullable().or(z.literal("")),
    notes: z.string().max(2000).optional().nullable().or(z.literal("")),
    contacts: z.array(contactSchema).default([]),
  })
  .strict();

export const customerCreateSchema = customerBaseSchema.superRefine((data, ctx) => {
  const primaryCount = (data.contacts ?? []).filter((c) => c.is_primary).length;
  if (primaryCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At most one primary contact is allowed",
      path: ["contacts"],
    });
  }
});

export const customerPatchSchema = customerBaseSchema.partial().strict();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerPatchInput = z.infer<typeof customerPatchSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

// For Money display-only gate: ensure no Number/parseFloat in this file
// check-money-usage.sh will fail if found in app/features
