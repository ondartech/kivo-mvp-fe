import { PublicAcceptanceView } from "@/features/public/public-acceptance-view";

export default async function PublicAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicAcceptanceView token={token} />;
}
