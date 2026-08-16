import { request } from "./client";

/**
 * The auth module's endpoints, in the shape handler.go returns them.
 *
 * These types live here rather than in types.ts only because types.ts was not
 * in front of me when this was written — moving them there is a straight cut
 * and paste if you would rather they sat with the rest.
 */

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  email_verified_at: string | null;
}

export interface SessionSummary {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  /** True for the session making this request — revoking it signs you out. */
  current: boolean;
}

export interface ApiTokenSummary {
  id: string;
  name: string;
  read_only: boolean;
  last_used_at: string | null;
  created_at: string;
}

/**
 * The one response that ever carries a raw token.
 *
 * `warning` is the backend's own wording. Render it rather than writing a
 * second copy here: one sentence about an unrecoverable value is easier to keep
 * true than two.
 */
export interface IssuedToken {
  token: string;
  warning: string;
  api_token: ApiTokenSummary;
}

export interface Credentials {
  email: string;
  password: string;
  display_name?: string | null;
}

/**
 * Register and login return the user, and set the session cookie through a
 * header the proxy forwards. Nothing here touches the cookie, and nothing can.
 */
export async function register(body: Credentials): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body,
  });
  return data.user;
}

export async function login(body: Credentials): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body,
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" });
}

export async function me(): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function listSessions(): Promise<SessionSummary[]> {
  const data = await request<{ sessions: SessionSummary[] }>("/auth/sessions");
  return data.sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await request<void>(`/auth/sessions/${id}`, { method: "DELETE" });
}

export async function listTokens(): Promise<ApiTokenSummary[]> {
  const data = await request<{ api_tokens: ApiTokenSummary[] }>("/auth/tokens");
  return data.api_tokens;
}

/**
 * Issues a token for the extension.
 *
 * read_only is not a parameter. The extension's whole job is writing
 * applications, so a read-only one produces an extension that appears to work
 * and silently saves nothing — the failure this codebase goes out of its way to
 * avoid elsewhere. A restricted token is a thing you issue deliberately for a
 * public demo, not something to offer mid-flow to someone connecting a browser.
 */
export async function issueToken(name: string): Promise<IssuedToken> {
  return request<IssuedToken>("/auth/tokens", {
    method: "POST",
    body: { name, read_only: false },
  });
}

export async function revokeToken(id: string): Promise<void> {
  await request<void>(`/auth/tokens/${id}`, { method: "DELETE" });
}
