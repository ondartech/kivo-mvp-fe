import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  AnswerArtifactData,
  ArtifactAuthorityClass,
  ArtifactFreshness,
  ConflictArtifactData,
  DataTableArtifactData,
  EntityCardArtifactData,
  EntityListArtifactData,
  ErrorArtifactData,
  EvidenceArtifactData,
  EvidenceArtifactItem,
  ExperienceEntityRef,
  MetricArtifactData,
  MetricGroupArtifactData,
  TimelineArtifactData,
  WarningArtifactData,
} from "@/lib/experience/read-artifact-contracts";

export type ReadPrimitiveMeta = {
  authorityClass?: ArtifactAuthorityClass;
  freshness?: ArtifactFreshness;
};

export type EntityHrefResolver = (
  entity: ExperienceEntityRef,
) => string | null;

export type EvidenceHrefResolver = (
  item: EvidenceArtifactItem,
) => string | null;

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function renderScalar(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function Metadata({ meta }: { meta?: ReadPrimitiveMeta }) {
  if (!meta?.authorityClass && !meta?.freshness) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      {meta.authorityClass ? (
        <span className="rounded-full border bg-neutral-50 px-2 py-0.5">
          {humanize(meta.authorityClass)}
        </span>
      ) : null}
      {meta.freshness ? (
        <span
          className={cn(
            "rounded-full border px-2 py-0.5",
            meta.freshness.status === "STALE"
              ? "bg-neutral-100 font-medium text-foreground"
              : "bg-neutral-50",
          )}
          title={meta.freshness.reason ?? undefined}
        >
          {humanize(meta.freshness.status)}
          {meta.freshness.as_of
            ? ` · as of ${formatTimestamp(meta.freshness.as_of)}`
            : ""}
        </span>
      ) : null}
    </div>
  );
}

function PrimitiveFrame({
  title,
  meta,
  children,
  className,
}: {
  title?: string;
  meta?: ReadPrimitiveMeta;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      {title || meta ? (
        <CardHeader className="space-y-2">
          {title ? <CardTitle>{title}</CardTitle> : null}
          <Metadata meta={meta} />
        </CardHeader>
      ) : null}
      <CardContent className={cn(!title && !meta && "pt-6")}>
        {children}
      </CardContent>
    </Card>
  );
}

export function ReadPrimitiveState({
  state,
  title,
  message,
}: {
  state: "LOADING" | "PARTIAL" | "EMPTY" | "ERROR";
  title?: string;
  message?: string;
}) {
  const defaultTitle = {
    LOADING: "Loading",
    PARTIAL: "Partial result",
    EMPTY: "Nothing to show",
    ERROR: "Unable to render",
  }[state];
  const defaultMessage = {
    LOADING: "Ondar is preparing this view.",
    PARTIAL: "Some information is available while the rest is still resolving.",
    EMPTY: "No matching records are available for this view.",
    ERROR: "This read-only view could not be rendered safely.",
  }[state];

  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        state === "LOADING" && "animate-pulse bg-neutral-50",
        state !== "LOADING" && "bg-surface",
      )}
      role={state === "ERROR" ? "alert" : "status"}
    >
      <div className="font-medium">{title ?? defaultTitle}</div>
      <div className="mt-1 text-muted-foreground">
        {message ?? defaultMessage}
      </div>
    </div>
  );
}

