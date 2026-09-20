"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  acceptPublicAcceptance,
  getPublicAcceptance,
  rejectPublicAcceptance,
  type PublicAcceptance,
} from "@/features/public/api";

export function PublicAcceptanceView({ token }: { token: string }) {
  const [acceptance, setAcceptance] = useState<PublicAcceptance | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicAcceptance(token)
      .then((value) => {
        if (active) setAcceptance(value);
      })
      .catch((reasonValue: unknown) => {
        if (active) {
          setError(
            reasonValue instanceof Error
              ? reasonValue.message
              : "Unable to load this acceptance request.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function onAccept() {
    setBusy(true);
    setError(null);
    try {
      setAcceptance(await acceptPublicAcceptance(token, customerName));
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "Unable to accept.");
    } finally {
      setBusy(false);
    }
  }

  async function onReject(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setAcceptance(await rejectPublicAcceptance(token, reason, customerName));
      setMode("idle");
    } catch (reasonValue) {
      setError(reasonValue instanceof Error ? reasonValue.message : "Unable to reject.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !acceptance) {
    return <PublicError message={error} />;
  }

  if (!acceptance) {
    return <PublicShell>Loading acceptance request…</PublicShell>;
  }

  const decided = acceptance.status !== "PENDING";

  return (
    <PublicShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Milestone acceptance
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {acceptance.milestone_name}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {acceptance.merchant_name} · {acceptance.project_name}
          </div>
        </div>
        <Badge>{acceptance.status}</Badge>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          {acceptance.milestone_description ? (
            <p className="text-sm">{acceptance.milestone_description}</p>
          ) : null}

          {acceptance.deliverables ? (
            <section className="mt-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deliverables
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{acceptance.deliverables}</p>
            </section>
          ) : null}

          <div className="mt-5 text-xs text-muted-foreground">
            Submitted {new Date(acceptance.submitted_at).toLocaleString()}
          </div>

          {!decided ? (
            <div className="mt-6 border-t pt-5">
              <label className="text-sm font-medium" htmlFor="customer-name">
                Your name <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="customer-name"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                maxLength={200}
                onChange={(event) => setCustomerName(event.target.value)}
                value={customerName}
              />

              {mode === "reject" ? (
                <form className="mt-4" onSubmit={onReject}>
                  <label className="text-sm font-medium" htmlFor="rejection-reason">
                    Reason for rejection
                  </label>
                  <textarea
                    id="rejection-reason"
                    className="mt-2 min-h-28 w-full rounded-md border bg-background p-3 text-sm"
                    maxLength={2000}
                    onChange={(event) => setReason(event.target.value)}
                    required
                    value={reason}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button loading={busy} type="submit">Submit rejection</Button>
                    <Button
                      disabled={busy}
                      onClick={() => setMode("idle")}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Button loading={busy} onClick={onAccept}>Accept milestone</Button>
                  <Button
                    disabled={busy}
                    onClick={() => setMode("reject")}
                    variant="secondary"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border p-4 text-sm">
              This acceptance request is {acceptance.status.toLowerCase()}.
            </div>
          )}

          {error ? <div className="mt-4 text-sm text-critical">{error}</div> : null}
        </CardContent>
      </Card>
    </PublicShell>
  );
}

function PublicError({ message }: { message: string }) {
  return (
    <PublicShell>
      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium">This acceptance link is unavailable.</div>
          <div className="mt-2 text-sm text-muted-foreground">{message}</div>
        </CardContent>
      </Card>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <div className="text-center text-sm font-semibold">Ondar</div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
