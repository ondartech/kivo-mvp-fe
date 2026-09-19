import { Card, CardContent } from "@/components/ui/card";

export default async function PaymentReturnStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <Card className="mx-auto max-w-[560px]">
        <CardContent className="p-8 text-center">
          <div
            className={
              "mx-auto flex h-8 w-8 items-center justify-center rounded-md " +
              "bg-brand font-semibold text-brand-foreground"
            }
          >
            O
          </div>
          <h1 className="mt-5 text-xl font-semibold">
            Payment confirmation in progress
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment provider has returned you to Ondar. This page does not
            mark the invoice as paid. Ondar confirms payment from trusted backend
            provider verification and webhook state.
          </p>

          {reference ? (
            <div className="mt-5 rounded-md border bg-neutral-50 p-3 text-xs text-muted-foreground">
              Payment reference: {reference}
            </div>
          ) : null}

          <p className="mt-5 text-sm">
            You can return to the invoice or contact the sender if you need
            confirmation immediately.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
