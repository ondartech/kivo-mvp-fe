import { NextRequest, NextResponse } from "next/server";
import { classifyTenantHost } from "@/lib/tenant-host";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const context = classifyTenantHost(host);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ondar-host-kind", context.kind);
  requestHeaders.set("x-ondar-original-host", context.hostname);

  if (context.handle) {
    requestHeaders.set("x-ondar-tenant-handle", context.handle);
  } else {
    requestHeaders.delete("x-ondar-tenant-handle");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
