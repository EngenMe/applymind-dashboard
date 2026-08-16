"use client";

import { useEffect, useState } from "react";
import { useIssueToken } from "@/lib/hooks/use-auth";

/**
 * Where the extension's "Sign in" button lands.
 *
 * Mints a token as soon as this page loads (requireUser() in
 * (protected)/layout.tsx already guarantees a signed-in session before this
 * component can even mount), then renders it into one hidden DOM element.
 * dashboard-bridge.content, in the extension repo, is what actually does
 * something with it — this page has no idea whether the extension is even
 * installed; it just writes the element and waits to hear back.
 *
 * This is deliberately not chrome.runtime.sendMessage(extensionId, ...) from
 * this page directly (the externally_connectable pattern). That needs Chrome
 * to inject a working chrome.runtime object into this page's own window,
 * which was not reliable enough to build around. A hidden DOM element a
 * content script can simply read has no equivalent dependency.
 */

const TOKEN_ELEMENT_ID = "applymind-connect-token";

/**
 * The API host the extension should call directly — never through this
 * dashboard's own /api/backend proxy, which the extension has no access to
 * and shouldn't: it authenticates with its own bearer token, not a cookie.
 * Needs the NEXT_PUBLIC_ prefix because this is a client component; the
 * plain APPLYMIND_API_BASE_URL the proxy itself uses never reaches the
 * browser bundle.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_APPLYMIND_API_BASE_URL ?? "";

type Stage =
    | { state: "minting" }
    | { state: "waiting" }
    | { state: "done"; email: string }
    | { state: "error"; message: string };

interface ConnectAnnounce {
    source: "applymind-extension";
    connected: boolean;
    email?: string;
    error?: string;
}

function isConnectAnnounce(data: unknown): data is ConnectAnnounce {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as Record<string, unknown>).source === "applymind-extension"
    );
}

export default function ConnectExtensionPage() {
    const [stage, setStage] = useState<Stage>({ state: "minting" });
    const [token, setToken] = useState<string | null>(null);
    const issueToken = useIssueToken();

    // Mints the token once, on mount.
    useEffect(() => {
        if (!API_BASE_URL) {
            setStage({
                state: "error",
                message: "NEXT_PUBLIC_APPLYMIND_API_BASE_URL is not set on this deployment.",
            });
            return;
        }

        let cancelled = false;
        issueToken
            .mutateAsync("browser extension")
            .then((issued) => {
                if (cancelled) return;
                setToken(issued.token);
                setStage({ state: "waiting" });
            })
            .catch(() => {
                if (cancelled) return;
                setStage({ state: "error", message: "Could not create a token. Try reloading this page." });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listens for the content script's report once it has read the element
    // below and relayed it to the extension's background worker.
    useEffect(() => {
        function onMessage(event: MessageEvent) {
            if (event.origin !== window.location.origin) return;
            if (!isConnectAnnounce(event.data)) return;

            if (event.data.connected) {
                setStage({ state: "done", email: event.data.email ?? "your account" });
                // Self-close only works on a window this script opened — a plain
                // target="_blank" tab click would refuse this. The popup and Sidebar
                // both open this page via window.open() specifically so this works.
                window.setTimeout(() => window.close(), 1200);
            } else {
                setStage({ state: "error", message: event.data.error ?? "The extension refused the token." });
            }
        }

        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    // No response at all after a reasonable wait means the extension either
    // is not installed or its content script never ran — distinct from the
    // extension actively refusing the token, which arrives as an "error" stage
    // via the listener above instead.
    useEffect(() => {
        if (stage.state !== "waiting") return;
        const timeout = window.setTimeout(() => {
            setStage((current) =>
                current.state === "waiting"
                    ? { state: "error", message: "The extension did not respond. Make sure it is installed and try again." }
                    : current,
            );
        }, 15_000);
        return () => window.clearTimeout(timeout);
    }, [stage.state]);

    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-xl text-ink">Connecting the extension</h1>

            {stage.state === "minting" && <p className="text-sm text-ink-muted">Creating a token…</p>}
            {stage.state === "waiting" && (
                <p className="text-sm text-ink-muted">Connecting to the extension…</p>
            )}
            {stage.state === "done" && (
                <>
                    <p className="text-sm text-ink">
                        Connected as <strong>{stage.email}</strong>.
                    </p>
                    <p className="text-sm text-ink-muted">
                        You can close this window and go back to LinkedIn.
                    </p>
                </>
            )}
            {stage.state === "error" && (
                <p className="text-sm text-red-600" role="alert">
                    {stage.message}
                </p>
            )}

            {/* Read by dashboard-bridge.content in the extension, never shown to
          the person — this is the handoff, not something to click or copy. */}
            {token && (
                <div
                    id={TOKEN_ELEMENT_ID}
                    data-token={token}
                    data-api-base={API_BASE_URL}
                    hidden
                />
            )}
        </div>
    );
}