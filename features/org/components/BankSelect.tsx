"use client";

import { useMemo, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { NIGERIAN_BANKS_DEDUPED } from "../banks";

type Props = {
  value: string; // bank_code
  onChange: (code: string, name: string) => void;
  error?: string;
  disabled?: boolean;
};

export function BankSelect({ value, onChange, error, disabled }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return NIGERIAN_BANKS_DEDUPED;
    return NIGERIAN_BANKS_DEDUPED.filter(
      (b) => b.name.toLowerCase().includes(needle) || b.code.includes(needle)
    );
  }, [q]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="bank-search">Bank</Label>
      <Input
        id="bank-search"
        placeholder="Search bank — e.g. GTBank, Access, Zenith"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
        aria-label="Search bank"
      />
      <div className="rounded-md border bg-surface max-h-48 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">No bank matches “{q}”.</div>
        ) : (
          <div role="listbox" aria-label="Bank list">
            {filtered.map((b) => {
              const active = b.code === value;
              return (
                <button
                  key={b.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => onChange(b.code, b.name)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none ${
                    active ? "bg-neutral-100 font-medium" : ""
                  }`}
                >
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{b.code}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {value ? (
        <p className="text-xs text-muted-foreground">
          Selected: {NIGERIAN_BANKS_DEDUPED.find((b) => b.code === value)?.name ?? value} ({value})
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-critical">
          {error}
        </p>
      ) : null}
    </div>
  );
}
