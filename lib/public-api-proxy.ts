import { env } from "@/lib/env";

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "if-none-match",
  "x-request-id",
  "x-correlation-id",
] as const;

function backendBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

export function buildPublicApiTarget(path: string[]): string {
  const safePath = path.map((part) => encodeURIComponent(part)).join("/");
  return backendBaseUrl() + "/api/v1/public/" + safePath;
}

export function publicProxyHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const host = request.headers.get("x-ondar-original-host") ?? request.headers.get("host");
  if (host) {
    headers.set("x-forwarded-host", host);
  }

  return headers;
}

export async function proxyPublicApi(
  request: Request,
  path: string[],
): Promise<Response> {
  const method = request.method.toUpperCase();
  const headers = publicProxyHeaders(request);
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(buildPublicApiTarget(path), {
    method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  for (const name of [
    "content-type",
    "cache-control",
    "etag",
    "location",
    "retry-after",
    "x-request-id",
    "x-correlation-id",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
