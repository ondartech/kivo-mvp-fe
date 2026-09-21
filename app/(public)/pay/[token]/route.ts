import { env } from "@/lib/env";
import { publicProxyHeaders } from "@/lib/public-api-proxy";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { token } = await context.params;
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const target = base + "/api/v1/pay/" + encodeURIComponent(token);

  const upstream = await fetch(target, {
    method: "GET",
    headers: publicProxyHeaders(request),
    redirect: "manual",
    cache: "no-store",
  });

  const headers = new Headers();
  for (const name of [
    "content-type",
    "cache-control",
    "location",
    "retry-after",
    "x-request-id",
    "x-correlation-id",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
