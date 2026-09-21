"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { z } from "zod";

import {
  AnswerBlock,
  ConflictBlock,
  DataTable,
  EntityCard,
  EntityList,
  ErrorBlock,
  EvidenceBlock,
  MetricBlock,
  MetricGroup,
  Timeline,
  WarningBlock,
  type EntityHrefResolver,
  type EvidenceHrefResolver,
} from "@/components/kivo/generated-ui/read-primitives";
import {
  artifactEnvelopeSchema,
  type ArtifactEnvelope,
  type ArtifactRenderMode,
} from "@/lib/experience/artifact-envelope";
import {
  answerArtifactDataSchema,
  conflictArtifactDataSchema,
  dataTableArtifactDataSchema,
  entityCardArtifactDataSchema,
  entityListArtifactDataSchema,
  errorArtifactDataSchema,
  evidenceArtifactDataSchema,
  metricArtifactDataSchema,
  metricGroupArtifactDataSchema,
  timelineArtifactDataSchema,
  warningArtifactDataSchema,
  type ReadArtifactType,
} from "@/lib/experience/read-artifact-contracts";

export type ArtifactRendererFlags = Partial<Record<ReadArtifactType, boolean>>;

export type ArtifactRendererTelemetryEvent = {
  name: "artifact_render_failure";
  artifact_id?: string;
  conversation_id?: string;
  turn_id?: string;
  artifact_type?: string;
  schema_version?: number;
  reason:
    | "UNKNOWN_ARTIFACT_TYPE"
    | "UNSUPPORTED_SCHEMA_VERSION"
    | "FAMILY_DISABLED"
    | "ENVELOPE_INVALID"
    | "DATA_INVALID"
    | "RENDER_MODE_MISMATCH"
    | "RENDER_EXCEPTION";
  detail?: string;
};

export type ArtifactRendererTelemetrySink = (
  event: ArtifactRendererTelemetryEvent,
) => void;

export type ArtifactRendererResolvers = {
  resolveEntityHref?: EntityHrefResolver;
  resolveEvidenceHref?: EvidenceHrefResolver;
};

type RenderContext = {
  title: string;
  meta: {
    authorityClass: ArtifactEnvelope["authority_class"];
    freshness: ArtifactEnvelope["freshness"];
  };
  resolveEntityHref?: EntityHrefResolver;
  resolveEvidenceHref?: EvidenceHrefResolver;
};

type Descriptor = {
  artifactType: ReadArtifactType;
  schemaVersion: 1;
  renderMode: ArtifactRenderMode;
  dataSchema: z.ZodTypeAny;
  render: (data: unknown, context: RenderContext) => ReactNode;
};

