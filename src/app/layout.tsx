import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenant Isolation Demo",
  description:
    "A small Next.js + Supabase app that proves its own access control instead of claiming it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b" style={{ borderColor: "var(--line)" }}>
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4 text-sm">
            <Link href="/" className="font-semibold">
              Tenant Isolation Demo
            </Link>
            <Link href="/proof" className="opacity-70 hover:opacity-100">
              Try to break in
            </Link>
            <Link href="/portal" className="opacity-70 hover:opacity-100">
              Imports &amp; payments
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
        <footer
          className="mx-auto max-w-4xl px-4 py-10 text-xs"
          style={{ color: "var(--muted)" }}
        >
          A work sample with invented data. No real customers and no production systems are involved.
        </footer>
      </body>
    </html>
  );
}
