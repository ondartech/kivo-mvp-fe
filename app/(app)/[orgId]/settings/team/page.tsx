"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { toast } from "sonner";
import {
  useInvites,
  useInviteMember,
  useMembers,
  useMyMembership,
  usePatchRole,
  useRemoveMember,
  useSuspendMember,
  type ApiError,
  type MemberRole,
} from "@/features/team/api";
import { inviteSchema, type InviteInput } from "@/features/team/schema";
import {
  INVITABLE_ROLES,
  canChangeRole,
  canInvite,
  canSuspendRemove,
  roleBadge,
  statusBadge,
} from "@/features/team/permissions";

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function errCode(e: unknown): string | undefined {
  return (e as ApiError)?.code;
}

export default function TeamSettingsPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId as string;
  const { role: myRole, isLoading: meLoading } = useMyMembership(orgId);
  const members = useMembers(orgId);
  const invites = useInvites(orgId);
  const [showInvite, setShowInvite] = useState(false);
  const [rowAlert, setRowAlert] = useState<{ id: string; message: string } | null>(null);

  const inviteMut = useInviteMember(orgId);
  const patchMut = usePatchRole(orgId);
  const suspendMut = useSuspendMember(orgId);
  const removeMut = useRemoveMember(orgId);

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  const rows = members.data?.data ?? [];
  const pending = (invites.data?.data ?? []).filter((i) => i.status === "PENDING");

  const onInvite = async (input: InviteInput) => {
    try {
      await inviteMut.mutateAsync(input);
      toast.success(`Invite sent to ${input.email}`);
      form.reset();
      setShowInvite(false);
    } catch (e: unknown) {
      const code = errCode(e);
      if (code === "INVITE_ALREADY_PENDING" || code === "ALREADY_MEMBER") {
        form.setError("email", { message: errMessage(e, "Invite failed") });
      } else {
        toast.error(errMessage(e, "Invite failed"));
      }
    }
  };

  const onRoleChange = async (membershipId: string, email: string, role: MemberRole) => {
    setRowAlert(null);
    try {
      await patchMut.mutateAsync({ membershipId, role });
      toast.success(`${email} is now ${role}`);
    } catch (e: unknown) {
      if (errCode(e) === "LAST_OWNER_GUARD") {
        setRowAlert({ id: membershipId, message: "An organization must keep one active owner." });
      } else {
        toast.error(errMessage(e, "Role change failed"));
      }
    }
  };

  const onSuspend = async (membershipId: string, email: string) => {
    if (!confirm(`Suspend ${email}? They lose organization access immediately.`)) return;
    setRowAlert(null);
    try {
      await suspendMut.mutateAsync(membershipId);
      toast.success(`${email} suspended`);
    } catch (e: unknown) {
      if (errCode(e) === "LAST_OWNER_GUARD") {
        setRowAlert({ id: membershipId, message: "An organization must keep one active owner." });
      } else {
        toast.error(errMessage(e, "Suspend failed"));
      }
    }
  };

  const onRemove = async (membershipId: string, email: string) => {
    if (!confirm(`Remove ${email}? Their history is preserved for audit.`)) return;
    setRowAlert(null);
    try {
      await removeMut.mutateAsync(membershipId);
      toast.success(`${email} removed`);
    } catch (e: unknown) {
      if (errCode(e) === "LAST_OWNER_GUARD") {
        setRowAlert({ id: membershipId, message: "An organization must keep one active owner." });
      } else {
        toast.error(errMessage(e, "Remove failed"));
      }
    }
  };

  if (meLoading || members.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Team" description="Members, roles and invitations." />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (members.isError) {
    const code = errCode(members.error);
    if (code === "ORGANIZATION_NOT_FOUND") {
      return (
        <div className="space-y-6">
          <PageHeader title="Team" />
          <ErrorState
            title="Workspace not found"
            description="This organization does not exist or you are not a member."
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <PageHeader title="Team" />
        <ErrorState
          title={code === "FORBIDDEN" ? "You don't have access" : "Could not load team"}
          description={errMessage(members.error, "An error occurred.")}
          retry={{ label: "Retry", onClick: () => members.refetch() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Member · Role · Status. Owners administer roles, suspension and removal; admins may invite."
        actions={
          canInvite(myRole ?? undefined) ? (
            <Button onClick={() => setShowInvite((v) => !v)}>Invite member</Button>
          ) : null
        }
      />

      {showInvite && canInvite(myRole ?? undefined) ? (
        <Card>
          <CardContent className="p-5">
            <form
              className="grid sm:grid-cols-[1fr_160px_auto] gap-3 items-end"
              onSubmit={form.handleSubmit(onInvite)}
            >
              <div>
                <Label>Email</Label>
                <Input
                  className="mt-1"
                  placeholder="teammate@company.ng"
                  aria-label="Invite email"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p role="alert" className="mt-1 text-xs text-critical">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-input bg-surface px-2 text-sm"
                  aria-label="Invite role"
                  {...form.register("role")}
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "ADMIN" ? "Admin" : "Member"}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" loading={inviteMut.isPending}>
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Only you"
          description="No other members yet. Invite your team to share this workspace."
          action={
            canInvite(myRole ?? undefined)
              ? { label: "Invite member", onClick: () => setShowInvite(true) }
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 bg-neutral-50 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="col-span-4">Member</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1">Joined</span>
            <span className="col-span-3"></span>
          </div>
          <div className="divide-y">
            {rows.map((m) => {
              const rb = roleBadge(m.role);
              const sb = statusBadge(m.status);
              const active = m.status === "ACTIVE";
              return (
                <div key={m.id}>
                  <div className="grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center">
                    <div className="md:col-span-4 font-medium truncate">
                      {m.user?.email ?? m.user_id.slice(0, 8)}
                    </div>
                    <div className="md:col-span-2">
                      {canChangeRole(myRole ?? undefined) && active ? (
                        <select
                          className="h-8 rounded-md border border-input bg-surface px-1 text-xs"
                          aria-label={`Role for ${m.user?.email ?? m.id}`}
                          defaultValue={m.role}
                          disabled={patchMut.isPending}
                          onChange={(e) =>
                            onRoleChange(m.id, m.user?.email ?? m.id, e.target.value as MemberRole)
                          }
                        >
                          {(["OWNER", "ADMIN", "MEMBER"] as MemberRole[]).map((r) => (
                            <option key={r} value={r}>
                              {r === "OWNER" ? "Owner" : r === "ADMIN" ? "Admin" : "Member"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={rb.variant}>{rb.label}</Badge>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </div>
                    <div className="md:col-span-1 text-xs text-muted-foreground">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </div>
                    <div className="md:col-span-3 flex gap-1 justify-end">
                      {canSuspendRemove(myRole ?? undefined) && active ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={suspendMut.isPending}
                            onClick={() => onSuspend(m.id, m.user?.email ?? m.id)}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={removeMut.isPending}
                            onClick={() => onRemove(m.id, m.user?.email ?? m.id)}
                          >
                            Remove
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {rowAlert?.id === m.id ? (
                    <div className="px-4 pb-3" role="alert">
                      <ErrorState title="Action blocked" description={rowAlert.message} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Pending invites</h2>
          <div className="rounded-lg border overflow-hidden">
            <div className="divide-y">
              {pending.map((i) => {
                const rb = roleBadge(i.role);
                const sb = statusBadge(i.status);
                return (
                  <div key={i.id} className="grid md:grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="md:col-span-5 font-medium truncate">{i.email}</div>
                    <div className="md:col-span-2">
                      <Badge variant={rb.variant}>{rb.label}</Badge>
                    </div>
                    <div className="md:col-span-2">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </div>
                    <div className="md:col-span-3 text-xs text-muted-foreground md:text-right">
                      Expires {new Date(i.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
