import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata = {
  title: "Kivo — Invoice customers. Track what you're owed. Get paid.",
  description:
    "Nigeria-first receivables platform. Customer → Invoice → Send → View → Due → Reminder → Payment → Receipt → Receivable visibility.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-brand selection:text-brand-foreground">
        <QueryProvider>{children}</QueryProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "bg-surface text-foreground border shadow-overlay",
          }}
        />
      </body>
    </html>
  );
}
