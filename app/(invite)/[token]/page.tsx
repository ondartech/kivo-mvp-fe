"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { useAcceptInvite, useDeclineInvite, useInviteByToken } from "@/features/team/api";
import { toast } from "sonner";

function roleBadgeVariant(role: string): "neutral" | "info" | "warning" | "success" {
  const r = (role ?? "").toUpperCase();
  if (r === "OWNER") return "warning";
  if (r === "ADMIN") return "info";
  return "neutral";
}

function formatExpires(expiresAt?: string): string {
  if (!expiresAt) return "—";
  try {
    const d = new Date(expiresAt);
    const diff = d.getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (hours <= 0) return "expired";
    if (hours < 24) return `expires in ${hours}h`;
    const days = Math.round(hours / 24);
    return `expires in ${days}d`;
  } catch {
    return expiresAt;
  }
}

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const routeToken = (params?.token as string) ?? "";
  const queryToken = search.get("token");
  const token = useMemo(() => decodeURIComponent(routeToken || queryToken || ""), [routeToken, queryToken]);

  const inviteQ = useInviteByToken(token || null);
  const acceptMut = useAcceptInvite();
  const declineMut = useDeclineInvite();
  const autoPosted = useRef(false);
  const [acceptedOrgId, setAcceptedOrgId] = useState<string | null>(null);

  // Auto-POST once when ?token= is present and invite is PENDING (dedup via ref)
  useEffect(() => {
    if (!token) return;
    if (autoPosted.current) return;
    if (!inviteQ.data) return;
    if (inviteQ.data.status !== "PENDING") return;
    // Only auto-post if the URL had ?token= (explicit token in query) and not just route param?
    // For KIV-FE-032 we auto-POST once on mount when ?token= is present — per card FR-002.
    if (!queryToken) return;
    autoPosted.current = true;
    acceptMut.mutate(
      { token, inviteId: inviteQ.data.id },
      {
        onSuccess: (res) => {
          const orgId = (res as { organization_id?: string })?.organization_id ?? inviteQ.data.organization_id;
          setAcceptedOrgId(orgId);
          toast.success("Invite accepted — welcome to Kivo");
          if (orgId) router.push(`/${orgId}/dashboard`);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, queryToken, inviteQ.data]);

  const handleAccept = () => {
    if (!token) return;
    acceptMut.mutate(
      { token, inviteId: inviteQ.data?.id },
      {
        onSuccess: (res) => {
          const orgId = (res as { organization_id?: string })?.organization_id ?? inviteQ.data?.organization_id;
          setAcceptedOrgId(orgId ?? null);
          toast.success("Invite accepted");
          if (orgId) router.push(`/${orgId}/dashboard`);
        },
        onError: (e) => {
          const code = (e as { code?: string })?.code;
          if (code === "TOKEN_EXPIRED" || code === "INVITE_EXPIRED") toast.error("Invite expired — request a new invite");
          else toast.error((e as Error)?.message ?? "Accept failed");
        },
      }
    );
  };

  const handleDecline = () => {
    if (!token) return;
    declineMut.mutate(
      { token, inviteId: inviteQ.data?.id },
      {
        onSuccess: () => {
          toast.success("Invite declined");
          router.push("/login");
        },
        onError: (e) => toast.error((e as Error)?.message ?? "Decline failed"),
      }
    );
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px]">
          <CardContent className="p-6">
            <ErrorState title="Invalid invite link" description="This invite link is missing a token. Check the link or request a new invite." />
            <div className="mt-4 flex justify-center">
              <Link href="/login">
                <Button variant="outline">Go to login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteQ.isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px]">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteQ.isError) {
    const err = inviteQ.error as { code?: string; status?: number; message?: string; requestId?: string } | null;
    const code = err?.code ?? "";
    const isExpired = code === "TOKEN_EXPIRED" || code === "INVITE_EXPIRED" || err?.status === 410;
    const isInvalid = code === "INVALID_TOKEN" || code === "INVITE_NOT_FOUND" || err?.status === 401;
    const title = isExpired ? "Invite expired" : isInvalid ? "Invalid invite link" : "Could not load invite";
    const desc = isExpired
      ? "This invite has expired. Ask your workspace owner for a new invite."
      : isInvalid
        ? "This invite link is invalid. Request a new invite from your workspace."
        : err?.message ?? "An error occurred. Please try again.";
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px]">
          <CardContent className="p-6">
            <ErrorState
              title={title}
              description={desc}
              retry={{ label: "Request new invite", onClick: () => router.push("/login") }}
            />
            {err?.requestId ? <p className="mt-3 text-xs text-muted-foreground">Request ID: {err.requestId}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  const invite = inviteQ.data;
  if (!invite) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px]">
          <CardContent className="p-6">
            <EmptyState title="Invite not found" description="This invite could not be found." />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = invite.status === "PENDING";
  const isAccepted = invite.status === "ACCEPTED" || !!acceptedOrgId;
  const role = (invite.role ?? "MEMBER").toUpperCase();

  if (isAccepted) {
    const orgId = acceptedOrgId ?? invite.organization_id;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[480px]">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success">✓</div>
            <h1 className="mt-4 text-xl font-semibold">You’re in — invite accepted</h1>
            <p className="mt-1 text-sm text-muted-foreground">You now have {role} access.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href={orgId ? `/${orgId}/dashboard` : "/dashboard"}>
                <Button>Go to dashboard</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[480px] shadow-overlay">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Badge variant={roleBadgeVariant(role)}>{role}</Badge>
            <span className="text-xs text-muted-foreground">{formatExpires(invite.expires_at)}</span>
            <span className="ml-auto text-xs text-muted-foreground">Invite</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold">You’ve been invited to Kivo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invite.email} has been invited as <span className="font-medium text-foreground">{role}</span>
            {invite.organization_name ? ` to ${invite.organization_name}` : ""}. Expires in 24h (single-use, sha256).
          </p>
          <div className="mt-4 rounded-md border bg-neutral-50 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span> {invite.email}
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span> {role}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span> {invite.status}
            </div>
          </div>

          {isPending ? (
            <div className="mt-6 flex gap-2">
              <Button onClick={handleAccept} disabled={acceptMut.isPending} className="flex-1">
                {acceptMut.isPending ? "Accepting…" : "Accept invite"}
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={declineMut.isPending} className="flex-1">
                Decline
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title={`Invite ${invite.status.toLowerCase()}`}
                description={
                  invite.status === "EXPIRED"
                    ? "This invite has expired. Request a new invite from your workspace owner."
                    : invite.status === "REVOKED"
                      ? "This invite was revoked."
                      : "This invite can no longer be accepted."
                }
                action={{ label: "Go to login", href: "/login" }}
              />
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">By accepting, you’ll be added as {role} with membership INVITED→ACTIVE.</p>
        </CardContent>
      </Card>
    </div>
  );
}
