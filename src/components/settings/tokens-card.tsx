"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/errors";
import type { ApiTokenSummary, IssuedToken } from "@/lib/api/auth";
import { useApiTokens, useIssueToken, useRevokeToken } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_TOKEN_NAME = "Browser extension";

/**
 * Connecting the extension, and everything already connected.
 *
 * A token is shown exactly once. That is a property of the backend — only the
 * digest is stored — so this component holds the issued value in state and
 * nothing recovers it once the state goes. The copy that says so comes from the
 * server's own `warning` field rather than being written again here.
 */
export function TokensCard() {
  const query = useApiTokens();
  const issue = useIssueToken();
  const revoke = useRevokeToken();

  const [name, setName] = useState(DEFAULT_TOKEN_NAME);
  const [issued, setIssued] = useState<IssuedToken | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const tokens = query.data ?? [];
  const ready = name.trim().length > 0;

  function onIssue(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || issue.isPending) return;

    setIssueError(null);
    issue.mutate(name.trim(), {
      onSuccess: (result) => {
        setIssued(result);
        setName(DEFAULT_TOKEN_NAME);
      },
      onError: (cause) =>
        setIssueError(errorMessage(cause, "Could not create the token. Try again.")),
    });
  }

  function onRevoke(token: ApiTokenSummary) {
    setRowError(null);
    revoke.mutate(token.id, {
      onError: (cause) =>
        setRowError({
          id: token.id,
          message: errorMessage(cause, "Could not revoke this token. Try again."),
        }),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extension connections</CardTitle>
        <CardDescription>
          The extension signs in with a token rather than your password, so it
          never holds anything that could change your account. Revoke one and
          that browser stops saving applications immediately.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {query.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage(query.error, "Could not load your connections. Reload to try again.")}
          </p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing connected yet. Create a token below, then paste it into the
            extension popup.
          </p>
        ) : (
          <ul className="flex flex-col">
            {tokens.map((token) => {
              const busy = revoke.isPending && revoke.variables === token.id;
              const error = rowError?.id === token.id ? rowError.message : null;

              return (
                <li
                  key={token.id}
                  className="flex flex-col gap-2 border-b border-ink/10 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm text-ink">
                        <span className="truncate">{token.name}</span>
                        {token.read_only ? (
                          <span className="shrink-0 text-xs tracking-wide text-ink-muted uppercase">
                            Read only
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-ink-muted">
                        {token.last_used_at
                          ? `Last used ${formatDate(token.last_used_at)}`
                          : "Never used"}
                        {" · created "}
                        {formatDate(token.created_at)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onRevoke(token)}
                    >
                      Revoke
                    </Button>
                  </div>

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

        {issued ? (
          <IssuedTokenPanel issued={issued} onDismiss={() => setIssued(null)} />
        ) : (
          <form onSubmit={onIssue} className="flex flex-col gap-3 border-t border-ink/10 pt-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-ink">Connect the extension</p>
              <p className="text-sm text-ink-muted">
                Name it after the browser you are connecting, so revoking the
                right one later is obvious.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="token-name">Name</Label>
                <Input
                  id="token-name"
                  value={name}
                  disabled={issue.isPending}
                  placeholder={DEFAULT_TOKEN_NAME}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={!ready || issue.isPending}>
                {issue.isPending ? "Creating…" : "Create token"}
              </Button>
            </div>

            {issueError ? (
              <p className="text-sm text-red-600" role="alert">
                {issueError}
              </p>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The one-shot display.
 *
 * Dismissing it is deliberately an explicit click rather than a timeout or a
 * click-anywhere: the value cannot be recovered, so the person should be the
 * one who decides they are done with it.
 */
function IssuedTokenPanel({
  issued,
  onDismiss,
}: {
  issued: IssuedToken;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied, or no permission in this context. The token is
      // on screen and selectable, so this is a missing convenience rather than
      // a failure worth an error message.
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-ink/10 pt-6">
      <p className="text-sm text-ink">{issued.api_token.name} is ready</p>

      <p className="text-sm text-red-600" role="alert">
        {issued.warning}
      </p>

      <code className="block w-full overflow-x-auto rounded-sm border border-ink/10 p-3 font-mono text-sm break-all text-ink">
        {issued.token}
      </code>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy token"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          I have saved it
        </Button>
      </div>

      <p className="text-sm text-ink-muted">
        Open the ApplyMind extension, paste this into the token field, and save.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
