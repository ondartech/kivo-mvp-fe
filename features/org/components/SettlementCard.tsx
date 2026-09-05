"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { BankAccount, MerchantPaymentSettings } from "../api";
import { usePutMerchantPaymentSettings } from "../api";
import type { ApiError } from "../api";

type Props = {
  orgId: string;
  accounts: BankAccount[];
  settings: MerchantPaymentSettings | null;
  isLoading?: boolean;
};

export function SettlementCard({ orgId, accounts, settings, isLoading }: Props) {
  const putMut = usePutMerchantPaymentSettings(orgId);
  // Only ACTIVE + VERIFIED are eligible per BE (service.py:227)
  const eligible = accounts.filter((a) => a.status === "ACTIVE" && a.verification_status === "VERIFIED");
  const currentId = settings?.settlement_bank_account_id ?? null;
  const [selected, setSelected] = useState<string | null>(currentId);
  const [enabled, setEnabled] = useState<boolean>(settings?.enabled ?? false);

  useEffect(() => {
    setSelected(currentId);
  }, [currentId]);
  useEffect(() => {
    setEnabled(settings?.enabled ?? false);
  }, [settings?.enabled]);

  const onSave = async () => {
    const payload = {
      enabled,
      settlement_bank_account_id: enabled ? selected : null,
    };
    try {
      // Validate BE rule: enabled requires verified account if selected
      if (enabled && selected) {
        const chosen = accounts.find((a) => a.id === selected);
        if (!chosen || chosen.verification_status !== "VERIFIED" || chosen.status !== "ACTIVE") {
          toast.error("Settlement account must be an active, verified account.");
          return;
        }
      }
      await putMut.mutateAsync(payload as { enabled: boolean; settlement_bank_account_id: string | null });
      toast.success(enabled ? "Payout settlement updated." : "Online payments disabled.");
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "BANK_NOT_VERIFIED") toast.error("Settlement account must be verified first.");
      else if (err.code === "BANK_ACCOUNT_NOT_FOUND") toast.error("Selected account not found.");
      else toast.error(err.message ?? "Could not update settlement settings.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement account</CardTitle>
        <CardDescription>
          Choose which verified payout account receives online-payment settlements. Payout Accounts is the user-facing name; domain term is{" "}
          <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">settlement_bank_account_id</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={isLoading || putMut.isPending}
          />
          Enable online payments (settlement to selected account)
        </label>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Settlement account</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            disabled={!enabled || isLoading || putMut.isPending}
            aria-label="Settlement account"
          >
            <option value="">— Select verified account —</option>
            {eligible.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank_name} — {a.account_number_masked} {a.is_default ? "(Default)" : ""} — {a.account_name}
              </option>
            ))}
          </select>
          {eligible.length === 0 ? (
            <p className="text-xs text-muted-foreground">No verified accounts yet. Verify an account to enable settlement.</p>
          ) : null}
          {enabled && !selected ? (
            <p className="text-xs text-amber-700">Select a verified account to complete payout configuration.</p>
          ) : null}
          {settings?.onboarding_status ? (
            <p className="text-xs text-muted-foreground">Onboarding: {settings.onboarding_status} · Provider: {settings.default_provider}</p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} loading={putMut.isPending} disabled={isLoading}>
            Save settlement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
