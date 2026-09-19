import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { publicApiUrl } from "@/lib/public-api";

export default async function PublicPaymentHandoffPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ??
    requestHeaders.get("host");

  const paymentApiUrl = publicApiUrl(
    host,
    env.NEXT_PUBLIC_API_URL,
    `/api/v1/pay/${encodeURIComponent(token)}`,
  );

  redirect(paymentApiUrl);
}
