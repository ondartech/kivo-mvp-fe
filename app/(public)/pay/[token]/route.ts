import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export function buildHostedPaymentApiUrl(token: string): string {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  return `${base}/api/v1/pay/${encodeURIComponent(token)}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return NextResponse.redirect(buildHostedPaymentApiUrl(token), 302);
}
