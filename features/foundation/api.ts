"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { fetchWithAuth } from "@/lib/api-client";

export type FoundationEntityType =
  | "PARTY"
  | "CUSTOMER"
  | "INVOICE"
  | "QUOTE"
  | "CONTRACT"
  | "PROJECT"
  | "PAYMENT"
  | "RECEIVABLE"
  | "NRS_SUBMISSION";

export type RetrievalEvidence = {
  evidence_id: string;
  entity_type: FoundationEntityType | string;
  entity_id: string | null;
  title: string;
  snippet: string | null;
  score: number;
  mode: string;
  authoritative: boolean;
  authority: string;
  source_type: string;
  source_reference: string | null;
  content_hash: string | null;
  captured_at: string | null;
  provenance: Record<string, unknown>;
};

export type RetrievalResponse = {
  query: string;
  evidence: RetrievalEvidence[];
  modes_used: string[];
  conflicts: string[];
  unknowns: string[];
};

export type AskEvidence = Omit<
  RetrievalEvidence,
  "score" | "mode" | "authoritative" | "content_hash" | "captured_at"
>;

export type AskResponse = {
  status: string;
  answer: string;
  evidence_ids: string[];
  evidence: AskEvidence[];
  unknowns: string[];
  conflicts: string[];
  provider: string;
  model: string;
};

export type AttentionItem = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  attention_type: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  source_domain: string;
  source_entity: string;
  source_reference: string | null;
  title: string;
  summary: string;
  reason: string;
  detected_at: string;
  last_detected_at: string;
  due_at: string | null;
  owner_user_id: string | null;
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED" | string;
  dedupe_key: string;
  correlation_key: string | null;
  occurrence_count: number;
};

function baseUrl(orgId: string) {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/organizations/${orgId}`;
}

async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error ?? body;
    throw Object.assign(new Error(err?.message ?? `Request failed ${res.status}`), {
      status: res.status,
      code: err?.code,
      requestId: err?.request_id,
    });
  }
  return res.json() as Promise<T>;
}

export function useGlobalSearch(orgId: string) {
  return useMutation({
    mutationFn: async (input: {
      text: string;
      entityTypes?: FoundationEntityType[];
      limit?: number;
    }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/retrieval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.text,
          entity_types: input.entityTypes ?? [],
          modes: ["EXACT", "LEXICAL"],
          limit: input.limit ?? 20,
          graph_edge_types: [],
        }),
      });
      return handleRes<RetrievalResponse>(res);
    },
  });
}

export function useAskOndar(orgId: string) {
  return useMutation({
    mutationFn: async (input: {
      question: string;
      entityTypes?: FoundationEntityType[];
      limit?: number;
    }) => {
      const res = await fetchWithAuth(`${baseUrl(orgId)}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input.question,
          entity_types: input.entityTypes ?? [],
          limit: input.limit ?? 20,
          graph_edge_types: [],
        }),
      });
      return handleRes<AskResponse>(res);
    },
  });
}

export function useOpenAttentionCount(orgId: string) {
  return useQuery({
    queryKey: ["attention", orgId, "shell-count"],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "OPEN", limit: "100" });
      const res = await fetchWithAuth(`${baseUrl(orgId)}/attention?${params.toString()}`, {
        method: "GET",
      });
      const rows = await handleRes<AttentionItem[]>(res);
      return {
        count: rows.length,
        critical: rows.filter((item) => item.severity === "CRITICAL").length,
        high: rows.filter((item) => item.severity === "HIGH").length,
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAttention(orgId: string, status?: string) {
  return useQuery({
    queryKey: ["attention", orgId, status ?? "active"],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (status) params.set("status", status);
      const res = await fetchWithAuth(`${baseUrl(orgId)}/attention?${params.toString()}`, {
        method: "GET",
      });
      return handleRes<AttentionItem[]>(res);
    },
  });
}
