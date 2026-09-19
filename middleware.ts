import { NextRequest, NextResponse } from "next/server";

import {
  classifyTenantHost,
  routeForHost,
} from "@/lib/tenant-host";

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

    const action = routeForHost(context, request.nextUrl.pathname);

    if (action.type === "NOT_FOUND") {
      return new NextResponse("Not found", { status: 404 });
    }

    if (action.type === "REDIRECT") {
      const url = request.nextUrl.clone();
      url.pathname = action.pathname;
      return NextResponse.redirect(url, 307);
    }

    if (action.type === "REWRITE") {
      const url = request.nextUrl.clone();
      url.pathname = action.pathname;
      return NextResponse.rewrite(url, {
        request: { headers },
      });
    }

    return NextResponse.next({
      request: { headers },
    });
  } catch {
    return new NextResponse("Invalid request host", { status: 400 });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
