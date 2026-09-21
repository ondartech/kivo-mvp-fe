import { z } from "zod";

import {
  artifactAuthorityClassSchema,
  artifactFreshnessSchema,
  experienceEntityRefSchema,
} from "@/lib/experience/read-artifact-contracts";

export const artifactTypeSchema = z.enum([
  "ANSWER",
  "EVIDENCE",
  "METRIC",
  "METRIC_GROUP",
  "ENTITY_CARD",
  "ENTITY_LIST",
  "DATA_TABLE",
  "TIMELINE",
  "WARNING",
  "CONFLICT",
  "ERROR",
]);

export const artifactInteractionSchema = z.enum([
  "COPY",
  "OPEN_ENTITY",
  "OPEN_WORKSPACE",
  "REFRESH",
  "DOWNLOAD",
]);

export const artifactRenderModeSchema = z.enum([
  "INLINE",
  "CARD",
  "TABLE",
  "TIMELINE",
  "NOTICE",
]);

export const artifactPersistenceModeSchema = z.enum([
  "EPHEMERAL",
  "PERSISTED",
]);

export const artifactSourceRefSchema = z
  .object({
    evidence_id: z.string().min(1).max(300),
    authority: z.enum([
      "AUTHORITATIVE",
      "DERIVED",
      "EXTERNAL_EVIDENCE",
    ]),
    source_type: z.string().min(1).max(80),
    source_reference: z.string().max(500).nullable().optional(),
    entity_type: z.string().max(80).nullable().optional(),
    entity_id: z.string().uuid().nullable().optional(),
    content_hash: z.string().max(128).nullable().optional(),
    captured_at: z.string().datetime({ offset: true }).nullable().optional(),
    retrieval_mode: z.string().max(40).nullable().optional(),
    provenance: z.record(z.unknown()).default({}),
  })
  .strict();

export const artifactEnvelopeSchema = z
  .object({
    artifact_id: z.string().uuid(),
    artifact_type: artifactTypeSchema,
    schema_version: z.number().int().positive(),
    title: z.string().min(1).max(300),
    conversation_id: z.string().uuid(),
    turn_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    authority_class: artifactAuthorityClassSchema,
    freshness: artifactFreshnessSchema,
    source_refs: z.array(artifactSourceRefSchema).max(100).default([]),
    related_entities: z.array(experienceEntityRefSchema).max(200).default([]),
    allowed_interactions: z.array(artifactInteractionSchema).default([]),
    render_mode: artifactRenderModeSchema,
    persistence_mode: artifactPersistenceModeSchema,
    data: z.record(z.unknown()),
    created_at: z.string().datetime({ offset: true }),
    expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export type ArtifactEnvelope = z.infer<typeof artifactEnvelopeSchema>;
export type ArtifactType = z.infer<typeof artifactTypeSchema>;
export type ArtifactInteraction = z.infer<typeof artifactInteractionSchema>;
export type ArtifactRenderMode = z.infer<typeof artifactRenderModeSchema>;
