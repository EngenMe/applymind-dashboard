"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/lib/hooks/use-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { REAL_APP_LOGIN_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const SECTIONS = [
    { href: "/applications", label: "Applications" },
    { href: "/cvs", label: "CVs" },
    { href: "/cover-letters", label: "Cover letters" },
    { href: "/settings", label: "Settings" },
];

/**
 * True on the portfolio showcase deployment. Needs the NEXT_PUBLIC_ prefix
 * because this file runs in the browser — the plain DEMO_MODE read by
 * middleware.ts and session.ts never reaches client code, Next only inlines
 * env vars into the browser bundle when they're prefixed this way. Both must
 * be set to the same value on the showcase deployment's Vercel project, or
 * this and the server-side checks disagree about which mode they're in.
 */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * The three things the ledger holds, plus what configures them, plus
 * sign-in/sign-out — except on the showcase deployment, which has never had
 * an account system and isn't getting one now.
 *
 * Section links show unconditionally there, same as the single-deployment
 * era before phase 16: there is nothing to be signed out of, so the whole
 * concept of gating them on auth state doesn't apply. What replaces the old
 * demo-mode banner is the "Sign in" link, which always points at
 * REAL_APP_LOGIN_URL — an absolute, off-origin URL, deliberately never a
 * relative /login. This deployment has no session system to send that
 * request to, and neither does someone's localhost while testing DEMO_MODE
 * there; applymind.dev is the only place a login can actually happen.
 *
 * On the real deployment, useMe() is what decides everything — this file
 * doesn't know or care whether that's applymind.dev or a local dev server
 * pointed at the real backend, both behave identically. Skipping the query
 * entirely in demo mode (`enabled: !DEMO_MODE`) isn't just an optimisation:
 * TanStack Query leaves a disabled query's `isPending` true forever, since it
 * never fetches and never gets data, so demo mode has to bypass that check
 * rather than wait on it.
 */
export function MainNav() {
    const pathname = usePathname() ?? "";
    const me = useMe({ enabled: !DEMO_MODE });
    const signedIn = !DEMO_MODE && Boolean(me.data);
    const loading = !DEMO_MODE && me.isPending;
    const showSections = DEMO_MODE || signedIn;

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {showSections ? (
                <nav
                    aria-label="Sections"
                    className="no-scrollbar flex min-w-0 flex-1 basis-full items-center gap-4 overflow-x-auto sm:basis-auto"
                >
                    {SECTIONS.map((section) => {
                        const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "shrink-0 py-0.5 text-sm whitespace-nowrap text-ink-muted hover:text-ink",
                                    active && "text-ink underline decoration-rule-strong underline-offset-[0.4rem]",
                                )}
                            >
                                {section.label}
                            </Link>
                        );
                    })}
                </nav>
            ) : (
                // Reserves the row even while loading, rather than the whole header
                // jumping once useMe() resolves.
                <span aria-hidden={loading} />
            )}

            <div className="shrink-0">
                {DEMO_MODE ? (
                    <a
                        href={REAL_APP_LOGIN_URL}
                        className="inline-flex h-8 items-center rounded-sm border border-rule px-3 text-sm text-ink hover:border-ink"
                    >
                        Sign in
                    </a>
                ) : loading ? null : signedIn ? (
                    <SignOutButton email={me.data?.email} />
                ) : (
                    // Styled to match Button's outline/sm variant rather than using
                    // Button itself with an asChild prop — I haven't actually seen
                    // button.tsx, so I can't confirm it supports that pattern, and a
                    // plain styled Link can't silently fail the way an unverified
                    // prop could.
                    <Link
                        href="/login"
                        className="inline-flex h-8 items-center rounded-sm border border-rule px-3 text-sm text-ink hover:border-ink"
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </div>
    );
}