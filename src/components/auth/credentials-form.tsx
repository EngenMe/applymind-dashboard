"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useSignIn, useSignUp } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * One form for both pages.
 *
 * Sign-in and sign-up differ by one optional field, one endpoint and the copy.
 * Two components would be two places to fix the next thing either of them gets
 * wrong about redirects or error mapping.
 */

/** The backend's minimum. Repeated here to spare a round trip, not to enforce. */
const MIN_PASSWORD_LENGTH = 12;

/** bcrypt's ceiling, which the backend surfaces as ErrPasswordTooLong. */
const MAX_PASSWORD_BYTES = 72;

const AFTER_SIGN_IN = "/applications";

/** Same rule as middleware.ts: only same-origin paths are followed. */
function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function CredentialsForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useSignIn();
  const signUp = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";
  const mutation = isSignUp ? signUp : signIn;
  const expired = params.get("expired") === "1";
  const destination = safeNextPath(params.get("next")) ?? AFTER_SIGN_IN;

  const ready = email.trim().length > 0 && password.length > 0;

  /**
   * Local checks exist only for the two rules the backend states as numbers.
   * Everything else — a taken address, a wrong password — is the server's to
   * decide, and guessing at it here would eventually disagree with it.
   */
  function localProblem(): string | null {
    if (!isSignUp) return null;
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
      return `Password must be at most ${MAX_PASSWORD_BYTES} bytes. A shorter passphrase will do.`;
    }
    return null;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || mutation.isPending) return;

    const problem = localProblem();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    const body = {
      email: email.trim(),
      password,
      ...(isSignUp && displayName.trim() ? { display_name: displayName.trim() } : {}),
    };

    mutation.mutate(body, {
      onSuccess: () => router.replace(destination),
      onError: (cause) => setError(describe(cause, isSignUp)),
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {expired && !error ? (
        <p className="text-sm text-ink-muted" role="status">
          Your session ended. Sign in to pick up where you left off.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          disabled={mutation.isPending}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {isSignUp ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-name">Name (optional)</Label>
          <Input
            id="auth-name"
            autoComplete="name"
            value={displayName}
            disabled={mutation.isPending}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          disabled={mutation.isPending}
          onChange={(event) => setPassword(event.target.value)}
        />
        {isSignUp ? (
          <p className="text-sm text-ink-muted">
            At least {MIN_PASSWORD_LENGTH} characters. Length is the whole
            requirement — there are no rules about symbols.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={!ready || mutation.isPending}>
        {mutation.isPending
          ? isSignUp
            ? "Creating account…"
            : "Signing in…"
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="text-sm text-ink-muted">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          href={isSignUp ? "/login" : "/register"}
          className="underline underline-offset-2"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}

/**
 * The backend's messages are written for a reader, so most are shown as-is.
 * Two are not: `invalid_credentials` is deliberately vague about which half was
 * wrong and reads oddly without context, and `email_taken` is more useful with
 * the way out attached.
 */
function describe(cause: unknown, isSignUp: boolean): string {
  if (cause instanceof ApiError) {
    if (cause.code === "invalid_credentials") {
      return "That email and password do not match an account.";
    }
    if (cause.code === "email_taken") {
      return "An account with that email already exists. Sign in instead.";
    }
  }
  return errorMessage(
    cause,
    isSignUp ? "Could not create the account. Try again." : "Could not sign in. Try again.",
  );
}
