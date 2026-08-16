import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@/lib/api/auth";

/**
 * The server-side half of authentication.
 *
 * middleware.ts checks only that a cookie exists, because it cannot afford a
 * round trip on every navigation. That leaves one gap: a cookie that is present
 * but revoked or expired. This closes it, on the server, once per protected
 * page render — and produces the signed-in user as a by-product, which the
 * header needs anyway to say who you are.
 *
 * It calls the API directly rather than through /api/backend, because a server
 * component fetching its own app's route handler is a request the process makes
 * to itself for no benefit.
 */

const BASE_URL = process.env.APPLYMIND_API_BASE_URL;

/**
 * True on the portfolio showcase deployment — same env var, same meaning as
 * DEMO_MODE in middleware.ts and api/backend/[...path]/route.ts. requireUser()
 * checks it directly rather than relying on middleware to have already handled
 * it: middleware's DEMO_MODE branch only touches /login and /register, so
 * every other route — including everything under (protected) — reaches this
 * file. Without this check, visiting /applications on the showcase deployment
 * would fail requireUser() (there is no session cookie there, ever) and get
 * redirected through /auth/expire to the real login — which would make the
 * entire showcase unreachable, defeating the one thing DEMO_MODE exists for.
 */
const DEMO_MODE = process.env.DEMO_MODE === "true";

/** Must match SessionCookieName in the backend's auth handler. */
export const SESSION_COOKIE = "applymind_session";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !BASE_URL) return null;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL.replace(/\/$/, "")}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
    });
  } catch {
    /**
     * The API is unreachable, which is not the same as being signed out —
     * but from here the two are indistinguishable, and treating an outage as a
     * session failure would sign everyone out whenever the Lambda hiccups.
     * Returning null lets the caller decide; requireUser sends them to /login,
     * where the error is at least visible and retrying is one click.
     */
    return null;
  }

  if (!response.ok) return null;

  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

/**
 * The current user, or a redirect to sign in.
 *
 * Returns null immediately in demo mode, without ever calling getCurrentUser()
 * or redirecting — there is no login on this deployment, so "no user" isn't a
 * failure here the way it is on applymind.dev. Callers that only use this to
 * gate a route (the (protected) layout) already treat the return value as
 * disposable, so this doesn't change anything for them.
 */
export async function requireUser(): Promise<AuthUser | null> {
  if (DEMO_MODE) return null;

  const user = await getCurrentUser();
  if (!user) redirect("/auth/expire");
  return user;
}