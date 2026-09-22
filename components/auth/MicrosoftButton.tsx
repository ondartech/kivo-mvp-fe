"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

export function MicrosoftButton({
  onClick,
  loading,
  children = "Continue with Microsoft",
}: {
  onClick?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-200"
      onClick={onClick}
      loading={loading}
      aria-label="Continue with Microsoft"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <rect x="1" y="1" width="7" height="7" fill="#F25022" />
        <rect x="10" y="1" width="7" height="7" fill="#7FBA00" />
        <rect x="1" y="10" width="7" height="7" fill="#00A4EF" />
        <rect x="10" y="10" width="7" height="7" fill="#FFB900" />
      </svg>
      {children}
    </Button>
  );
}
