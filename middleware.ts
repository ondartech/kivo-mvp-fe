import { NextRequest, NextResponse } from "next/server";

import { classifyTenantHost } from "@/lib/tenant-host";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const headers = new Headers(request.headers);

  try {
    const context = classifyTenantHost(
      host,
      process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "getondar.com",
    );

    headers.set("x-ondar-host-kind", context.kind);
    headers.set("x-ondar-original-host", context.hostname);

    if (context.handle) {
      headers.set("x-ondar-tenant-handle", context.handle);
    } else {
      headers.delete("x-ondar-tenant-handle");
    }
  } catch {
    return new NextResponse("Invalid request host", { status: 400 });
  }

  return NextResponse.next({
    request: { headers },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
