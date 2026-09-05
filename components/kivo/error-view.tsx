"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mapErrorCode, type ErrorCategory } from "@/lib/error-codes";

export interface ErrorAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export interface ErrorViewProps {
  code?: string;
  title?: string;
  description?: string;
  category?: ErrorCategory;
  requestId?: string;
  action?: ErrorAction;
  secondaryAction?: ErrorAction;
  onRetry?: () => void;
  className?: string;
}

function ErrorIcon({ category }: { category?: ErrorCategory }) {
  if (category === "forbidden" || category === "auth") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-subtle text-warning border border-warning/20">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
    );
  }

  if (category === "not_found") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
    );
  }

  if (category === "rate_limited") {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info-subtle text-info border border-info/20">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  }

  // Default critical / server / provider error icon
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-critical-subtle text-critical border border-critical/20">
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    </div>
  );
}

export function ErrorView({
  code,
  title,
  description,
  category,
  requestId,
  action,
  secondaryAction,
  onRetry,
  className,
}: ErrorViewProps) {
  // If code is provided, hydrate from authoritative mapping
  const mapped = code ? mapErrorCode(code, undefined, description) : null;
  const displayTitle = title || mapped?.title || "Something went wrong";
  const displayDescription =
    description || mapped?.description || "An unexpected error occurred. Please try again.";
  const displayCategory = category || mapped?.category || "server";

  const handleCopyRequestId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    toast.success("Request ID copied to clipboard");
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border bg-surface p-8 text-center max-w-[560px] mx-auto shadow-subtle",
        className
      )}
    >
      <ErrorIcon category={displayCategory} />

      <div className="mt-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{displayTitle}</h2>
        {code ? (
          <Badge variant={displayCategory === "forbidden" ? "warning" : "critical"}>
            {code}
          </Badge>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-muted-foreground max-w-[44ch] text-balance">
        {displayDescription}
      </p>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button onClick={onRetry} variant="primary">
            Try again
          </Button>
        ) : action ? (
          action.href ? (
            <Link href={action.href}>
              <Button variant={action.variant || "primary"} onClick={action.onClick}>
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button variant={action.variant || "primary"} onClick={action.onClick}>
              {action.label}
            </Button>
          )
        ) : null}

        {secondaryAction ? (
          secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <Button
                variant={secondaryAction.variant || "secondary"}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant={secondaryAction.variant || "secondary"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )
        ) : null}
      </div>

      {/* Support correlation / Request ID */}
      {requestId ? (
        <div className="mt-6 pt-4 border-t w-full flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <span className="font-mono truncate max-w-[280px]">Ref: {requestId}</span>
          <button
            type="button"
            onClick={handleCopyRequestId}
            className="text-xs text-foreground font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
          >
            Copy Request ID
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Specialized Reusable States ───────────────────────────────────────────────

export function NotFoundState({
  title = "Page or resource not found",
  description = "The requested resource could not be found or you do not have permission to view it.",
  dashboardHref = "/app/dashboard",
}: {
  title?: string;
  description?: string;
  dashboardHref?: string;
}) {
  return (
    <ErrorView
      category="not_found"
      title={title}
      description={description}
      action={{ label: "Back to dashboard", href: dashboardHref, variant: "primary" }}
      secondaryAction={{ label: "Switch workspace", href: "/app/dashboard", variant: "secondary" }}
    />
  );
}

export function ForbiddenState({
  title = "Access restricted",
  description = "You don't have access to this workspace. Please contact the workspace owner or switch accounts.",
  contactHref,
}: {
  title?: string;
  description?: string;
  contactHref?: string;
}) {
  return (
    <ErrorView
      category="forbidden"
      title={title}
      description={description}
      action={{ label: "Back to dashboard", href: "/app/dashboard", variant: "primary" }}
      secondaryAction={
        contactHref ? { label: "Contact owner", href: contactHref, variant: "secondary" } : undefined
      }
    />
  );
}

export function RateLimitedState({
  retryAfterSeconds,
  onRetry,
}: {
  retryAfterSeconds?: number;
  onRetry?: () => void;
}) {
  return (
    <ErrorView
      category="rate_limited"
      code="RATE_LIMITED"
      title="Too many requests"
      description={
        retryAfterSeconds
          ? `You have exceeded the rate limit. Please wait ${retryAfterSeconds} seconds before trying again.`
          : "You have exceeded the temporary rate limit. Please wait a moment before trying again."
      }
      onRetry={onRetry}
    />
  );
}

export function ExpiredLinkState({
  title = "Link expired",
  description = "This invoice or verification link is no longer valid or has expired. Please contact the sender for an updated link.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <ErrorView
      category="not_found"
      code="TOKEN_EXPIRED"
      title={title}
      description={description}
    />
  );
}

export function ServerErrorState({
  requestId,
  onRetry,
}: {
  requestId?: string;
  onRetry?: () => void;
}) {
  return (
    <ErrorView
      category="server"
      code="INTERNAL_ERROR"
      title="Something went wrong"
      description="We encountered an unexpected error processing your request. Please try again."
      requestId={requestId}
      onRetry={onRetry}
      secondaryAction={{ label: "Back to dashboard", href: "/app/dashboard", variant: "secondary" }}
    />
  );
}
