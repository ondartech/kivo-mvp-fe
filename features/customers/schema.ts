"use client";

import { z } from "zod";

export const NG_STATES = new Set([
  "abia",
  "adamawa",
  "akwa ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara",
  "fct",
  "abuja",
]);

export const billingAddressSchema = z
  .object({
    line1: z.string().max(200).optional().nullable().or(z.literal("")),
    line2: z.string().max(200).optional().nullable().or(z.literal("")),
    city: z.string().max(100).optional().nullable().or(z.literal("")),
    state: z.string().max(100).optional().nullable().or(z.literal("")),
    lga: z.string().max(100).optional().nullable().or(z.literal("")),
    postal_code: z.string().max(30).optional().nullable().or(z.literal("")),
    country_code: z.string().regex(/^[A-Z]{2}$/).optional().nullable().or(z.literal("")),
  })
  .strict()
  .optional()
  .nullable()
  .superRefine((data: unknown, ctx: z.RefinementCtx) => {
    const d = data as { country_code?: string | null; state?: string | null; lga?: string | null } | null | undefined;
    if (!d) return;
    const country = (d.country_code ?? "").toString().trim().toUpperCase();
    const state = (d.state ?? "").toString().trim().toLowerCase();
    const lga = (d.lga ?? "").toString().trim();
    if (country === "NG" && state && NG_STATES.has(state) && !lga) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "lga is required when country is NG and state is a Nigerian state", path: ["lga"] });
    }
  });

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

const rawCustomerBase = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email().optional().nullable().or(z.literal("")),
    phone: z.string().max(32).optional().nullable().or(z.literal("")),
    billing_address: billingAddressSchema,
    classification: z.enum(["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "FOREIGN"]).default("INDIVIDUAL"),
    tax_identifier: z.string().max(100).optional().nullable().or(z.literal("")),
    tax_identifier_type: z.enum(["NG_TIN", "INCORPORATION_NUMBER", "FOREIGN_TAX_ID"]).optional().nullable(),
    business_description: z.string().max(200).optional().nullable().or(z.literal("")),
    notes: z.string().max(2000).optional().nullable().or(z.literal("")),
    contacts: z.array(contactSchema).default([]),
  })
  .strict();

function taxRefine(data: { tax_identifier?: string | null; tax_identifier_type?: string | null }, ctx: z.RefinementCtx) {
  const hasId = !!(data.tax_identifier && String(data.tax_identifier).trim());
  const hasType = !!data.tax_identifier_type;
  if (hasId !== hasType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tax_identifier and tax_identifier_type must be provided together", path: hasId ? ["tax_identifier_type"] : ["tax_identifier"] });
  }
  if (hasId && hasType) {
    const tid = String(data.tax_identifier).trim();
    if (data.tax_identifier_type === "NG_TIN") {
      if (!/^\d+$/.test(tid) || tid.length < 10 || tid.length > 14) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NG_TIN must be 10-14 digits", path: ["tax_identifier"] });
    } else if (data.tax_identifier_type === "INCORPORATION_NUMBER") {
      if (!/^(RC|BN|IT)\d{6,}$/.test(tid)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INCORPORATION_NUMBER must be RC/BN/IT followed by 6+ digits", path: ["tax_identifier"] });
    }
  }
}

export const customerCreateSchema = rawCustomerBase
  .superRefine((data: { tax_identifier?: string | null; tax_identifier_type?: string | null }, ctx: z.RefinementCtx) => taxRefine(data, ctx))
  .superRefine((data: { contacts?: { is_primary?: boolean }[] }, ctx: z.RefinementCtx) => {
    const primaryCount = (data.contacts ?? []).filter((c) => c.is_primary).length;
    if (primaryCount > 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At most one primary contact is allowed", path: ["contacts"] });
  });

export const customerPatchSchema = rawCustomerBase
  .partial()
  .strict()
  .superRefine((data: { tax_identifier?: string | null; tax_identifier_type?: string | null }, ctx: z.RefinementCtx) => {
    const hasId = data.tax_identifier !== undefined && !!(data.tax_identifier && String(data.tax_identifier).trim());
    const hasType = data.tax_identifier_type !== undefined && !!data.tax_identifier_type;
    if (data.tax_identifier === undefined && data.tax_identifier_type === undefined) return;
    if (hasId !== hasType) {
      const idEmpty = !data.tax_identifier || !String(data.tax_identifier).trim();
      const typeEmpty = !data.tax_identifier_type;
      if (idEmpty && typeEmpty) return;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "tax_identifier and tax_identifier_type must be provided together", path: hasId ? ["tax_identifier_type"] : ["tax_identifier"] });
    }
    if (hasId && hasType) {
      const tid = String(data.tax_identifier).trim();
      if (data.tax_identifier_type === "NG_TIN") {
        if (!/^\d+$/.test(tid) || tid.length < 10 || tid.length > 14) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "NG_TIN must be 10-14 digits", path: ["tax_identifier"] });
      } else if (data.tax_identifier_type === "INCORPORATION_NUMBER") {
        if (!/^(RC|BN|IT)\d{6,}$/.test(tid)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INCORPORATION_NUMBER must be RC/BN/IT followed by 6+ digits", path: ["tax_identifier"] });
      }
    }
  })
  .superRefine((data: { contacts?: { is_primary?: boolean }[] | undefined }, ctx: z.RefinementCtx) => {
    if (!data.contacts) return;
    const primaryCount = data.contacts.filter((c) => c.is_primary).length;
    if (primaryCount > 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At most one primary contact is allowed", path: ["contacts"] });
  });

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerPatchInput = z.infer<typeof customerPatchSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
