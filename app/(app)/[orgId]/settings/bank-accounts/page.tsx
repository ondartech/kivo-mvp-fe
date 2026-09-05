"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/kivo/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/kivo/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BankAccountTable } from "@/features/org/components/BankAccountTable";
import { AddAccountDialog } from "@/features/org/components/AddAccountDialog";
import { SettlementCard } from "@/features/org/components/SettlementCard";
import { useMyMembership } from "@/features/team/api";
import {
  useBankAccounts,
  useDeactivateBankAccount,
  useMerchantPaymentSettings,
  usePutMerchantPaymentSettings,
  useSetDefaultBankAccount,
  useVerifyBankAccount,
  type BankAccount,
  type ApiError,
} from "@/features/org/api";

function errCode(e: unknown): string | undefined {
  return (e as ApiError)?.code;
}
function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export default function PayoutAccountsPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId as string;

  const { role } = useMyMembership(orgId);
  // org:write currently OWNER — derive from BE contract, hide mutate for others
  const canMutate = role === "OWNER";

  const accountsQ = useBankAccounts(orgId);
  const settingsQ = useMerchantPaymentSettings(orgId);
  const verifyMut = useVerifyBankAccount(orgId);
  const setDefaultMut = useSetDefaultBankAccount(orgId);
  const deactivateMut = useDeactivateBankAccount(orgId);
  const putSettingsMut = usePutMerchantPaymentSettings(orgId);

  const [showAdd, setShowAdd] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BankAccount | null>(null);

  const accounts = accountsQ.data ?? [];
  const isSettlementAccount =
    deactivateTarget && settingsQ.data?.settlement_bank_account_id === deactivateTarget.id;

  const onVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await verifyMut.mutateAsync(id);
      if (res.verification_status === "VERIFIED") {
        toast.success(`Verified — ${res.resolved_account_name} (${res.verification_match_type})`);
      } else {
        toast.error(`Mismatch — bank returned “${res.resolved_account_name}”. Check account name vs business profile.`);
      }
    } catch (e) {
      const code = errCode(e);
      if (code === "RATE_LIMITED") toast.error(errMessage(e, "Too many verification attempts — try again shortly."));
      else if (code === "PROVIDER_UNAVAILABLE" || (e as ApiError)?.status === 503)
        toast.error("Verification service temporarily unavailable — try again shortly.");
      else if (code === "ORGANIZATION_NOT_FOUND") toast.error("Workspace not found.");
      else if (code === "FORBIDDEN" || (e as ApiError)?.status === 403) toast.error("You don’t have access to verify accounts.");
      else toast.error(errMessage(e, "Verification failed."));
    } finally {
      setVerifyingId(null);
    }
  };

  const onSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefaultMut.mutateAsync(id);
      toast.success("Default payout account updated.");
    } catch (e) {
      toast.error(errMessage(e, "Could not set default."));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const onConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    const isSettlement = settingsQ.data?.settlement_bank_account_id === target.id;

    try {
      // Coordinated workflow per decision #4: clear settlement first if needed
      if (isSettlement) {
        const enabled = settingsQ.data?.enabled ?? false;
        try {
          await putSettingsMut.mutateAsync({ enabled, settlement_bank_account_id: null });
          toast.success("Settlement cleared — account no longer used for online payments.");
        } catch (e) {
          toast.error(errMessage(e, "Could not clear settlement. Deactivation aborted."));
          return; // abort deactivate on settlement-clear failure
        }
      }

      await deactivateMut.mutateAsync(target.id);
      toast.success(`Account ${target.account_number_masked} deactivated. History retained for audit.`);
      setDeactivateTarget(null);
    } catch (e) {
      // Handle partial failure: settlement cleared but deactivate failed — surface explicitly
      if (isSettlement) {
        toast.error(
          `${errMessage(e, "Deactivation failed")} — settlement was cleared. Retry deactivation. Request ID: ${(e as ApiError)?.requestId ?? "—"}`,
        );
      } else {
        toast.error(errMessage(e, "Could not deactivate account."));
      }
    }
  };

  // Loading
  if (accountsQ.isLoading || settingsQ.isLoading) {
    return (
      <div className="space-y-6 max-w-[960px]">
        <PageHeader title="Payout Accounts" description="Bank destinations for payouts. Verified accounts can receive online-payment settlements." />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error — tenant isolation 404, auth 403 etc mapped per FRONTEND_SPEC:0.3
  if (accountsQ.isError) {
    const code = errCode(accountsQ.error);
    const msg = errMessage(accountsQ.error, "Could not load payout accounts.");
    if (code === "ORGANIZATION_NOT_FOUND") {
      return (
        <div className="space-y-6 max-w-[960px]">
          <PageHeader title="Payout Accounts" />
          <ErrorState title="Workspace not found" description="This organization does not exist or you are not a member." />
        </div>
      );
    }
    if (code === "FORBIDDEN" || (accountsQ.error as ApiError)?.status === 403) {
      return (
        <div className="space-y-6 max-w-[960px]">
          <PageHeader title="Payout Accounts" />
          <ErrorState title="You don’t have access" description={msg} retry={{ label: "Retry", onClick: () => accountsQ.refetch() }} />
        </div>
      );
    }
    return (
      <div className="space-y-6 max-w-[960px]">
        <PageHeader title="Payout Accounts" />
        <ErrorState title="Could not load payout accounts" description={msg} retry={{ label: "Retry", onClick: () => accountsQ.refetch() }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[960px]">
      <PageHeader
        title="Payout Accounts"
        description="Manage bank destinations. Accounts are masked (••••6789) and encrypted at rest. Only verified accounts can be selected for settlement."
        actions={
          canMutate ? (
            <Button onClick={() => setShowAdd(true)}>Add payout account</Button>
          ) : (
            <span className="text-xs text-muted-foreground">Read only — only workspace owners can manage payout accounts.</span>
          )
        }
      />

      {!canMutate && accounts.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You have read access to masked payout accounts. Contact a workspace owner to add, verify, or change settlement.
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <EmptyState
          title="No payout accounts yet"
          description="Add your bank account to receive settlements. Your account number is encrypted at rest and always shown masked."
          action={canMutate ? { label: "Add payout account", onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <BankAccountTable
          accounts={accounts}
          onVerify={onVerify}
          verifyingId={verifyingId}
          onSetDefault={onSetDefault}
          settingDefaultId={settingDefaultId}
          onDeactivate={(a) => setDeactivateTarget(a)}
          canMutate={canMutate}
        />
      )}

      {/* Settlement — minimal integration, decision #4 */}
      <SettlementCard orgId={orgId} accounts={accounts} settings={settingsQ.data ?? null} isLoading={settingsQ.isLoading} />

      {/* Add dialog — mutation-scoped idempotency inside hook */}
      {canMutate ? <AddAccountDialog orgId={orgId} open={showAdd} onOpenChange={setShowAdd} /> : null}

      {/* Deactivate confirm — coordinated with settlement per decision #4 */}
      <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogHeader>
          <DialogTitle>Deactivate {deactivateTarget?.account_number_masked}?</DialogTitle>
          <DialogDescription>
            This will deactivate the account. History is retained for audit (7 years, BANK_ACCOUNT_DATA). Payouts will no longer use this account.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          {isSettlementAccount ? (
            <Card className="border-critical/20 bg-critical-subtle">
              <CardContent className="p-3 text-sm">
                <div className="font-medium text-critical">Settlement account warning</div>
                <p className="text-sm text-critical/90 mt-1">
                  This account is currently your <strong>settlement account</strong> for online payments (
                  <code className="text-xs bg-white px-1 py-0.5 rounded border">settlement_bank_account_id</code>). Deactivating it will first
                  clear your settlement configuration. This is two separate operations — if clearing succeeds but deactivation fails, settlement
                  will remain cleared and you can retry deactivation.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <div className="text-sm text-muted-foreground">
            Bank: {deactivateTarget?.bank_name} ({deactivateTarget?.bank_code}) · {deactivateTarget?.account_number_masked} · {deactivateTarget?.account_name}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDeactivateTarget(null)} disabled={deactivateMut.isPending || putSettingsMut.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={deactivateMut.isPending || putSettingsMut.isPending}
            onClick={onConfirmDeactivate}
          >
            {isSettlementAccount ? "Clear settlement & deactivate" : "Deactivate"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
