export const ROOT_DOMAIN = "getondar.com";

const SYSTEM_SUBDOMAINS = new Set(["api", "app", "pay", "www"]);
const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export type HostKind =
  | "APEX"
  | "SYSTEM"
  | "TENANT"
  | "LOCAL"
  | "EXTERNAL"
  | "UNKNOWN_ONDAR";

export interface TenantHostContext {
  hostname: string;
  kind: HostKind;
  handle: string | null;
}

function stripPort(rawHost: string): string {
  const value = rawHost.trim().toLowerCase();
  if (!value) return "";

  if (value.startsWith("[")) {
    const closing = value.indexOf("]");
    return closing >= 0 ? value.slice(1, closing) : value;
  }

  const colon = value.lastIndexOf(":");
  if (colon > -1 && value.indexOf(":") === colon) {
    const maybePort = value.slice(colon + 1);
    if (/^\d+$/.test(maybePort)) {
      return value.slice(0, colon);
    }
  }
  return value;
}

export function classifyTenantHost(rawHost: string): TenantHostContext {
  const hostname = stripPort(rawHost).replace(/\.$/, "");

  if (!hostname) {
    return { hostname, kind: "EXTERNAL", handle: null };
  }

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
    hostname === "::1"
  ) {
    return { hostname, kind: "LOCAL", handle: null };
  }

  if (hostname === ROOT_DOMAIN) {
    return { hostname, kind: "APEX", handle: null };
  }

  const suffix = "." + ROOT_DOMAIN;
  if (!hostname.endsWith(suffix)) {
    return { hostname, kind: "EXTERNAL", handle: null };
  }

  const left = hostname.slice(0, -suffix.length);
  if (!left || left.includes(".")) {
    return { hostname, kind: "UNKNOWN_ONDAR", handle: null };
  }

  if (SYSTEM_SUBDOMAINS.has(left)) {
    return { hostname, kind: "SYSTEM", handle: null };
  }

  if (HANDLE_RE.test(left)) {
    return { hostname, kind: "TENANT", handle: left };
  }

  return { hostname, kind: "UNKNOWN_ONDAR", handle: null };
}
