"use client";

import { z } from "zod";

const uuidSchema = z.string().uuid();

export const branchAddressSchema = z
  .object({
    line1: z.string().max(200).optional().nullable(),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(30).optional().nullable(),
    country_code: z
      .string()
      .regex(/^[A-Z]{2}$/, "Use a two-letter uppercase country code")
      .optional()
      .nullable(),
  })
  .strict();

export const branchSchema = z
  .object({
    id: uuidSchema,
    organization_id: uuidSchema,
    code: z.string(),
    name: z.string(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    is_primary: z.boolean(),
    timezone: z.string(),
    address: branchAddressSchema,
    deactivated_at: z.string().datetime().optional().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .strict();

export const branchCreateSchema = z
  .object({
    code: z
      .string()
      .min(1, "Branch code is required")
      .max(32)
      .regex(
        /^[A-Z0-9][A-Z0-9_-]{0,31}$/,
        "Use uppercase letters, numbers, underscores or hyphens",
      ),
    name: z.string().min(1, "Branch name is required").max(200),
    timezone: z.string().min(1).max(64).optional().nullable(),
    address: branchAddressSchema.optional().nullable(),
  })
  .strict();

export const branchPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional().nullable(),
    timezone: z.string().min(1).max(64).optional().nullable(),
    address: branchAddressSchema.optional().nullable(),
  })
  .strict();

export type Branch = z.infer<typeof branchSchema>;
export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchPatchInput = z.infer<typeof branchPatchSchema>;
