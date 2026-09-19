"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPublic } from "@/lib/api-client";

export type PublicAcceptance = {
  merchant_name: string;
  project_name: string;
  milestone_name: string;
  milestone_description?: string | null;
  completed_at?: string | null;
  deliverables?: string | null;
  submitted_at: string;
  status: string;
  decided_at?: string | null;
  expires_at?: string | null;
};

type Props = {
  initialAcceptance: PublicAcceptance;
  acceptUrl: string;
  rejectUrl: string;
};

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusVariant(
  status: string,
): "success" | "critical" | "warning" | "neutral" {
  if (status === "ACCEPTED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "critical";
  if (status === "PENDING") return "warning";
  return "neutral";
}

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  return "We could not record your decision. Please try again.";
}

export function AcceptanceCard({
  initialAcceptance,
  acceptUrl,
  rejectUrl,
}: Props) {
  const [acceptance, setAcceptance] = useState(initialAcceptance);
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "ACCEPT" | "REJECT" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const isPending = acceptance.status === "PENDING";

  async function decide(action: "ACCEPT" | "REJECT") {
    if (action === "REJECT" && !reason.trim()) {
      setError("Please give a reason before rejecting this milestone.");
      return;
    }

    setPendingAction(action);
    setError(null);

    const response = await fetchPublic(
      action === "ACCEPT" ? acceptUrl : rejectUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "ACCEPT"
            ? { customer_name: customerName.trim() || null }
            : {
                customer_name: customerName.trim() || null,
                reason: reason.trim(),
              },
        ),
      },
    );

    if (!response.ok) {
      setError(await readError(response));
      setPendingAction(null);
      return;
    }

    setAcceptance((await response.json()) as PublicAcceptance);
    setPendingAction(null);
  }

  const completedAt = formatDateTime(acceptance.completed_at);
  const submittedAt = formatDateTime(acceptance.submitted_at);
  const decidedAt = formatDateTime(acceptance.decided_at);
  const expiresAt = formatDateTime(acceptance.expires_at);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Customer acceptance
            </div>
            <h1 className="mt-1 text-xl font-semibold">
              {acceptance.milestone_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {acceptance.project_name} · {acceptance.merchant_name}
            </p>
          </div>
          <Badge variant={statusVariant(acceptance.status)}>
            {acceptance.status.replaceAll("_", " ")}
          </Badge>
        </div>

        {acceptance.milestone_description ? (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Milestone
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {acceptance.milestone_description}
            </p>
          </section>
        ) : null}

        {acceptance.deliverables ? (
          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deliverables submitted
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm">
              {acceptance.deliverables}
            </p>
          </section>
        ) : null}

        <dl className="mt-6 grid gap-3 rounded-lg border bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          {completedAt ? (
            <div>
              <dt className="text-muted-foreground">Completed</dt>
              <dd>{completedAt}</dd>
            </div>
          ) : null}
          {submittedAt ? (
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{submittedAt}</dd>
            </div>
          ) : null}
          {expiresAt ? (
            <div>
              <dt className="text-muted-foreground">Decision link expires</dt>
              <dd>{expiresAt}</dd>
            </div>
          ) : null}
          {decidedAt ? (
            <div>
              <dt className="text-muted-foreground">Decided</dt>
              <dd>{decidedAt}</dd>
            </div>
          ) : null}
        </dl>

        {isPending ? (
          <section className="mt-6 border-t pt-6">
            <h2 className="font-semibold">Your decision</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the milestone and submitted deliverables before responding.
            </p>

            <label className="mt-4 block text-sm font-medium" htmlFor="customer-name">
              Your name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="customer-name"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={200}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />

            <label className="mt-4 block text-sm font-medium" htmlFor="rejection-reason">
              Reason if rejecting
            </label>
            <textarea
              id="rejection-reason"
              className="mt-1 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what needs to change before you can accept."
            />

            {error ? (
              <div
                className={
                  "mt-3 rounded-md border border-critical/20 bg-critical-subtle " +
                  "p-3 text-sm text-critical"
                }
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                loading={pendingAction === "ACCEPT"}
                disabled={pendingAction !== null}
                onClick={() => void decide("ACCEPT")}
              >
                Accept milestone
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                loading={pendingAction === "REJECT"}
                disabled={pendingAction !== null || !reason.trim()}
                onClick={() => void decide("REJECT")}
              >
                Reject with reason
              </Button>
            </div>
          </section>
        ) : (
          <div className="mt-6 rounded-lg border bg-neutral-50 p-4 text-sm">
            This milestone has already been {acceptance.status.toLowerCase()}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
