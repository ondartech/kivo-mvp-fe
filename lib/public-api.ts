const ONDAR_ROOT_DOMAIN = "getondar.com";

const ONDAR_PUBLIC_HOST =
  /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])\.getondar\.com$/;

export function normalizeRequestHost(rawHost: string | null): string | null {
  if (!rawHost) return null;
  const value = rawHost.trim().toLowerCase();
  if (!value || /[\s/@?#]/.test(value)) return null;

  const host = value.startsWith("[")
    ? value
    : value.replace(/:\d+$/, "");

  return host.replace(/\.$/, "");
}

export function isOndarPublicHost(rawHost: string | null): boolean {
  const host = normalizeRequestHost(rawHost);
  if (!host) return false;
  return host === ONDAR_ROOT_DOMAIN || ONDAR_PUBLIC_HOST.test(host);
}

export function resolvePublicApiOrigin(
  rawHost: string | null,
  fallbackApiUrl: string,
): string {
  const host = normalizeRequestHost(rawHost);
  if (host && isOndarPublicHost(host)) {
    return `https://${host}`;
  }
  return fallbackApiUrl.replace(/\/$/, "");
}

export function publicApiUrl(
  rawHost: string | null,
  fallbackApiUrl: string,
  path: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolvePublicApiOrigin(rawHost, fallbackApiUrl)}${normalizedPath}`;
}
