import { NextResponse } from "next/server";

import { env } from "@/lib/env";

export function buildHostedPaymentApiUrl(
  token: string,
  apiBaseUrl = env.NEXT_PUBLIC_API_URL,
): string {
  const base = apiBaseUrl.replace(/\/$/, "");
  return `${base}/api/v1/pay/${encodeURIComponent(token)}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return NextResponse.redirect(buildHostedPaymentApiUrl(token), 302);
}
