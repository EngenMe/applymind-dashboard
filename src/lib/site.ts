/**
 * The one deployment with a working login. Both middleware.ts and
 * main-nav.tsx point here — never at a relative /login, never at the
 * showcase domain's own origin. A plain exported constant rather than an
 * env var: it isn't configuration that varies by deployment, it's a fact
 * about the world (there is exactly one real app), so it doesn't need
 * NEXT_PUBLIC_ handling to reach the browser bundle.
 */
export const REAL_APP_ORIGIN = "https://applymind.dev";
export const REAL_APP_LOGIN_URL = `${REAL_APP_ORIGIN}/login`;
export const REAL_APP_REGISTER_URL = `${REAL_APP_ORIGIN}/register`;