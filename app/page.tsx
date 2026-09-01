import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyAmount } from "@/components/kivo/money-amount";

/* Brand landing — Kivo product marketing
   Territory: Kuda approachability × Stripe trust × N26 calm → receivables clarity
   Principles: Clarity over decoration, Money is information, Calm over complexity, Action over reporting
*/

function KivoWordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-brand-foreground font-semibold text-sm tracking-tight">
        K
      </div>
      <span className="text-[15px] font-semibold tracking-tight">Kivo</span>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav — single line, 64px max, trust-first */}
      <header className="sticky top-0 z-50 h-[64px] border-b bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <KivoWordmark />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#product" className="text-muted-foreground hover:text-foreground">
              Product
            </a>
            <a href="#receivables" className="text-muted-foreground hover:text-foreground">
              Receivables
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/app/dashboard" className="hidden sm:inline-flex text-sm font-medium px-3 py-2">
              Sign in
            </Link>
            <Link href="/app/dashboard">
              <Button size="sm">Start collecting</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — split, fits viewport, headline 2 lines max, sub 20 words */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-10 md:pt-16 pb-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center min-h-[calc(100dvh-200px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Nigeria-first · Paystack & bank transfer ready
            </div>
            <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-balance">
              Invoice customers.
              <br />
              <span className="text-muted-foreground">Get paid, clearly.</span>
            </h1>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-6 text-muted-foreground">
              Kivo turns invoices into receivables you can act on. Outstanding, due, overdue and paid — with the next step clear.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/invoices/new">
                <Button>Create first invoice</Button>
              </Link>
              <Link href="/app/dashboard">
                <Button variant="secondary">Open dashboard</Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" /> No ledger required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" /> NGN · WhatsApp · Email
              </span>
            </div>
          </div>

          {/* Product preview — operational cockpit, not chart dump */}
          <div className="rounded-xl border bg-surface shadow-surface p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Good morning</div>
              <Badge variant="neutral">Acme Services · Lagos</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</div>
                <div className="mt-1">
                  <MoneyAmount amount="12400000" emphasis="primary" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">42 invoices</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums text-critical">₦1.9m</span>
                  <Badge variant="critical">7 invoices</Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Collected · May</div>
                <div className="mt-1">
                  <MoneyAmount amount="7800000" emphasis="primary" />
                </div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Due soon</div>
                <div className="mt-1 text-sm font-medium">Bello Consulting · <span className="tabular-nums">₦850k</span></div>
                <div className="text-xs text-warning">Due tomorrow</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border">
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b">Needs attention</div>
              <div className="divide-y">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">Acme Ltd. — INV-1042</div>
                    <div className="text-xs text-muted-foreground">4 days overdue · Last viewed yesterday</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">₦2.4m</div>
                    <div className="mt-1 flex gap-1 justify-end">
                      <Button size="sm">Remind</Button>
                      <Button size="sm" variant="secondary">
                        Open
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">Bello Consulting — INV-1043</div>
                    <div className="text-xs text-muted-foreground">Due tomorrow · WhatsApp · Email</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums">₦850k</div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">Recent activity · ₦450k paid · Invoice viewed 2h ago · Reminder sent yesterday</div>
          </div>
        </div>
      </section>

      {/* Trusted by — logo wall UNDER hero */}
      <section className="border-y bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <span className="uppercase tracking-wide font-medium">Used by services</span>
          <div className="flex items-center gap-6 opacity-60">
            <span className="font-semibold">Nova Studio</span>
            <span className="font-semibold">Bello & Co</span>
            <span className="font-semibold">Acme Services</span>
            <span className="font-semibold">Marrow Labs</span>
          </div>
        </div>
      </section>

      {/* Money flow — centre, not document */}
      <section id="product" className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">Design around the movement of money.</h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
            Invoices are not the product. Receivables clarity is. Kivo maps every invoice to a living financial object with explicit states — so you always know what is owed and what to do next.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-7 gap-2 text-sm">
          {["Customer", "Invoice", "Outstanding", "Due", "Overdue", "Payment", "Collected"].map((s, i) => (
            <div key={s} className="relative rounded-lg border bg-surface p-3 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 font-medium">{s}</div>
              {i < 6 ? <div className="hidden md:block absolute -right-2 top-1/2 h-px w-4 bg-border" /> : null}
            </div>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</div>
              <div className="mt-2 font-medium">Living financial object</div>
              <div className="text-sm text-muted-foreground mt-1">Draft → Issued (immutable) → Sent → Viewed → Due → Overdue → Paid</div>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                <Badge>Issued</Badge>
                <Badge variant="success">Paid</Badge>
                <Badge variant="critical">Overdue</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Payment</div>
              <div className="mt-2 text-xl font-semibold tabular-nums">₦450,000 paid</div>
              <div className="text-sm text-muted-foreground">INV-1042 · Acme Ltd. · Bank transfer · 23 Aug 2026</div>
              <div className="mt-3 text-xs text-success">No ambiguous “processing” — state is authoritative.</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Collection</div>
              <div className="mt-2 font-medium">Who should I follow up with?</div>
              <div className="text-sm text-muted-foreground">Overdue ranked by amount and days. Action is one tap.</div>
              <div className="mt-3">
                <Button size="sm">Send reminder</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Financial language — money first-class */}
      <section className="bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Money is a first-class visual.</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300 max-w-[60ch]">
                Amounts are not metadata. They are headlines. Typography, spacing and state make ₦2.4m scannable without becoming a spreadsheet.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-400">Table</div>
                  <div className="mt-1 font-medium tabular-nums text-right">₦2,400,000.00</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-400">Compact</div>
                  <div className="mt-1 font-medium">₦2.4m overdue</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white text-foreground p-5 shadow-overlay">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Invoice INV-1042 · Acme Ltd</div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Subtotal</div>
                  <div className="tabular-nums font-medium">₦2,000,000.00</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Tax (7.5%)</div>
                  <div className="tabular-nums font-medium">₦150,000.00</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Total</div>
                  <div className="text-lg font-semibold tabular-nums">₦2,400,000.00</div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4 flex items-center justify-between">
                <div className="text-sm">
                  <span className="tabular-nums font-semibold">₦1,000,000 paid</span>
                  <span className="text-muted-foreground"> · ₦1,400,000 outstanding</span>
                </div>
                <Badge variant="warning">Due tomorrow</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product screens teaser + design system */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 md:py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Product surfaces, consistent everywhere.</h2>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
          Same financial language across dashboard, invoices, customers, receivables, payments and public pages. Nigeria-native (NGN, +234, WhatsApp, bank transfer) without cliché imagery.
        </p>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Dashboard cockpit", desc: "What am I owed? What needs attention? What changed?", href: "/app/dashboard" },
            { title: "Invoice creation", desc: "Quick: Customer → Description → Amount → Due. Then review → Issue (immutable).", href: "/app/invoices/new" },
            { title: "Invoice detail", desc: "Amount, outstanding, states, activity, Send/Remind/Record payment — one place.", href: "/app/invoices/demo" },
            { title: "Customer detail", desc: "Customer → invoices → outstanding → recent activity. Not a CRM.", href: "/app/customers/demo" },
            { title: "Receivables", desc: "Overdue → Due today → Due soon → Outstanding. Each row has Remind.", href: "/app/receivables" },
            { title: "Public invoice", desc: "No Kivo account. Fast, minimal, mobile-first. Copy link, revoke, Paystack handoff.", href: "/invoice/demo-token" },
          ].map((c) => (
            <a key={c.title} href={c.href} className="rounded-lg border bg-surface p-5 hover:bg-neutral-50 transition-colors">
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
              <div className="mt-3 text-xs font-medium text-info">Open →</div>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-xl border bg-surface p-6">
          <div className="text-sm font-semibold">Design-system foundation</div>
          <div className="text-sm text-muted-foreground">Primitive → Semantic → Component + Financial-domain components. Tokens are the only source of colour/typography/spacing.</div>
          <div className="mt-4 grid sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium">Foundations</div>
              <div className="text-muted-foreground">colour · typography · spacing · radius · elevation · motion</div>
            </div>
            <div>
              <div className="font-medium">Financial primitives</div>
              <div className="text-muted-foreground">MoneyAmount · InvoiceStatus · CollectionState · OutstandingAmount</div>
            </div>
            <div>
              <div className="font-medium">Product components</div>
              <div className="text-muted-foreground">InvoiceRow · ReceivableRow · ActivityTimeline · ReminderCard</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-surface">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 justify-between text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Kivo. Nigeria-first, globally credible.</div>
          <div>Kivo makes getting paid as simple as sending an invoice.</div>
        </div>
      </footer>
    </div>
  );
}
