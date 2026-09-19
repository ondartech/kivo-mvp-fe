import { PublicQuoteView } from "@/features/public/public-quote-view";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicQuoteView token={token} />;
}
