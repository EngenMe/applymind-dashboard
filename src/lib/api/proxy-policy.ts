/**
 * What the proxy should do with one request, decided without touching one.
 *
 * The rules here are small but they interact — signed in or not, auth route or
 * not, mutating or not, demo or not — and getting them wrong is quiet: a
 * fabricated login response, or a demo credential attached to a request that
 * already had a session. Keeping the decision separate from the plumbing means
 * it can be enumerated in a test rather than reasoned about.
 */

export type ProxyPlan =
  /** Send it upstream. `credential` says what authenticates it. */
  | { action: "forward"; credential: "session" | "demo" | "none" }
  /** Answer synthetically, without contacting the backend. */
  | { action: "fake" }
  /** Refuse: no session, and no demo credential to stand in for one. */
  | { action: "unauthenticated" };

export interface ProxyContext {
  /** A session cookie was present. Not that it was valid — only the API knows. */
  signedIn: boolean;
  /** First path segment is `auth`. */
  isAuthRoute: boolean;
  method: string;
  demoMode: boolean;
  hasDemoToken: boolean;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isMutating(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function planRequest(context: ProxyContext): ProxyPlan {
  /**
   * /auth/* is how a caller stops being signed out, so it is never faked and
   * never carries the demo credential. Faking it would answer a login with a
   * fabricated 201 and no cookie; lending it the demo credential would make
   * GET /auth/me return the demo account, and the dashboard would believe a
   * signed-out visitor was signed in as somebody else.
   */
  if (context.isAuthRoute) {
    return { action: "forward", credential: context.signedIn ? "session" : "none" };
  }

  if (context.signedIn) {
    return { action: "forward", credential: "session" };
  }

  if (isMutating(context.method)) {
    return context.demoMode ? { action: "fake" } : { action: "unauthenticated" };
  }

  return context.hasDemoToken
    ? { action: "forward", credential: "demo" }
    : { action: "unauthenticated" };
}
