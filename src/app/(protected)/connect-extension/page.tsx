"use client";

import { useEffect, useState } from "react";
import { useIssueToken } from "@/lib/hooks/use-auth";

/**
 * Where the extension's "Sign in" button lands.
 *
 * This page's only job is a handoff: dashboard-bridge.content (in the
 * extension repo) announces the installed extension's id via postMessage,
 * this page mints a real token using the session cookie that got it here,
 * and hands the token to that extension directly over
 * chrome.runtime.sendMessage — a channel that only exists because the
 * extension's manifest lists this origin in externally_connectable.matches.
 * Nothing is ever shown on screen to copy.
 *
 * This route sits under (protected), so requireUser() already guarantees a
 * signed-in session by the time this component mounts — there is no
 * "signed out" state to handle here at all.
 */

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
    | { state: "waiting" }
    | { state: "connecting" }
    | { state: "done"; email: string }
    | { state: "error"; message: string };

interface ExtensionAnnounce {
    source: "applymind-extension";
    extensionId: string;
}

function isAnnounce(data: unknown): data is ExtensionAnnounce {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as Record<string, unknown>).source === "applymind-extension" &&
        typeof (data as Record<string, unknown>).extensionId === "string"
    );
}

interface ConnectResponse {
    ok: boolean;
    email?: string;
    error?: string;
}

/**
 * The sliver of chrome.runtime this page actually calls. Defined locally
 * rather than pulling in @types/chrome — that package is for building an
 * extension itself, and this is an ordinary web app that happens to be
 * allowed, by the installed extension's own manifest, to call one specific
 * API on window.chrome. TypeScript has no reason to know about the rest of
 * it, and shouldn't.
 */
interface MinimalChromeRuntime {
    sendMessage: (
        extensionId: string,
        message: unknown,
        callback: (response: ConnectResponse | undefined) => void,
    ) => void;
    lastError?: { message?: string };
}

export default function ConnectExtensionPage() {
    const [stage, setStage] = useState<Stage>({ state: "waiting" });
    const issueToken = useIssueToken();

    useEffect(() => {
        if (!API_BASE_URL) {
            setStage({
                state: "error",
                message: "NEXT_PUBLIC_APPLYMIND_API_BASE_URL is not set on this deployment.",
            });
            return;
        }

        let handled = false;

        function onMessage(event: MessageEvent) {
            // Same-origin only — dashboard-bridge.content posts to
            // window.location.origin specifically, never "*".
            if (event.origin !== window.location.origin) return;
            if (!isAnnounce(event.data) || handled) return;
            handled = true;

            void connect(event.data.extensionId);
        }

        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function connect(extensionId: string) {
        setStage({ state: "connecting" });

        let issued: { token: string };
        try {
            issued = await issueToken.mutateAsync("browser extension");
        } catch {
            setStage({ state: "error", message: "Could not create a token. Try reloading this page." });
            return;
        }

        const runtime = (window as unknown as { chrome?: { runtime?: MinimalChromeRuntime } }).chrome?.runtime;
        if (!runtime?.sendMessage) {
            setStage({
                state: "error",
                message: "This browser did not expose the extension messaging API.",
            });
            return;
        }

        runtime.sendMessage(
            extensionId,
            { type: "APPLYMIND_CONNECT_TOKEN", token: issued.token, apiBaseUrl: API_BASE_URL },
            (response) => {
                // runtime.lastError is how a failed cross-context call reports itself
                // here — a rejected promise or thrown error would not surface it;
                // this check has to happen inside the callback, read off the same
                // runtime reference rather than a bare global.
                if (runtime.lastError || !response) {
                    setStage({
                        state: "error",
                        message: "The extension did not respond. Make sure it is installed and try again.",
                    });
                    return;
                }
                if (!response.ok) {
                    setStage({ state: "error", message: response.error ?? "The extension refused the token." });
                    return;
                }
                setStage({ state: "done", email: response.email ?? "your account" });
                // Self-close only works on a window this script opened — a plain
                // target="_blank" tab click would refuse this, browsers block a page
                // from closing a tab it didn't create itself. That's exactly why the
                // popup and Sidebar now open this page via window.open() instead of
                // a plain link: without that, this line would silently do nothing.
                window.setTimeout(() => window.close(), 1200);
            },
        );
    }

    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-xl text-ink">Connecting the extension</h1>

            {stage.state === "waiting" && (
                <p className="text-sm text-ink-muted">
                    Looking for the ApplyMind extension in this browser…
                </p>
            )}
            {stage.state === "connecting" && (
                <p className="text-sm text-ink-muted">Creating a token and connecting…</p>
            )}
            {stage.state === "done" && (
                <>
                    <p className="text-sm text-ink">
                        Connected as <strong>{stage.email}</strong>.
                    </p>
                    <p className="text-sm text-ink-muted">
                        You can close this tab and go back to LinkedIn.
                    </p>
                </>
            )}
            {stage.state === "error" && (
                <p className="text-sm text-red-600" role="alert">
                    {stage.message}
                </p>
            )}
        </div>
    );
}