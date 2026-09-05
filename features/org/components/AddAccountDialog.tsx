"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BankSelect } from "./BankSelect";
import { bankAccountCreateSchema, type BankAccountCreateInput } from "../schema";
import { useAddBankAccount } from "../api";
import type { ApiError } from "../api";

type Props = {
  orgId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
};

export function AddAccountDialog({ orgId, open, onOpenChange, onCreated }: Props) {
  const addMut = useAddBankAccount(orgId);
  const form = useForm<BankAccountCreateInput>({
    resolver: zodResolver(bankAccountCreateSchema),
    defaultValues: { bank_code: "", bank_name: "", account_number: "", account_name: "", currency: "NGN", is_default: false },
  });

  const onSubmit = async (values: BankAccountCreateInput) => {
    try {
      const created = await addMut.mutateAsync(values);
      toast.success(`Account added ${created.account_number_masked} — Verify account to enable payouts.`);
      form.reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      const err = e as ApiError;
      if (err.code === "RATE_LIMITED" || err.status === 429) {
        toast.error(err.message ?? "Too many requests — try again shortly.");
      } else if (err.code === "VALIDATION_ERROR" || err.status === 400) {
        toast.error(err.message ?? "Check account details.");
      } else {
        toast.error(err.message ?? "Could not add account.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Add payout account</DialogTitle>
        <DialogDescription>Securely add the bank account where payouts should settle. We never ask for your BVN.</DialogDescription>
      </DialogHeader>
      <DialogContent>
        {/* Zero-BVN security notice — decision #2 */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3 flex gap-2.5 text-sm">
            <span className="mt-0.5 text-amber-700" aria-hidden>
              🔒
            </span>
            <div>
              <div className="font-medium text-amber-900">We never ask for your BVN</div>
              <div className="text-xs text-amber-800 mt-0.5">
                Only your 10-digit NUBAN account number is needed. Your BVN is not part of Kivo&apos;s bank-account contract and must never be shared here.
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <BankSelect
            value={form.watch("bank_code")}
            onChange={(code, name) => {
              form.setValue("bank_code", code, { shouldValidate: true });
              form.setValue("bank_name", name, { shouldValidate: true });
            }}
            error={form.formState.errors.bank_code?.message ?? form.formState.errors.bank_name?.message}
            disabled={addMut.isPending}
          />

          <div>
            <Label htmlFor="account_number">10-digit account number (NUBAN)</Label>
            <Input
              id="account_number"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="0123456789"
              className="mt-1 font-mono tabular-nums"
              aria-label="10-digit account number"
              {...form.register("account_number")}
              disabled={addMut.isPending}
            />
            {form.formState.errors.account_number ? (
              <p role="alert" className="mt-1 text-xs text-critical">
                {form.formState.errors.account_number.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="account_name">Account name (as on bank records)</Label>
            <Input
              id="account_name"
              placeholder="e.g. Maro Labs Ltd"
              className="mt-1"
              aria-label="Account name"
              {...form.register("account_name")}
              disabled={addMut.isPending}
            />
            <p className="mt-1 text-xs text-muted-foreground">Must match business name for verification to pass.</p>
            {form.formState.errors.account_name ? (
              <p role="alert" className="mt-1 text-xs text-critical">
                {form.formState.errors.account_name.message}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("is_default")} disabled={addMut.isPending} />
            Set as default payout account
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={addMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={addMut.isPending}>
              Add account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
