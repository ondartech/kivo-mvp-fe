export type ShellWorkspaceRef = {
  href: string;
  title: string;
  visitedAt: string;
};

const RECENT_LIMIT = 6;
const PINNED_LIMIT = 8;

function storageKey(kind: "recent" | "pinned", organizationId: string): string {
  return `ondar:experience:${kind}-work:${organizationId}`;
}

export function isSafeAppHref(value: string): boolean {
  return (
    value.startsWith("/app/") &&
    !value.startsWith("/app//") &&
    !value.includes("://") &&
    !value.includes("\\")
  );
}

export function isWorkspaceLikeHref(value: string): boolean {
  if (!isSafeAppHref(value)) return false;
  return ![
    "/app/ask",
    "/app/search",
    "/app/attention",
    "/app/settings",
  ].some((prefix) => value === prefix || value.startsWith(`${prefix}/`));
}

export function workspaceTitleFromHref(href: string): string {
  const segments = href
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean)
    .slice(1);

  if (!segments.length) return "Workspace";

  const primary = segments[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  if (segments.length === 1) return primary;

  const identity = segments.at(-1) ?? "";
  return `${primary} · ${identity.length > 12 ? `${identity.slice(0, 8)}…` : identity}`;
}

function parseStored(value: string | null): ShellWorkspaceRef[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.href !== "string" ||
        typeof item.title !== "string" ||
        typeof item.visitedAt !== "string" ||
        !isWorkspaceLikeHref(item.href)
      ) {
        return [];
      }
      return [
        {
          href: item.href,
          title: item.title,
          visitedAt: item.visitedAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function readRecentWorkspaces(
  organizationId: string | null,
): ShellWorkspaceRef[] {
  if (typeof window === "undefined" || !organizationId) return [];
  return parseStored(
    localStorage.getItem(storageKey("recent", organizationId)),
  ).slice(0, RECENT_LIMIT);
}

export function readPinnedWorkspaces(
  organizationId: string | null,
): ShellWorkspaceRef[] {
  if (typeof window === "undefined" || !organizationId) return [];
  return parseStored(
    localStorage.getItem(storageKey("pinned", organizationId)),
  ).slice(0, PINNED_LIMIT);
}

export function recordRecentWorkspace(
  organizationId: string | null,
  href: string,
): ShellWorkspaceRef[] {
  if (
    typeof window === "undefined" ||
    !organizationId ||
    !isWorkspaceLikeHref(href)
  ) {
    return readRecentWorkspaces(organizationId);
  }

  const next: ShellWorkspaceRef = {
    href,
    title: workspaceTitleFromHref(href),
    visitedAt: new Date().toISOString(),
  };
  const current = readRecentWorkspaces(organizationId);
  const updated = [
    next,
    ...current.filter((item) => item.href !== href),
  ].slice(0, RECENT_LIMIT);

  localStorage.setItem(
    storageKey("recent", organizationId),
    JSON.stringify(updated),
  );
  return updated;
}

export function togglePinnedWorkspace(
  organizationId: string | null,
  href: string,
): ShellWorkspaceRef[] {
  if (
    typeof window === "undefined" ||
    !organizationId ||
    !isWorkspaceLikeHref(href)
  ) {
    return readPinnedWorkspaces(organizationId);
  }

  const current = readPinnedWorkspaces(organizationId);
  const exists = current.some((item) => item.href === href);
  const updated = exists
    ? current.filter((item) => item.href !== href)
    : [
        {
          href,
          title: workspaceTitleFromHref(href),
          visitedAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, PINNED_LIMIT);

  localStorage.setItem(
    storageKey("pinned", organizationId),
    JSON.stringify(updated),
  );
  return updated;
}
