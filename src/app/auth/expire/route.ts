import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Clears an invalid session cookie, then sends the browser on to /login.
 *
 * requireUser() runs inside a layout's render, and Next only allows cookies()
 * to be mutated in a Route Handler or Server Action — never during a Server
 * Component's render. So requireUser() can *detect* an expired or revoked
 * cookie, but it cannot remove it. Without removal, middleware.ts — which only
 * checks that a cookie exists, deliberately, to avoid a Lambda round trip on
 * every navigation — keeps seeing one and keeps letting protected routes
 * through, which requireUser() then keeps rejecting. That is the redirect
 * loop this file exists to break: nothing upstream of here is allowed to
 * remove the thing causing it.
 *
 * requireUser() redirects here instead of straight to /login when the session
 * turns out invalid. This is the only extra hop, and only on that path — a
 * valid session never touches this route.
 */
export function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL("/login?expired=1", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
}