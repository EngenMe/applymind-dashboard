import type { Metadata } from "next";
import Link from "next/link";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { MainNav } from "@/components/main-nav";
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
      <html lang="en" className={`${interTight.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
      <Providers>
        <div className="mx-auto flex min-h-screen max-w-[88rem] flex-col px-4 sm:px-6">
          <header className="flex items-center justify-between border-b border-rule py-4">
            <Link href="/applications" className="flex items-baseline gap-2.5">
              <span className="text-[0.9375rem] font-semibold tracking-tight">ApplyMind</span>
              <span className="eyebrow">Application ledger</span>
            </Link>
            <MainNav />
          </header>
          <main className="flex-1 py-6">{children}</main>
        </div>
      </Providers>
      </body>
      </html>
  );
}