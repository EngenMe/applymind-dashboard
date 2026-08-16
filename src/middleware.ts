import { NextResponse, type NextRequest } from "next/server";
import { REAL_APP_LOGIN_URL, REAL_APP_REGISTER_URL } from "@/lib/site";

/**
 * Route protection for the dashboard.
 *
 * This checks only that a session cookie is *present*. It cannot check that the
 * cookie is valid without calling the API, and doing that here would put a
 * Lambda round trip in front of every navigation — cold starts included — to
 * answer a question the authenticated layout answers anyway when it loads the
 * signed-in user. A revoked or expired cookie therefore gets past this file and
 * is caught there, which redirects to /login?expired=1 and clears it.
 *
 * The cookie is httpOnly, so nothing here can read its contents, and nothing
 * here should try to: presence is a routing hint, never an authorisation
 * decision. Authorisation happens in the API.
 *
 * This repo deploys twice: applymind.dev (this file, real auth) and the
 * portfolio showcase at applymind.faroukhasnaoui.tech (DEMO_MODE=true, no
 * login at all — see DEMO_MODE in api/backend/[...path]/route.ts, same env
 * var, same meaning). The check below is what keeps the showcase deployment
 * open; without it every visitor there would hit a /login page that
 * deployment was never meant to have.
 */

/** True on the portfolio showcase deployment. */
const DEMO_MODE = process.env.DEMO_MODE === "true";

/** Must match SessionCookieName in the backend's auth handler. */
const SESSION_COOKIE = "applymind_session";

const PROTECTED_PREFIXES = [
  "/applications",
  "/cvs",
  "/cover-letters",
  "/settings",
  // Needs a real session same as the others — issuing a token requires being
  // signed in. Missing from this list meant a signed-out visit fell through
  // to requireUser()'s redirect instead of middleware's, which does not
  // preserve where the request was headed — see /auth/expire/route.ts. That
  // silently dropped the destination and landed everyone on /applications
  // regardless of what they'd actually clicked.
  "/connect-extension",
] as const;

const AUTH_PAGES = ["/login", "/register"] as const;

/**
 * "/" is not a page of its own on applymind.dev — it only decides where to
 * send someone. Signed in, that's the applications list; signed out, /login.
 * (On the showcase deployment DEMO_MODE short-circuits before this matters,
 * so "/" there stays the real marketing/landing page.)
 */
const ROOT = "/";

/** Where a successful sign-in lands when there is no remembered destination. */
const AFTER_SIGN_IN = "/applications";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Validates a `?next=` destination before redirecting to it.
 *
 * Without this the parameter is an open redirect: /login?next=https://evil.example
 * would send a freshly signed-in user off-site with the referrer intact. Only
 * same-origin paths survive. `//host` and `/\host` are both protocol-relative
 * URLs in a browser despite looking like paths, so they are rejected too.
 *
 * Exported because the sign-in page reads the same parameter and must apply the
 * same rule — a check that lives in only one of the two places is one somebody
 * routes around by accident.
 */
export function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Where a request should go. `null` means leave it alone. */
export type Decision = { redirectTo: string } | null;

/**
 * The routing decision, as a pure function of the URL and whether a cookie was
 * present. Separated from `middleware` so it can be tested directly, rather
 * than through a NextRequest the test environment may or may not construct.
 */
export function decide(
    pathname: string,
    search: string,
    nextParam: string | null,
    hasSession: boolean,
): Decision {
  if (pathname === ROOT) {
    return { redirectTo: hasSession ? AFTER_SIGN_IN : "/login" };
  }

  if (AUTH_PAGES.includes(pathname as (typeof AUTH_PAGES)[number])) {
    if (!hasSession) return null;
    return { redirectTo: safeNextPath(nextParam) ?? AFTER_SIGN_IN };
  }

  if (hasSession || !isProtected(pathname)) return null;

  // Remember where they were headed so sign-in can return them to it, rather
  // than dropping everyone on the applications list and losing the deep link
  // that brought them here — typically an /applications/{id} from an email.
  const login = new URLSearchParams({ next: `${pathname}${search}` });
  return { redirectTo: `/login?${login.toString()}` };
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search, searchParams } = request.nextUrl;

  if (DEMO_MODE) {
    // The one exception to "leave everything alone" in demo mode: /login and
    // /register exist as routes in this codebase (they have to, since it's
    // the same build as applymind.dev), but they must never actually render
    // here — there is no session system on this deployment to sign in to.
    // Absolute URLs, deliberately: a relative redirect would stay on this
    // origin (or on localhost, when testing DEMO_MODE locally), and the
    // whole point is that the only real login lives at applymind.dev.
    if (pathname === "/login") return NextResponse.redirect(REAL_APP_LOGIN_URL);
    if (pathname === "/register") return NextResponse.redirect(REAL_APP_REGISTER_URL);
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const decision = decide(pathname, search, searchParams.get("next"), hasSession);
  if (!decision) return NextResponse.next();

  return NextResponse.redirect(new URL(decision.redirectTo, request.url));
}

export const config = {
  /**
   * `api/backend` is excluded deliberately. The proxy must answer an
   * unauthenticated request with the API's own 401 JSON; a 307 to /login here
   * would hand fetch() an HTML page and surface as a JSON parse error at the
   * call site, which is a considerably worse thing to debug than a 401.
   */
  matcher: [
    "/((?!api/backend|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};