const descriptors: Record<ReadArtifactType, Descriptor> = {
  ANSWER: {
    artifactType: "ANSWER",
    schemaVersion: 1,
    renderMode: "INLINE",
    dataSchema: answerArtifactDataSchema,
    render: (data, context) => (
      <AnswerBlock
        data={answerArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
      />
    ),
  },
  EVIDENCE: {
    artifactType: "EVIDENCE",
    schemaVersion: 1,
    renderMode: "CARD",
    dataSchema: evidenceArtifactDataSchema,
    render: (data, context) => (
      <EvidenceBlock
        data={evidenceArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
        resolveEntityHref={context.resolveEntityHref}
        resolveSourceHref={context.resolveEvidenceHref}
      />
    ),
  },
  METRIC: {
    artifactType: "METRIC",
    schemaVersion: 1,
    renderMode: "CARD",
    dataSchema: metricArtifactDataSchema,
    render: (data, context) => (
      <MetricBlock
        data={metricArtifactDataSchema.parse(data)}
        meta={context.meta}
      />
    ),
  },
  METRIC_GROUP: {
    artifactType: "METRIC_GROUP",
    schemaVersion: 1,
    renderMode: "CARD",
    dataSchema: metricGroupArtifactDataSchema,
    render: (data, context) => (
      <MetricGroup
        data={metricGroupArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
      />
    ),
  },
  ENTITY_CARD: {
    artifactType: "ENTITY_CARD",
    schemaVersion: 1,
    renderMode: "CARD",
    dataSchema: entityCardArtifactDataSchema,
    render: (data, context) => (
      <EntityCard
        data={entityCardArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
        resolveEntityHref={context.resolveEntityHref}
      />
    ),
  },
  ENTITY_LIST: {
    artifactType: "ENTITY_LIST",
    schemaVersion: 1,
    renderMode: "CARD",
    dataSchema: entityListArtifactDataSchema,
    render: (data, context) => (
      <EntityList
        data={entityListArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
        resolveEntityHref={context.resolveEntityHref}
      />
    ),
  },
  DATA_TABLE: {
    artifactType: "DATA_TABLE",
    schemaVersion: 1,
    renderMode: "TABLE",
    dataSchema: dataTableArtifactDataSchema,
    render: (data, context) => (
      <DataTable
        data={dataTableArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
      />
    ),
  },
  TIMELINE: {
    artifactType: "TIMELINE",
    schemaVersion: 1,
    renderMode: "TIMELINE",
    dataSchema: timelineArtifactDataSchema,
    render: (data, context) => (
      <Timeline
        data={timelineArtifactDataSchema.parse(data)}
        title={context.title}
        meta={context.meta}
        resolveEntityHref={context.resolveEntityHref}
      />
    ),
  },
  WARNING: {
    artifactType: "WARNING",
    schemaVersion: 1,
    renderMode: "NOTICE",
    dataSchema: warningArtifactDataSchema,
    render: (data, context) => (
      <WarningBlock
        data={warningArtifactDataSchema.parse(data)}
        meta={context.meta}
      />
    ),
  },
  CONFLICT: {
    artifactType: "CONFLICT",
    schemaVersion: 1,
    renderMode: "NOTICE",
    dataSchema: conflictArtifactDataSchema,
    render: (data, context) => (
      <ConflictBlock
        data={conflictArtifactDataSchema.parse(data)}
        meta={context.meta}
      />
    ),
  },
  ERROR: {
    artifactType: "ERROR",
    schemaVersion: 1,
    renderMode: "NOTICE",
    dataSchema: errorArtifactDataSchema,
    render: (data, context) => (
      <ErrorBlock
        data={errorArtifactDataSchema.parse(data)}
        meta={context.meta}
      />
    ),
  },
};

function rawMetadata(value: unknown): {
  artifactId?: string;
  conversationId?: string;
  turnId?: string;
  artifactType?: string;
  schemaVersion?: number;
} {
  if (!value || typeof value !== "object") return {};
  const object = value as Record<string, unknown>;
  return {
    artifactId:
      typeof object.artifact_id === "string" ? object.artifact_id : undefined,
    conversationId:
      typeof object.conversation_id === "string"
        ? object.conversation_id
        : undefined,
    turnId: typeof object.turn_id === "string" ? object.turn_id : undefined,
    artifactType:
      typeof object.artifact_type === "string"
        ? object.artifact_type
        : undefined,
    schemaVersion:
      typeof object.schema_version === "number"
        ? object.schema_version
        : undefined,
  };
}

function emitFailure(
  sink: ArtifactRendererTelemetrySink | undefined,
  value: unknown,
  reason: ArtifactRendererTelemetryEvent["reason"],
  detail?: string,
): void {
  if (!sink) return;
  const metadata = rawMetadata(value);
  sink({
    name: "artifact_render_failure",
    artifact_id: metadata.artifactId,
    conversation_id: metadata.conversationId,
    turn_id: metadata.turnId,
    artifact_type: metadata.artifactType,
    schema_version: metadata.schemaVersion,
    reason,
    detail,
  });
}

function failureView(
  title: string,
  message: string,
): ReactNode {
  return (
    <ErrorBlock
      title={title}
      data={{
        code: "ARTIFACT_RENDER_FAILED",
        message,
        retryable: false,
      }}
      meta={{ authorityClass: "SYSTEM" }}
    />
  );
}

function hasRenderer(
  artifactType: string,
): artifactType is ReadArtifactType {
  return Object.prototype.hasOwnProperty.call(descriptors, artifactType);
}

function allowedEntityResolver(
  artifact: ArtifactEnvelope,
  resolver: EntityHrefResolver | undefined,
): EntityHrefResolver | undefined {
  if (
    !resolver ||
    (!artifact.allowed_interactions.includes("OPEN_ENTITY") &&
      !artifact.allowed_interactions.includes("OPEN_WORKSPACE"))
  ) {
    return undefined;
  }
  return resolver;
}

function allowedEvidenceResolver(
  artifact: ArtifactEnvelope,
  resolver: EvidenceHrefResolver | undefined,
): EvidenceHrefResolver | undefined {
  if (!resolver || !artifact.allowed_interactions.includes("OPEN_ENTITY")) {
    return undefined;
  }
  return resolver;
}

type BoundaryProps = {
  artifact: unknown;
  onTelemetry?: ArtifactRendererTelemetrySink;
  children: ReactNode;
};

type BoundaryState = {
  failed: boolean;
};

function RegisteredArtifactView({
  descriptor,
  data,
  context,
}: {
  descriptor: Descriptor;
  data: unknown;
  context: RenderContext;
}) {
  return <>{descriptor.render(data, context)}</>;
}

class ArtifactRenderBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    emitFailure(
      this.props.onTelemetry,
      this.props.artifact,
      "RENDER_EXCEPTION",
      error.message,
    );
  }

  render(): ReactNode {
    if (this.state.failed) {
      return failureView(
        "Artifact unavailable",
        "This artifact could not be rendered safely.",
      );
    }
    return this.props.children;
  }
}

export function ArtifactRenderer({
  artifact,
  flags = {},
  resolvers = {},
  onTelemetry,
}: {
  artifact: unknown;
  flags?: ArtifactRendererFlags;
  resolvers?: ArtifactRendererResolvers;
  onTelemetry?: ArtifactRendererTelemetrySink;
}) {
  const metadata = rawMetadata(artifact);

  if (!metadata.artifactType || !hasRenderer(metadata.artifactType)) {
    emitFailure(
      onTelemetry,
      artifact,
      "UNKNOWN_ARTIFACT_TYPE",
      metadata.artifactType ?? "missing artifact_type",
    );
    return failureView(
      "Unsupported artifact",
      "This artifact type is not registered in this version of Ondar.",
    );
  }

  const descriptor = descriptors[metadata.artifactType];

  if (metadata.schemaVersion !== descriptor.schemaVersion) {
    emitFailure(
      onTelemetry,
      artifact,
      "UNSUPPORTED_SCHEMA_VERSION",
      `expected ${descriptor.schemaVersion}, received ${metadata.schemaVersion ?? "missing"}`,
    );
    return failureView(
      "Unsupported artifact version",
      "This artifact uses a schema version that this client does not support.",
    );
  }

  if (flags[descriptor.artifactType] === false) {
    emitFailure(
      onTelemetry,
      artifact,
      "FAMILY_DISABLED",
      descriptor.artifactType,
    );
    return failureView(
      "Artifact unavailable",
      "This artifact family is not enabled in the current client.",
    );
  }

  const envelope = artifactEnvelopeSchema.safeParse(artifact);
  if (!envelope.success) {
    emitFailure(
      onTelemetry,
      artifact,
      "ENVELOPE_INVALID",
      envelope.error.issues[0]?.message,
    );
    return failureView(
      "Invalid artifact",
      "This artifact did not pass the trusted envelope contract.",
    );
  }

  if (envelope.data.render_mode !== descriptor.renderMode) {
    emitFailure(
      onTelemetry,
      artifact,
      "RENDER_MODE_MISMATCH",
      `expected ${descriptor.renderMode}, received ${envelope.data.render_mode}`,
    );
    return failureView(
      "Invalid artifact presentation",
      "The artifact render mode does not match its registered renderer.",
    );
  }

  const parsedData = descriptor.dataSchema.safeParse(envelope.data.data);
  if (!parsedData.success) {
    emitFailure(
      onTelemetry,
      artifact,
      "DATA_INVALID",
      parsedData.error.issues[0]?.message,
    );
    return failureView(
      "Invalid artifact data",
      "This artifact payload does not match its registered schema.",
    );
  }

  const context: RenderContext = {
    title: envelope.data.title,
    meta: {
      authorityClass: envelope.data.authority_class,
      freshness: envelope.data.freshness,
    },
    resolveEntityHref: allowedEntityResolver(
      envelope.data,
      resolvers.resolveEntityHref,
    ),
    resolveEvidenceHref: allowedEvidenceResolver(
      envelope.data,
      resolvers.resolveEvidenceHref,
    ),
  };

  return (
    <ArtifactRenderBoundary
      key={envelope.data.artifact_id}
      artifact={artifact}
      onTelemetry={onTelemetry}
    >
      <RegisteredArtifactView
        descriptor={descriptor}
        data={parsedData.data}
        context={context}
      />
    </ArtifactRenderBoundary>
  );
}

export function registeredReadArtifactRenderers(): ReadonlyArray<{
  artifactType: ReadArtifactType;
  schemaVersion: number;
  renderMode: ArtifactRenderMode;
}> {
  return Object.values(descriptors).map((descriptor) => ({
    artifactType: descriptor.artifactType,
    schemaVersion: descriptor.schemaVersion,
    renderMode: descriptor.renderMode,
  }));
}
