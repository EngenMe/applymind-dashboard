import type { Metadata } from "next";
import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ApplyMind",
  description: "Every application, and exactly what was sent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html
          lang="en"
          className={`${interTight.variable} ${jetbrainsMono.variable}`}
          suppressHydrationWarning
      >
      <body className="min-h-screen">
      <Providers>
        <div className="mx-auto flex min-h-screen max-w-[88rem] flex-col px-4 sm:px-6">
          {/*
             * Two rows on a phone, one on a laptop. The wordmark and the theme
             * toggle share the top line — the toggle is small and belongs with
             * the chrome — and the sections get a line of their own below,
             * where they have room to scroll sideways rather than wrap into a
             * ragged block.
             */}
          <header className="flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-baseline gap-2.5">
                <span className="text-[0.9375rem] font-semibold tracking-tight">ApplyMind</span>
                {/* The strapline is the first thing to go: it explains the
                      product to a first-time visitor and costs a returning one
                      nothing when it is absent. */}
                <span className="eyebrow hidden xs:inline">Application ledger</span>
              </Link>
              <div className="sm:hidden">
                <ThemeToggle />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <MainNav />
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 py-6">{children}</main>
        </div>
      </Providers>
      </body>
      </html>
  );
}