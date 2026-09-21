import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isSafeAppHref,
  isWorkspaceLikeHref,
  readPinnedWorkspaces,
  readRecentWorkspaces,
  recordRecentWorkspace,
  togglePinnedWorkspace,
  workspaceTitleFromHref,
} from "@/lib/experience/shell-continuity";

const organizationId = "11111111-1111-4111-8111-111111111111";

function installStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe("FE-018 shell continuity", () => {
  beforeEach(() => {
    installStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T08:00:00+01:00"));
  });

  it("accepts only internal app routes", () => {
    expect(isSafeAppHref("/app/invoices")).toBe(true);
    expect(isSafeAppHref("/app/invoices/123")).toBe(true);
    expect(isSafeAppHref("https://attacker.example/app/invoices")).toBe(false);
    expect(isSafeAppHref("/app//evil")).toBe(false);
    expect(isSafeAppHref("/public/invoice/123")).toBe(false);
  });

  it("keeps Experience/admin routes out of workspace continuity", () => {
    expect(isWorkspaceLikeHref("/app/invoices")).toBe(true);
    expect(isWorkspaceLikeHref("/app/customers/abc")).toBe(true);
    expect(isWorkspaceLikeHref("/app/ask")).toBe(false);
    expect(isWorkspaceLikeHref("/app/search")).toBe(false);
    expect(isWorkspaceLikeHref("/app/attention")).toBe(false);
    expect(isWorkspaceLikeHref("/app/settings/business")).toBe(false);
  });

  it("stores recent work per organization and deduplicates by href", () => {
    recordRecentWorkspace(organizationId, "/app/invoices");
    vi.setSystemTime(new Date("2026-09-21T08:01:00+01:00"));
    recordRecentWorkspace(organizationId, "/app/customers");
    vi.setSystemTime(new Date("2026-09-21T08:02:00+01:00"));
    recordRecentWorkspace(organizationId, "/app/invoices");

    expect(readRecentWorkspaces(organizationId).map((item) => item.href)).toEqual([
      "/app/invoices",
      "/app/customers",
    ]);
    expect(readRecentWorkspaces("22222222-2222-4222-8222-222222222222")).toEqual(
      [],
    );
  });

  it("pins and unpins deterministic workspaces without storing business data", () => {
    const pinned = togglePinnedWorkspace(
      organizationId,
      "/app/invoices/33333333-3333-4333-8333-333333333333",
    );

    expect(pinned).toHaveLength(1);
    expect(pinned[0]).toEqual({
      href: "/app/invoices/33333333-3333-4333-8333-333333333333",
      title: "Invoices · 33333333…",
      visitedAt: "2026-09-21T07:00:00.000Z",
    });

    expect(
      togglePinnedWorkspace(
        organizationId,
        "/app/invoices/33333333-3333-4333-8333-333333333333",
      ),
    ).toEqual([]);
  });

  it("drops poisoned localStorage entries on read", () => {
    localStorage.setItem(
      `ondar:experience:recent-work:${organizationId}`,
      JSON.stringify([
        {
          href: "https://attacker.example",
          title: "Unsafe",
          visitedAt: "2026-09-21T07:00:00.000Z",
        },
        {
          href: "/app/receivables",
          title: "Receivables",
          visitedAt: "2026-09-21T07:00:00.000Z",
        },
      ]),
    );

    expect(readRecentWorkspaces(organizationId)).toEqual([
      {
        href: "/app/receivables",
        title: "Receivables",
        visitedAt: "2026-09-21T07:00:00.000Z",
      },
    ]);
  });

  it("derives display names from route metadata only", () => {
    expect(workspaceTitleFromHref("/app/receivables")).toBe("Receivables");
    expect(
      workspaceTitleFromHref(
        "/app/invoices/33333333-3333-4333-8333-333333333333",
      ),
    ).toBe("Invoices · 33333333…");
  });
});
