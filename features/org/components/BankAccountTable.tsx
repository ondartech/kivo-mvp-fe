"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBadge } from "./VerificationBadge";
import type { BankAccount } from "../api";

type Props = {
  accounts: BankAccount[];
  isLoading?: boolean;
  onVerify: (id: string) => void;
  verifyingId: string | null;
  onSetDefault: (id: string) => void;
  settingDefaultId: string | null;
  onDeactivate: (account: BankAccount) => void;
  canMutate: boolean;
};

export function BankAccountTable({
  accounts,
  isLoading,
  onVerify,
  verifyingId,
  onSetDefault,
  settingDefaultId,
  onDeactivate,
  canMutate,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (accounts.length === 0) return null;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border overflow-hidden bg-surface">
        <div className="grid grid-cols-12 gap-4 bg-neutral-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="col-span-3">Bank</span>
          <span className="col-span-3">Account</span>
          <span className="col-span-2">Verification</span>
          <span className="col-span-1">Default</span>
          <span className="col-span-3 text-right">Actions</span>
        </div>
        <div className="divide-y">
          {accounts.map((a) => (
            <div key={a.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm">
              <div className="col-span-3">
                <div className="font-medium">{a.bank_name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{a.bank_code}</div>
              </div>
              <div className="col-span-3">
                <div className="font-mono text-sm tabular-nums">{a.account_number_masked}</div>
                <div className="text-xs text-muted-foreground truncate">{a.account_name}</div>
              </div>
              <div className="col-span-2">
                <VerificationBadge status={a.verification_status} matchType={a.verification_match_type} />
                {a.verified_at ? (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(a.verified_at).toLocaleDateString()}
                  </div>
                ) : null}
              </div>
              <div className="col-span-1">
                {a.is_default ? <Badge variant="success">Default</Badge> : <span className="text-xs text-muted-foreground">—</span>}
              </div>
              <div className="col-span-3 flex items-center justify-end gap-1.5">
                {canMutate ? (
                  <>
                    {(a.verification_status === "UNVERIFIED" || a.verification_status === "MISMATCH") && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={verifyingId === a.id}
                        onClick={() => onVerify(a.id)}
                        aria-label={`Verify ${a.account_number_masked}`}
                      >
                        Verify
                      </Button>
                    )}
                    {!a.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={settingDefaultId === a.id}
                        onClick={() => onSetDefault(a.id)}
                      >
                        Set default
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onDeactivate(a)} aria-label={`Deactivate ${a.account_number_masked}`}>
                      Deactivate
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Read only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile card stack ≤375px+ (hidden md) */}
      <div className="md:hidden space-y-3">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-lg border bg-surface p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-medium">{a.bank_name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{a.bank_code}</div>
              </div>
              <VerificationBadge status={a.verification_status} matchType={a.verification_match_type} />
            </div>
            <div>
              <div className="font-mono text-sm tabular-nums">{a.account_number_masked}</div>
              <div className="text-xs text-muted-foreground truncate">{a.account_name}</div>
            </div>
            <div className="flex items-center gap-2">
              {a.is_default ? <Badge variant="success">Default</Badge> : null}
              {a.verified_at ? (
                <span className="text-xs text-muted-foreground">Verified {new Date(a.verified_at).toLocaleDateString()}</span>
              ) : null}
            </div>
            {canMutate && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(a.verification_status === "UNVERIFIED" || a.verification_status === "MISMATCH") && (
                  <Button size="sm" variant="outline" loading={verifyingId === a.id} onClick={() => onVerify(a.id)}>
                    Verify
                  </Button>
                )}
                {!a.is_default && (
                  <Button size="sm" variant="ghost" loading={settingDefaultId === a.id} onClick={() => onSetDefault(a.id)}>
                    Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDeactivate(a)}>
                  Deactivate
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
