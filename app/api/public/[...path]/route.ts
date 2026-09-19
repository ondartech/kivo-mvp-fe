import { proxyPublicApi } from "@/lib/public-api-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  return proxyPublicApi(request, path);
}

export const GET = handle;
export const POST = handle;
export const HEAD = handle;
