"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useOpenAttentionCount } from "@/features/foundation/api";
import {
  isUuid,
  readExperienceScope,
} from "@/lib/experience/ask-runtime";
import {
  isWorkspaceLikeHref,
  readPinnedWorkspaces,
  readRecentWorkspaces,
  recordRecentWorkspace,
  togglePinnedWorkspace,
  type ShellWorkspaceRef,
} from "@/lib/experience/shell-continuity";
import { cn } from "@/lib/utils";

function OndarMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-semibold text-brand-foreground">
        O
      </div>
      <span className="text-sm font-semibold tracking-tight">Ondar</span>
    </div>
  );
}

const domainNav = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Invoices", href: "/app/invoices" },
  { label: "Customers", href: "/app/customers" },
  { label: "Receivables", href: "/app/receivables" },
  { label: "Payments", href: "/app/payments" },
];

type Panel = "attention" | "work" | "context" | "notifications" | null;

function shortId(value: string | null): string {
  return value ? `${value.slice(0, 8)}…${value.slice(-4)}` : "Not set";
}

function ShellPopover({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-surface p-3 shadow-lg">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function WorkList({
  title,
  items,
  empty,
}: {
  title: string;
  items: ShellWorkspaceRef[];
  empty: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium">{title}</div>
      {items.length ? (
        <div className="mt-1 divide-y rounded-md border">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm transition-colors hover:bg-neutral-50"
            >
              <div className="font-medium">{item.title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {item.href}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-1 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  );
}

export function AppShell({
  children,
  orgId = "org_demo",
}: {
  children: React.ReactNode;
  orgId?: string;
}) {
  const pathname = usePathname();
  const [panel, setPanel] = useState<Panel>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(
    isUuid(orgId) ? orgId : null,
  );
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [recentWork, setRecentWork] = useState<ShellWorkspaceRef[]>([]);
  const [pinnedWork, setPinnedWork] = useState<ShellWorkspaceRef[]>([]);

  useEffect(() => {
    const scope = readExperienceScope();
    setActiveOrgId(scope.organizationId);
    setActiveBranchId(scope.branchId);
  }, [orgId]);

  useEffect(() => {
    if (!pathname || !activeOrgId) return;
    setRecentWork(recordRecentWorkspace(activeOrgId, pathname));
    setPinnedWork(readPinnedWorkspaces(activeOrgId));
    setPanel(null);
  }, [activeOrgId, pathname]);

  useEffect(() => {
    const handleStorage = () => {
      const scope = readExperienceScope();
      setActiveOrgId(scope.organizationId);
      setActiveBranchId(scope.branchId);
      setRecentWork(readRecentWorkspaces(scope.organizationId));
      setPinnedWork(readPinnedWorkspaces(scope.organizationId));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const attention = useOpenAttentionCount(activeOrgId ?? "");
  const attentionCount = attention.data?.count ?? 0;
  const criticalCount = attention.data?.critical ?? 0;
  const highCount = attention.data?.high ?? 0;
  const currentWorkspacePinned =
    Boolean(pathname) && pinnedWork.some((item) => item.href === pathname);

  const contextLabel = useMemo(() => {
    if (!activeOrgId) return "No organization";
    if (!activeBranchId) return "Organization context";
    return "Org + branch";
  }, [activeBranchId, activeOrgId]);

  const togglePanel = (next: Exclude<Panel, null>) => {
    setPanel((current) => (current === next ? null : next));
  };

  const toggleCurrentPin = () => {
    if (!pathname || !activeOrgId || !isWorkspaceLikeHref(pathname)) return;
    setPinnedWork(togglePinnedWorkspace(activeOrgId, pathname));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <Link href="/app/dashboard" className="shrink-0">
            <OndarMark />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center gap-1 lg:flex"
            aria-label="Domain navigation"
          >
            {domainNav.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-100 text-foreground"
                      : "text-muted-foreground hover:bg-neutral-50 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/app/ask"
              className={cn(
                "inline-flex items-center rounded-md bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground transition-colors hover:bg-brand-hover",
                pathname?.startsWith("/app/ask") && "ring-2 ring-ring",
              )}
            >
              Ask Ondar
            </Link>

            <button
              type="button"
              disabled
              title="Voice entry will be enabled when the Experience voice runtime lands."
              className="hidden rounded-md border px-2.5 py-2 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              Voice
            </button>

            <Link
              href="/app/search"
              className={cn(
                "hidden rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground sm:inline-flex",
                pathname?.startsWith("/app/search") &&
                  "bg-neutral-100 text-foreground",
              )}
            >
              Search
            </Link>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => togglePanel("attention")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-2 text-xs font-medium transition-colors hover:bg-neutral-50",
                  panel === "attention" && "bg-neutral-100",
                )}
                aria-expanded={panel === "attention"}
              >
                Attention
                {attentionCount ? (
                  <span
                    className={cn(
                      "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px]",
                      criticalCount > 0
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-foreground",
                    )}
                  >
                    {attentionCount > 99 ? "99+" : attentionCount}
                  </span>
                ) : null}
              </button>
              {panel === "attention" ? (
                <ShellPopover title="Attention summary">
                  {!activeOrgId ? (
                    <p className="text-sm text-muted-foreground">
                      Select an organization context to load Attention.
                    </p>
                  ) : attention.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading Attention…
                    </p>
                  ) : attention.isError ? (
                    <p className="text-sm text-muted-foreground">
                      Attention is temporarily unavailable.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md border p-2">
                          <div className="text-lg font-semibold">
                            {attentionCount}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Open
                          </div>
                        </div>
                        <div className="rounded-md border p-2">
                          <div className="text-lg font-semibold">
                            {criticalCount}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Critical
                          </div>
                        </div>
                        <div className="rounded-md border p-2">
                          <div className="text-lg font-semibold">{highCount}</div>
                          <div className="text-[11px] text-muted-foreground">
                            High
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/app/attention"
                        className="block rounded-md border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                      >
                        Open Attention
                      </Link>
                    </div>
                  )}
                </ShellPopover>
              ) : null}
            </div>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => togglePanel("work")}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors hover:bg-neutral-50",
                  panel === "work" && "bg-neutral-100",
                )}
                aria-expanded={panel === "work"}
              >
                Work
              </button>
              {panel === "work" ? (
                <ShellPopover title="Recent and pinned work">
                  <div className="space-y-3">
                    {pathname && isWorkspaceLikeHref(pathname) ? (
                      <button
                        type="button"
                        onClick={toggleCurrentPin}
                        className="w-full rounded-md border px-3 py-2 text-left text-sm font-medium hover:bg-neutral-50"
                      >
                        {currentWorkspacePinned
                          ? "Unpin current workspace"
                          : "Pin current workspace"}
                      </button>
                    ) : null}
                    <WorkList
                      title="Pinned"
                      items={pinnedWork}
                      empty="No pinned workspaces in this browser."
                    />
                    <WorkList
                      title="Recent"
                      items={recentWork}
                      empty="Open a domain workspace to build recent work."
                    />
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      L1 continuity is browser-local route metadata only. Durable
                      cross-device workspace history arrives with the Workspace
                      Registry continuity layer.
                    </p>
                  </div>
                </ShellPopover>
              ) : null}
            </div>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => togglePanel("context")}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-left text-xs transition-colors hover:bg-neutral-50",
                  panel === "context" && "bg-neutral-100",
                )}
                aria-expanded={panel === "context"}
              >
                <span className="block font-medium">{contextLabel}</span>
                <span className="block max-w-28 truncate text-[10px] text-muted-foreground">
                  {shortId(activeOrgId)}
                </span>
              </button>
              {panel === "context" ? (
                <ShellPopover title="Business context">
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Organization
                      </dt>
                      <dd>
                        <code>{activeOrgId ?? "Not selected"}</code>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Branch</dt>
                      <dd>
                        <code>{activeBranchId ?? "Organization-wide"}</code>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Context controls what Ask, Search, Attention, and domain
                    workspaces may request. Authorization remains server-side.
                  </p>
                  <Link
                    href="/app/settings/business"
                    className="mt-3 block rounded-md border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    Business settings
                  </Link>
                </ShellPopover>
              ) : null}
            </div>

            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => togglePanel("notifications")}
                className={cn(
                  "rounded-md border px-2.5 py-2 text-xs font-medium transition-colors hover:bg-neutral-50",
                  panel === "notifications" && "bg-neutral-100",
                )}
                aria-expanded={panel === "notifications"}
              >
                Notifications
              </button>
              {panel === "notifications" ? (
                <ShellPopover title="Notifications">
                  <p className="text-sm text-muted-foreground">
                    A separate notification feed is not available in L1.
                    Operational signals are surfaced through Attention.
                  </p>
                  <Link
                    href="/app/attention"
                    className="mt-3 block rounded-md border px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    Open Attention
                  </Link>
                </ShellPopover>
              ) : null}
            </div>

            <Link
              href="/app/settings/business"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-xs font-medium text-white"
              aria-label="User and settings"
              title="User and settings"
            >
              O
            </Link>
          </div>
        </div>

        <div className="border-t bg-surface px-4 py-2 md:hidden">
          <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto">
            <Link
              href="/app/attention"
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Attention{attentionCount ? ` · ${attentionCount}` : ""}
            </Link>
            <Link
              href="/app/search"
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Search
            </Link>
            <button
              type="button"
              onClick={() => togglePanel("work")}
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Work
            </button>
            <button
              type="button"
              onClick={() => togglePanel("context")}
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Context
            </button>
            <button
              type="button"
              onClick={() => togglePanel("notifications")}
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              Notifications
            </button>
            <button
              type="button"
              disabled
              className="whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60"
            >
              Voice
            </button>
          </div>
          {panel === "work" ? (
            <div className="mt-2 rounded-lg border bg-surface p-3">
              <div className="space-y-3">
                <WorkList
                  title="Pinned"
                  items={pinnedWork}
                  empty="No pinned workspaces in this browser."
                />
                <WorkList
                  title="Recent"
                  items={recentWork}
                  empty="Open a domain workspace to build recent work."
                />
              </div>
            </div>
          ) : null}
          {panel === "context" ? (
            <div className="mt-2 rounded-lg border bg-surface p-3 text-xs">
              <div>
                Organization: <code>{shortId(activeOrgId)}</code>
              </div>
              <div className="mt-1">
                Branch: <code>{shortId(activeBranchId)}</code>
              </div>
            </div>
          ) : null}
          {panel === "notifications" ? (
            <div className="mt-2 rounded-lg border bg-surface p-3 text-xs text-muted-foreground">
              A separate notification feed is not available in L1. Operational
              signals are surfaced through{" "}
              <Link href="/app/attention" className="font-medium text-foreground">
                Attention
              </Link>
              .
            </div>
          ) : null}
        </div>
      </header>

      <nav
        className="flex items-center gap-1 overflow-x-auto border-b bg-surface px-4 py-2 lg:hidden"
        aria-label="Domain navigation"
      >
        {domainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium",
              pathname?.startsWith(item.href)
                ? "bg-brand text-brand-foreground"
                : "bg-surface",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {children}
      </main>

      <footer className="mx-auto mt-8 max-w-[1280px] border-t px-4 py-8 text-xs text-muted-foreground sm:px-6">
        Ondar — financial and commercial operating software for growing
        businesses.
      </footer>
    </div>
  );
}
