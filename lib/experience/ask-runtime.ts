import { z } from "zod";

import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";
import type { AskResponse } from "@/features/foundation/api";
import {
  artifactEnvelopeSchema,
  type ArtifactEnvelope,
} from "@/lib/experience/artifact-envelope";
import {
  experienceEntityRefSchema,
  type ExperienceEntityRef,
} from "@/lib/experience/read-artifact-contracts";

const uuid = z.string().uuid();

export type { ExperienceEntityRef };

export const conversationSchema = z.object({
  id: uuid,
  organization_id: uuid,
  branch_id: uuid.nullable(),
  principal_id: uuid,
  source_channel: z.enum(["WEB", "MOBILE", "VOICE", "EMAIL", "MESSAGING", "API"]),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  title: z.string().nullable(),
  model_policy_ref: z.string().nullable(),
  active_workspace_id: uuid.nullable(),
  retention_class: z.string(),
  archived_at: z.string().datetime({ offset: true }).nullable(),
  last_turn_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type Conversation = z.infer<typeof conversationSchema>;

export const conversationTurnSchema = z.object({
  id: uuid,
  organization_id: uuid,
  conversation_id: uuid,
  actor_type: z.enum(["USER", "ASSISTANT", "SYSTEM_VISIBLE", "TOOL_VISIBLE"]),
  content: z.string().nullable(),
  content_ref: z.string().nullable(),
  structured_payload: z.record(z.unknown()).nullable(),
  correlation_id: z.string().nullable(),
  model_operation_id: uuid.nullable(),
  created_at: z.string().datetime({ offset: true }),
});

export type ConversationTurn = z.infer<typeof conversationTurnSchema>;

const ambiguitySchema = z
  .object({
    code: z.string(),
    message: z.string(),
    field: z.string().nullable().optional(),
    candidates: z.array(experienceEntityRefSchema).default([]),
  })
  .strict();

const intentSchema = z
  .object({
    intent_type: z.string(),
    user_goal: z.string(),
    requested_operation: z.string(),
    referenced_entities: z.array(experienceEntityRefSchema).default([]),
    constraints: z.record(z.string()).default({}),
    requested_output: z.string(),
    urgency: z.string(),
    confidence: z.number(),
    ambiguities: z.array(ambiguitySchema).default([]),
    risk_hint: z.string(),
    conversation_id: uuid,
    turn_id: uuid,
  })
  .strict();

export const intentResolutionSchema = z
  .object({
    status: z.enum(["RESOLVED", "CLARIFICATION_REQUIRED", "BLOCKED_L1"]),
    intent: intentSchema.nullable(),
    classification_source: z.enum(["DETERMINISTIC", "MODEL", "NONE"]),
    routing_hint: z.string(),
    execution_allowed: z.boolean(),
    clarification: ambiguitySchema.nullable(),
  })
  .strict();

export type IntentResolution = z.infer<typeof intentResolutionSchema>;

export type ExperienceScope = {
  organizationId: string | null;
  branchId: string | null;
};

export type StreamArtifact = ArtifactEnvelope;

export type WorkspaceSuggestion = {
  title: string;
  href: string;
};

function apiRoot(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

function orgBase(organizationId: string): string {
  return `${apiRoot()}/api/v1/organizations/${organizationId}`;
}

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}

export function readExperienceScope(): ExperienceScope {
  if (typeof window === "undefined") {
    return { organizationId: null, branchId: null };
  }
  const organizationId =
    localStorage.getItem("orgId") ?? localStorage.getItem("organization_id");
  const branchId =
    localStorage.getItem("branchId") ?? localStorage.getItem("branch_id");
  return {
    organizationId: isUuid(organizationId) ? organizationId : null,
    branchId: isUuid(branchId) ? branchId : null,
  };
}

function conversationStorageKey(organizationId: string): string {
  return `ondar:experience:conversation:${organizationId}`;
}

export function savedConversationId(organizationId: string): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(conversationStorageKey(organizationId));
  return isUuid(value) ? value : null;
}

export function saveConversationId(
  organizationId: string,
  conversationId: string,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    conversationStorageKey(organizationId),
    conversationId,
  );
}

