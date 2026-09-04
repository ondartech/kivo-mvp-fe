import { z } from "zod";

export const bankAccountCreateSchema = z
  .object({
    bank_code: z.string().min(2, "Select a bank").max(20),
    bank_name: z.string().min(2).max(100),
    account_number: z.string().regex(/^[0-9]{10}$/, "Enter 10-digit NUBAN (digits only)"),
    account_name: z.string().min(2, "Enter account name as on bank records").max(200),
    currency: z.string().regex(/^[A-Z]{3}$/).default("NGN"),
    is_default: z.boolean().default(false),
  })
  .strict();

export type BankAccountCreateInput = z.infer<typeof bankAccountCreateSchema>;

export function bankPairFromCode(code: string, banks: { code: string; name: string }[]) {
  const found = banks.find((b) => b.code === code);
  return found ? { bank_code: found.code, bank_name: found.name } : null;
}

const addressSchema = z
  .object({
    line1: z.string().max(200).optional().nullable(),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(30).optional().nullable(),
    country_code: z.string().regex(/^[A-Z]{2}$/, "2-letter code").optional().nullable(),
  })
  .optional()
  .nullable();

export const businessProfileSchema = z
  .object({
    legal_name: z.string().min(1, "Legal name is required").max(200),
    business_structure: z.enum(["UNREGISTERED", "REGISTERED"]).default("UNREGISTERED"),
    trading_name: z.string().max(200).optional().nullable(),
    display_name: z.string().max(200).optional().nullable(),
    email: z.string().email("Enter a valid email").optional().nullable().or(z.literal("")),
    phone: z.string().max(32).optional().nullable(),
    address: addressSchema,
    website: z.string().max(500).optional().nullable(),
    tax_identifier: z.string().max(100).optional().nullable(),
    logo_url: z.string().max(2000).optional().nullable(),
    invoice_prefix: z.string().max(30).optional().nullable(),
    default_currency: z.string().regex(/^[A-Z]{3}$/, "3-letter currency").optional().nullable(),
  })
  .strict();

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const cacLookupSchema = z
  .object({
    identifier_type: z.enum(["RC", "BN", "IT", "LLP", "OTHER"]),
    identifier: z.string().min(2, "Enter RC/BN number").max(100).trim(),
  })
  .strict();

export type CacLookupInput = z.infer<typeof cacLookupSchema>;
