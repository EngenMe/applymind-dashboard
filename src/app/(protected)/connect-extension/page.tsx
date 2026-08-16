"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useIssueToken } from "@/lib/hooks/use-auth";

/**
 * Where the extension's "Sign in" button lands.
 *
 * Reads ?redirect_uri= (the extension's own callback page — see
 * entrypoints/oauth-callback in the extension repo), mints a token using the
 * session that got this page here, and does one ordinary redirect back to
 * that address with the token in the query string. Nothing more than that —
 * no cross-origin messaging, no waiting on the extension to do anything
 * first. requireUser() in (protected)/layout.tsx already guarantees a
 * signed-in session by the time this component can mount.
 *
 * useSearchParams() forces Next to bail out of static generation for
 * whatever calls it, and that bailout has to be caught by an actual
 * <Suspense> boundary somewhere above it — not by a "dynamic" route segment
 * export, which only has an effect in Server Components and is silently
 * ignored in a "use client" file like this one. Splitting the component in
 * two is what the Suspense boundary actually needs: ConnectExtensionPage
 * (the default export) renders nothing itself, just wraps the part that
 * calls useSearchParams() in Suspense; ConnectExtensionInner is where every
 * bit of the real logic still lives, unchanged.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APPLYMIND_API_BASE_URL ?? "";

type Stage = { state: "minting" } | { state: "redirecting" } | { state: "error"; message: string };

/**
 * Only chrome-extension:// and moz-extension:// are accepted. redirect_uri
 * comes from the URL, so without this check this page would be a generic
 * open redirect — anyone could craft a link sending a signed-in user's fresh
 * token to an arbitrary https:// address instead.
 */
function isExtensionRedirect(value: string | null): value is string {
    if (!value) return false;
    return value.startsWith("chrome-extension://") || value.startsWith("moz-extension://");
}

function ConnectExtensionInner() {
    const params = useSearchParams();
    const [stage, setStage] = useState<Stage>({ state: "minting" });
    const issueToken = useIssueToken();

    useEffect(() => {
        const redirectUri = params.get("redirect_uri");

        if (!API_BASE_URL) {
            setStage({
                state: "error",
                message: "NEXT_PUBLIC_APPLYMIND_API_BASE_URL is not set on this deployment.",
            });
            return;
        }
        if (!isExtensionRedirect(redirectUri)) {
            setStage({
                state: "error",
                message: "This page was opened without a valid extension redirect address.",
            });
            return;
        }

        issueToken
            .mutateAsync("browser extension")
            .then((issued) => {
                setStage({ state: "redirecting" });
                const target = new URL(redirectUri);
                target.searchParams.set("token", issued.token);
                target.searchParams.set("apiBaseUrl", API_BASE_URL);
                window.location.href = target.toString();
            })
            .catch(() => {
                setStage({ state: "error", message: "Could not create a token. Try reloading this page." });
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-xl text-ink">Connecting the extension</h1>

            {stage.state === "minting" && <p className="text-sm text-ink-muted">Creating a token…</p>}
            {stage.state === "redirecting" && (
                <p className="text-sm text-ink-muted">Handing off to the extension…</p>
            )}
            {stage.state === "error" && (
                <p className="text-sm text-red-600" role="alert">
                    {stage.message}
                </p>
            )}
        </div>
    );
}

export default function ConnectExtensionPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
                    <h1 className="text-xl text-ink">Connecting the extension</h1>
                    <p className="text-sm text-ink-muted">Loading…</p>
                </div>
            }
        >
            <ConnectExtensionInner />
        </Suspense>
    );
}