async function responseJson<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const nested =
      errorBody.error && typeof errorBody.error === "object"
        ? (errorBody.error as Record<string, unknown>)
        : errorBody;
    const message =
      typeof nested.message === "string"
        ? nested.message
        : `Request failed with HTTP ${response.status}`;
    throw Object.assign(new Error(message), {
      status: response.status,
      code: typeof nested.code === "string" ? nested.code : undefined,
    });
  }
  return schema.parse(body);
}

export async function createConversation(
  organizationId: string,
  branchId: string | null,
): Promise<Conversation> {
  const response = await fetchWithAuth(`${orgBase(organizationId)}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_channel: "WEB",
      branch_id: branchId,
      title: "Ask Ondar",
    }),
  });
  const conversation = await responseJson(response, conversationSchema);
  saveConversationId(organizationId, conversation.id);
  return conversation;
}

export async function resumeOrCreateConversation(
  organizationId: string,
  branchId: string | null,
): Promise<Conversation> {
  const saved = savedConversationId(organizationId);
  if (saved) {
    const response = await fetchWithAuth(
      `${orgBase(organizationId)}/conversations/${saved}`,
      { method: "GET" },
    );
    if (response.ok) {
      const existing = await responseJson(response, conversationSchema);
      if (
        existing.status === "ACTIVE" &&
        existing.branch_id === branchId
      ) {
        return existing;
      }
    } else if (response.status !== 404) {
      await responseJson(response, conversationSchema);
    }
  }
  return createConversation(organizationId, branchId);
}

export async function appendUserTurn(
  organizationId: string,
  conversationId: string,
  content: string,
): Promise<ConversationTurn> {
  const response = await fetchWithAuth(
    `${orgBase(organizationId)}/conversations/${conversationId}/turns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  return responseJson(response, conversationTurnSchema);
}

export async function resolveIntent(
  organizationId: string,
  conversationId: string,
  turnId: string,
): Promise<IntentResolution> {
  const response = await fetchWithAuth(
    `${orgBase(organizationId)}/conversations/${conversationId}/turns/${turnId}/resolve-intent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expected_entity_types: [] }),
    },
  );
  return responseJson(response, intentResolutionSchema);
}

export async function askGrounded(
  organizationId: string,
  question: string,
  anchor?: ExperienceEntityRef,
): Promise<AskResponse> {
  const response = await fetchWithAuth(`${orgBase(organizationId)}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      entity_types: [],
      limit: 20,
      anchor_entity_type: anchor?.entity_type ?? null,
      anchor_entity_id: anchor?.entity_id ?? null,
      graph_edge_types: [],
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error =
      body?.error && typeof body.error === "object" ? body.error : body;
    throw Object.assign(
      new Error(
        typeof error?.message === "string"
          ? error.message
          : `Ask failed with HTTP ${response.status}`,
      ),
      {
        status: response.status,
        code: typeof error?.code === "string" ? error.code : undefined,
      },
    );
  }
  return (await response.json()) as AskResponse;
}

export function interactionStreamUrl(
  organizationId: string,
  conversationId: string,
  turnId: string,
  follow = true,
): string {
  return `${orgBase(organizationId)}/conversations/${conversationId}/turns/${turnId}/events?follow=${follow ? "true" : "false"}`;
}

export function entityWorkspaceHref(
  entity: ExperienceEntityRef,
): string | null {
  switch (entity.entity_type) {
    case "CUSTOMER":
      return `/app/customers/${entity.entity_id}`;
    case "INVOICE":
      return `/app/invoices/${entity.entity_id}`;
    case "PAYMENT":
      return "/app/payments";
    case "RECEIVABLE":
      return "/app/receivables";
    default:
      return null;
  }
}

export function artifactFromEventPayload(
  payload: Record<string, unknown>,
): StreamArtifact | null {
  const parsed = artifactEnvelopeSchema.safeParse(payload.artifact);
  return parsed.success ? parsed.data : null;
}

export function workspaceFromEventPayload(
  payload: Record<string, unknown>,
): WorkspaceSuggestion | null {
  const href = payload.href;
  if (typeof href !== "string" || !href.startsWith("/app/")) {
    return null;
  }
  return {
    href,
    title:
      typeof payload.title === "string" && payload.title.trim()
        ? payload.title.trim()
        : "Open workspace",
  };
}