export function AnswerBlock({
  data,
  title = "Answer",
  meta,
}: {
  data: AnswerArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border bg-neutral-50 px-2 py-0.5">
            {humanize(data.status)}
          </span>
          {data.evidence_ids.length ? (
            <span>{data.evidence_ids.length} evidence references</span>
          ) : null}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-6">{data.text}</div>
        {data.unknowns.length ? (
          <div className="rounded-md border bg-neutral-50 p-3 text-sm">
            <div className="font-medium">Unknowns</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {data.unknowns.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {data.conflicts.length ? (
          <div className="rounded-md border bg-neutral-50 p-3 text-sm">
            <div className="font-medium">Conflicting evidence</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {data.conflicts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </PrimitiveFrame>
  );
}

function EvidenceItemView({
  item,
  resolveEntityHref,
  resolveSourceHref,
}: {
  item: EvidenceArtifactItem;
  resolveEntityHref?: EntityHrefResolver;
  resolveSourceHref?: EvidenceHrefResolver;
}) {
  const entity =
    item.entity_id && item.entity_type
      ? {
          entity_id: item.entity_id,
          entity_type: item.entity_type,
          title: item.title,
        }
      : null;
  const href =
    resolveSourceHref?.(item) ??
    (entity && resolveEntityHref ? resolveEntityHref(entity) : null);
  const body = (
    <div className="rounded-md border bg-neutral-50 p-3">
      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        {item.entity_type ? <span>{item.entity_type}</span> : null}
        <span>{humanize(item.authority)}</span>
        <span>{item.source_type}</span>
      </div>
      <div className="mt-1 text-sm font-medium">{item.title}</div>
      {item.snippet ? (
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {item.snippet}
        </p>
      ) : null}
      {href ? (
        <div className="mt-2 text-xs font-medium">Open source record →</div>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EvidenceBlock({
  data,
  title = "Evidence",
  meta,
  resolveEntityHref,
  resolveSourceHref,
}: {
  data: EvidenceArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
  resolveEntityHref?: EntityHrefResolver;
  resolveSourceHref?: EvidenceHrefResolver;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      <div className="grid gap-2">
        {data.items.map((item) => (
          <EvidenceItemView
            key={item.evidence_id}
            item={item}
            resolveEntityHref={resolveEntityHref}
            resolveSourceHref={resolveSourceHref}
          />
        ))}
      </div>
    </PrimitiveFrame>
  );
}

export function MetricBlock({
  data,
  meta,
}: {
  data: MetricArtifactData;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <PrimitiveFrame meta={meta}>
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {data.label}
        </div>
        <div className="text-2xl font-semibold tracking-tight">
          {data.value}
          {data.unit ? (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {data.unit}
            </span>
          ) : null}
        </div>
        {data.description ? (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        ) : null}
        {data.as_of ? (
          <div className="text-xs text-muted-foreground">
            As of {formatTimestamp(data.as_of)}
          </div>
        ) : null}
      </div>
    </PrimitiveFrame>
  );
}

export function MetricGroup({
  data,
  title = "Metrics",
  meta,
}: {
  data: MetricGroupArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.metrics.map((metric, index) => (
          <div
            key={`${metric.label}:${index}`}
            className="rounded-md border bg-neutral-50 p-3"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </div>
            <div className="mt-1 text-xl font-semibold">
              {metric.value}
              {metric.unit ? (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              ) : null}
            </div>
            {metric.description ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {metric.description}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PrimitiveFrame>
  );
}

function EntityIdentity({
  entity,
  resolveEntityHref,
}: {
  entity: ExperienceEntityRef;
  resolveEntityHref?: EntityHrefResolver;
}) {
  const href = resolveEntityHref?.(entity) ?? null;
  const body = (
    <>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {entity.entity_type}
      </div>
      <div className="mt-1 font-medium">
        {entity.title ?? entity.entity_id}
      </div>
      {entity.source_reference ? (
        <code className="mt-1 block text-xs text-muted-foreground">
          {entity.source_reference}
        </code>
      ) : null}
    </>
  );
  return href ? (
    <Link href={href} className="block hover:underline">
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

export function EntityCard({
  data,
  title,
  meta,
  resolveEntityHref,
}: {
  data: EntityCardArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
  resolveEntityHref?: EntityHrefResolver;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      <div className="space-y-4">
        <EntityIdentity
          entity={data.entity}
          resolveEntityHref={resolveEntityHref}
        />
        {Object.keys(data.fields).length ? (
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {Object.entries(data.fields).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">
                  {humanize(key)}
                </dt>
                <dd className="text-sm font-medium">
                  {renderScalar(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </PrimitiveFrame>
  );
}

export function EntityList({
  data,
  title = "Records",
  meta,
  resolveEntityHref,
}: {
  data: EntityListArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
  resolveEntityHref?: EntityHrefResolver;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      {data.items.length ? (
        <div className="divide-y rounded-md border">
          {data.items.map((entity) => {
            const href = resolveEntityHref?.(entity) ?? null;
            const content = (
              <div className="px-3 py-2">
                <EntityIdentity entity={entity} />
              </div>
            );
            return href ? (
              <Link
                key={`${entity.entity_type}:${entity.entity_id}`}
                href={href}
                className="block transition-colors hover:bg-neutral-50"
              >
                {content}
              </Link>
            ) : (
              <div key={`${entity.entity_type}:${entity.entity_id}`}>
                {content}
              </div>
            );
          })}
        </div>
      ) : (
        <ReadPrimitiveState
          state="EMPTY"
          message={data.empty_message ?? undefined}
        />
      )}
    </PrimitiveFrame>
  );
}

export function DataTable({
  data,
  title = "Data",
  meta,
}: {
  data: DataTableArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      {data.rows.length ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                {data.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-b-0">
                  {data.columns.map((column) => (
                    <td key={column.key} className="px-3 py-2 align-top">
                      {renderScalar(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ReadPrimitiveState state="EMPTY" />
      )}
    </PrimitiveFrame>
  );
}

export function Timeline({
  data,
  title = "Timeline",
  meta,
  resolveEntityHref,
}: {
  data: TimelineArtifactData;
  title?: string;
  meta?: ReadPrimitiveMeta;
  resolveEntityHref?: EntityHrefResolver;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      {data.items.length ? (
        <ol className="space-y-4">
          {data.items.map((item, index) => (
            <li
              key={`${item.occurred_at}:${item.label}:${index}`}
              className="relative border-l pl-4"
            >
              <div className="text-xs text-muted-foreground">
                {formatTimestamp(item.occurred_at)}
              </div>
              <div className="mt-1 text-sm font-medium">{item.label}</div>
              {item.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              {item.entity ? (
                <div className="mt-2 text-xs">
                  <EntityIdentity
                    entity={item.entity}
                    resolveEntityHref={resolveEntityHref}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <ReadPrimitiveState state="EMPTY" />
      )}
    </PrimitiveFrame>
  );
}

function Notice({
  title,
  code,
  message,
  meta,
  children,
}: {
  title: string;
  code: string;
  message: string;
  meta?: ReadPrimitiveMeta;
  children?: ReactNode;
}) {
  return (
    <PrimitiveFrame title={title} meta={meta}>
      <div className="space-y-2 text-sm">
        <code className="text-xs text-muted-foreground">{code}</code>
        <p>{message}</p>
        {children}
      </div>
    </PrimitiveFrame>
  );
}

export function WarningBlock({
  data,
  meta,
}: {
  data: WarningArtifactData;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <Notice
      title={data.severity === "INFO" ? "Notice" : "Warning"}
      code={data.code}
      message={data.message}
      meta={meta}
    />
  );
}

export function ConflictBlock({
  data,
  meta,
}: {
  data: ConflictArtifactData;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <Notice
      title="Conflicting evidence"
      code="CONFLICT"
      message={data.message}
      meta={meta}
    >
      <div className="text-xs text-muted-foreground">
        Evidence: {data.evidence_ids.join(" · ")}
      </div>
    </Notice>
  );
}

export function ErrorBlock({
  data,
  meta,
}: {
  data: ErrorArtifactData;
  meta?: ReadPrimitiveMeta;
}) {
  return (
    <Notice
      title="Unable to render result"
      code={data.code}
      message={data.message}
      meta={meta}
    >
      {data.retryable ? (
        <div className="text-xs text-muted-foreground">
          This result may succeed if retried.
        </div>
      ) : null}
    </Notice>
  );
}
