"use client";
// Display-only — BE is authority (COMPONENTS.md, DESIGN-TOKENS.md)
export function useEntitlement(_code: string) {
  return { allowed: true, remaining: 100, limit: 100, used: 0 };
}
