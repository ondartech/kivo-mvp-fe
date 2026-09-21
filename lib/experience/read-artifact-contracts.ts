import { z } from "zod";

const uuid = z.string().uuid();

export const experienceEntityRefSchema = z
  .object({
    entity_type: z.string().min(1).max(64),
    entity_id: uuid,
    title: z.string().max(300).nullable().optional(),
    source_reference: z.string().max(500).nullable().optional(),
    score: z.number().nullable().optional(),
  })
  .strict();

export type ExperienceEntityRef = z.infer<typeof experienceEntityRefSchema>;

export const artifactAuthorityClassSchema = z.enum([
  "AUTHORITATIVE",
  "DERIVED",
  "EXTERNAL_EVIDENCE",
  "MIXED",
  "SYSTEM",
]);

export type ArtifactAuthorityClass = z.infer<
  typeof artifactAuthorityClassSchema
>;

export const artifactFreshnessSchema = z
  .object({
    status: z.enum(["CURRENT", "STALE", "UNKNOWN"]).default("UNKNOWN"),
    as_of: z.string().datetime({ offset: true }).nullable().optional(),
    stale_after: z.string().datetime({ offset: true }).nullable().optional(),
    reason: z.string().max(300).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.as_of &&
      value.stale_after &&
      new Date(value.stale_after).getTime() < new Date(value.as_of).getTime()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stale_after"],
        message: "stale_after cannot precede as_of",
      });
    }
  });

export type ArtifactFreshness = z.infer<typeof artifactFreshnessSchema>;

export const answerArtifactDataSchema = z
  .object({
    status: z.enum(["GROUNDED", "INSUFFICIENT_EVIDENCE"]),
    text: z.string().min(1).max(20_000),
    evidence_ids: z.array(z.string()).max(100).default([]),
    unknowns: z.array(z.string()).max(100).default([]),
    conflicts: z.array(z.string()).max(100).default([]),
  })
  .strict();

export type AnswerArtifactData = z.infer<typeof answerArtifactDataSchema>;

export const evidenceArtifactItemSchema = z
  .object({
    evidence_id: z.string().min(1).max(300),
    title: z.string().min(1).max(500),
    snippet: z.string().max(4_000).nullable().optional(),
    entity_type: z.string().max(80).nullable().optional(),
    entity_id: uuid.nullable().optional(),
    authority: z.enum([
      "AUTHORITATIVE",
      "DERIVED",
      "EXTERNAL_EVIDENCE",
    ]),
    source_type: z.string().min(1).max(80),
  })
  .strict();

export type EvidenceArtifactItem = z.infer<
  typeof evidenceArtifactItemSchema
>;

export const evidenceArtifactDataSchema = z
  .object({
    items: z.array(evidenceArtifactItemSchema).min(1).max(100),
  })
  .strict();

export type EvidenceArtifactData = z.infer<typeof evidenceArtifactDataSchema>;

export const metricArtifactDataSchema = z
  .object({
    label: z.string().min(1).max(200),
    value: z.string().min(1).max(200),
    unit: z.string().max(80).nullable().optional(),
    description: z.string().max(1_000).nullable().optional(),
    as_of: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type MetricArtifactData = z.infer<typeof metricArtifactDataSchema>;

export const metricGroupArtifactDataSchema = z
  .object({
    metrics: z.array(metricArtifactDataSchema).min(1).max(50),
  })
  .strict();

export type MetricGroupArtifactData = z.infer<
  typeof metricGroupArtifactDataSchema
>;

export const entityCardArtifactDataSchema = z
  .object({
    entity: experienceEntityRefSchema,
    fields: z
      .record(
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.null(),
        ]),
      )
      .default({}),
  })
  .strict();

export type EntityCardArtifactData = z.infer<
  typeof entityCardArtifactDataSchema
>;

export const entityListArtifactDataSchema = z
  .object({
    items: z.array(experienceEntityRefSchema).max(200),
    empty_message: z.string().max(500).nullable().optional(),
  })
  .strict();

export type EntityListArtifactData = z.infer<
  typeof entityListArtifactDataSchema
>;

export const dataTableColumnSchema = z
  .object({
    key: z.string().min(1).max(100),
    label: z.string().min(1).max(200),
    value_type: z.enum([
      "TEXT",
      "NUMBER",
      "MONEY",
      "DATE",
      "DATETIME",
      "STATUS",
      "BOOLEAN",
    ]),
  })
  .strict();

export const dataTableArtifactDataSchema = z
  .object({
    columns: z.array(dataTableColumnSchema).min(1).max(50),
    rows: z
      .array(
        z.record(
          z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.null(),
          ]),
        ),
      )
      .max(500),
  })
  .strict();

export type DataTableArtifactData = z.infer<
  typeof dataTableArtifactDataSchema
>;

export const timelineItemSchema = z
  .object({
    occurred_at: z.string().datetime({ offset: true }),
    label: z.string().min(1).max(300),
    description: z.string().max(2_000).nullable().optional(),
    entity: experienceEntityRefSchema.nullable().optional(),
  })
  .strict();

export const timelineArtifactDataSchema = z
  .object({
    items: z.array(timelineItemSchema).max(200),
  })
  .strict();

export type TimelineArtifactData = z.infer<
  typeof timelineArtifactDataSchema
>;

export const warningArtifactDataSchema = z
  .object({
    code: z.string().min(1).max(100),
    message: z.string().min(1).max(4_000),
    severity: z.enum(["INFO", "WARNING", "HIGH"]).default("WARNING"),
  })
  .strict();

export type WarningArtifactData = z.infer<
  typeof warningArtifactDataSchema
>;

export const conflictArtifactDataSchema = z
  .object({
    message: z.string().min(1).max(4_000),
    evidence_ids: z.array(z.string()).min(2).max(100),
  })
  .strict();

export type ConflictArtifactData = z.infer<
  typeof conflictArtifactDataSchema
>;

export const errorArtifactDataSchema = z
  .object({
    code: z.string().min(1).max(100),
    message: z.string().min(1).max(4_000),
    retryable: z.boolean().default(false),
  })
  .strict();

export type ErrorArtifactData = z.infer<typeof errorArtifactDataSchema>;

export const readArtifactDataSchemas = {
  ANSWER: answerArtifactDataSchema,
  EVIDENCE: evidenceArtifactDataSchema,
  METRIC: metricArtifactDataSchema,
  METRIC_GROUP: metricGroupArtifactDataSchema,
  ENTITY_CARD: entityCardArtifactDataSchema,
  ENTITY_LIST: entityListArtifactDataSchema,
  DATA_TABLE: dataTableArtifactDataSchema,
  TIMELINE: timelineArtifactDataSchema,
  WARNING: warningArtifactDataSchema,
  CONFLICT: conflictArtifactDataSchema,
  ERROR: errorArtifactDataSchema,
} as const;

export type ReadArtifactType = keyof typeof readArtifactDataSchemas;

export const READ_ARTIFACT_SCHEMA_VERSION = 1 as const;

export function isSupportedReadArtifactSchema(
  artifactType: string,
  schemaVersion: number,
): artifactType is ReadArtifactType {
  return (
    schemaVersion === READ_ARTIFACT_SCHEMA_VERSION &&
    Object.prototype.hasOwnProperty.call(readArtifactDataSchemas, artifactType)
  );
}
