export type TenantHostKind =
  | "APEX"
  | "SYSTEM"
  | "TENANT"
  | "LOCAL"
  | "EXTERNAL"
  | "UNKNOWN_ONDAR";

export type HostRouteAction =
  | { type: "NEXT" }
  | { type: "REDIRECT"; pathname: string }
  | { type: "REWRITE"; pathname: string }
  | { type: "NOT_FOUND" };

const DEFAULT_ROOT_DOMAIN = "getondar.com";
const SYSTEM_SUBDOMAINS = new Set(["api", "app", "pay", "www"]);
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TENANT_LABEL = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;
const PUBLIC_PREFIXES = ["/i/", "/q/", "/accept/", "/pay/"];

export interface TenantHostContext {
  hostname: string;
  kind: TenantHostKind;
  handle: string | null;
  systemLabel: string | null;
}

export function normalizeHostname(rawHost: string): string {
  const value = rawHost.trim().toLowerCase();
  if (!value || /[\s/@?#]/.test(value) || value.includes("://")) {
    throw new Error("Invalid host");
  }

  if (value.startsWith("[")) {
    const close = value.indexOf("]");
    if (close < 0) throw new Error("Invalid host");
    const host = value.slice(1, close);
    const suffix = value.slice(close + 1);
    if (suffix && !/^:\d+$/.test(suffix)) throw new Error("Invalid host");
    return host;
  }

  const colon = value.lastIndexOf(":");
  const hasSingleColon = colon > -1 && value.indexOf(":") === colon;
  const hostname = hasSingleColon ? value.slice(0, colon) : value;
  const port = hasSingleColon ? value.slice(colon + 1) : null;

  if (
    port !== null &&
    (!/^\d+$/.test(port) || Number(port) > 65535 || Number(port) < 1)
  ) {
    throw new Error("Invalid host");
  }

  const normalized = hostname.replace(/\.$/, "");
  if (!normalized) throw new Error("Invalid host");

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return normalized;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) {
    return normalized;
  }

  if (
    normalized.length > 253 ||
    normalized.split(".").some((label) => !DNS_LABEL.test(label))
  ) {
    throw new Error("Invalid host");
  }

  return normalized;
}

export function classifyTenantHost(
  rawHost: string,
  rootDomain = DEFAULT_ROOT_DOMAIN,
): TenantHostContext {
  const hostname = normalizeHostname(rawHost);
  const root = normalizeHostname(rootDomain);

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  ) {
    return { hostname, kind: "LOCAL", handle: null, systemLabel: null };
  }

  if (hostname === root) {
    return { hostname, kind: "APEX", handle: null, systemLabel: null };
  }

  const suffix = "." + root;
  if (hostname.endsWith(suffix)) {
    const left = hostname.slice(0, -suffix.length);
    if (left.includes(".")) {
      return {
        hostname,
        kind: "UNKNOWN_ONDAR",
        handle: null,
        systemLabel: null,
      };
    }
    if (SYSTEM_SUBDOMAINS.has(left)) {
      return {
        hostname,
        kind: "SYSTEM",
        handle: null,
        systemLabel: left,
      };
    }
    if (TENANT_LABEL.test(left)) {
      return {
        hostname,
        kind: "TENANT",
        handle: left,
        systemLabel: null,
      };
    }
    return {
      hostname,
      kind: "UNKNOWN_ONDAR",
      handle: null,
      systemLabel: null,
    };
  }

  return { hostname, kind: "EXTERNAL", handle: null, systemLabel: null };
}

export function routeForHost(
  context: TenantHostContext,
  pathname: string,
): HostRouteAction {
  if (context.kind === "UNKNOWN_ONDAR") {
    return { type: "NOT_FOUND" };
  }

  const isTenant = context.kind === "TENANT";
  const isAppSystem =
    context.kind === "SYSTEM" && context.systemLabel === "app";
  const appPathEnabled = isTenant || isAppSystem || context.kind === "LOCAL";

  if ((isTenant || isAppSystem) && pathname === "/") {
    return { type: "REDIRECT", pathname: "/app/dashboard" };
  }

  if (isTenant && PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { type: "NEXT" };
  }

  if (appPathEnabled && (pathname === "/app" || pathname.startsWith("/app/"))) {
    const stripped = pathname.slice("/app".length) || "/";
    return { type: "REWRITE", pathname: stripped };
  }

  return { type: "NEXT" };
}
