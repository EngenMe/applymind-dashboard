"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/errors";
import type { SessionSummary } from "@/lib/api/auth";
import { useRevokeSession, useSessions } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Every browser currently signed in to this account.
 *
 * Revoking the one you are using is allowed and is sometimes the point — it is
 * how you undo a sign-in you regret. It is confirmed first, because the
 * consequence lands on the person clicking rather than on the row.
 */
export function SessionsCard() {
  const query = useSessions();
  const revoke = useRevokeSession();

  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const sessions = query.data ?? [];

  function onRevoke(session: SessionSummary) {
    if (session.current && confirming !== session.id) {
      setConfirming(session.id);
      return;
    }
    setConfirming(null);
    setRowError(null);
    revoke.mutate(session.id, {
      onError: (cause) =>
        setRowError({
          id: session.id,
          message: errorMessage(cause, "Could not end this session. Try again."),
        }),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed in browsers</CardTitle>
        <CardDescription>
          Each sign-in creates a session that lasts thirty days, renewed every
          time you use it. End one to sign that browser out immediately.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {query.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage(query.error, "Could not load your sessions. Reload to try again.")}
          </p>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((session) => {
              const busy = revoke.isPending && revoke.variables === session.id;
              const error = rowError?.id === session.id ? rowError.message : null;

              return (
                <li
                  key={session.id}
                  className="flex flex-col gap-2 border-b border-ink/10 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm text-ink">
                        <span className="truncate">{describeAgent(session.user_agent)}</span>
                        {session.current ? (
                          <span className="shrink-0 text-xs tracking-wide text-ink-muted uppercase">
                            This browser
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-ink-muted">
                        {session.ip_address ?? "Unknown address"} · started{" "}
                        {formatDate(session.created_at)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onRevoke(session)}
                    >
                      {confirming === session.id ? "Sign out here?" : "End session"}
                    </Button>
                  </div>

                  {confirming === session.id ? (
                    <p className="text-sm text-ink-muted" role="status">
                      This is the browser you are using. Ending it signs you out now.
                    </p>
                  ) : null}

                  {error ? (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A user agent string is not something to put in front of someone whole. This
 * pulls out the browser and platform and drops the rest; an unrecognised one
 * falls back to the raw value, which is still better than nothing to identify
 * a session by.
 */
function describeAgent(agent: string | null): string {
  if (!agent) return "Unknown browser";

  const browser =
    /Edg\//.test(agent) ? "Edge"
    : /OPR\//.test(agent) ? "Opera"
    : /Firefox\//.test(agent) ? "Firefox"
    : /Chrome\//.test(agent) ? "Chrome"
    : /Safari\//.test(agent) ? "Safari"
    : null;

  const platform =
    /Windows/.test(agent) ? "Windows"
    : /Android/.test(agent) ? "Android"
    : /iPhone|iPad/.test(agent) ? "iOS"
    : /Mac OS X/.test(agent) ? "macOS"
    : /Linux/.test(agent) ? "Linux"
    : null;

  if (!browser) return agent;
  return platform ? `${browser} on ${platform}` : browser;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
