import { NextRequest, NextResponse } from "next/server";
import { planRequest } from "@/lib/api/proxy-policy";

/**
 * Server-side proxy to the API Gateway.
 *
 * It exists for the same reason it always did: the browser must never hold a
 * credential JavaScript can read. What changed in phase 16 is which credential.
 * There is no longer a shared key standing in for the one user — there is a
 * session cookie belonging to a specific one, and this route's job is to carry
 * it upstream and carry the backend's Set-Cookie back down.
 *
 * The cookie itself is httpOnly and never legible here or in the page. This
 * route only moves it.
 *
 * /api/backend/applications?status=Applied  ->  {BASE}/applications?status=Applied
 */

const BASE_URL = process.env.APPLYMIND_API_BASE_URL;

/** Must match SessionCookieName in the backend's auth handler. */
const SESSION_COOKIE = "applymind_session";

/**
 * The credential signed-out visitors read with.
 *
 * Issue it from a demo account with read_only: true — the backend's middleware
 * then refuses writes on it regardless of what this route forwards, so a bug
 * here cannot turn into a stranger writing rows. APPLYMIND_API_KEY is still
 * read as a fallback so an existing deployment keeps working after this deploy;
 * it should be replaced with a real read-only token.
 *
 * Leave it unset and signed-out visitors get 401s, which is the right answer
 * for a deployment that is nobody's demo.
 */
const DEMO_TOKEN = process.env.APPLYMIND_DEMO_TOKEN ?? process.env.APPLYMIND_API_KEY;

/**
 * When true, mutations from signed-out visitors are answered here, synthetically,
 * and never forwarded.
 *
 * Before phase 16 this had to be a whole-deployment switch because there was no
 * way to tell one caller from another. Now there is, so it applies only to
 * callers with no session: signed in, every request is real, on any deployment.
 */
const DEMO_MODE = process.env.DEMO_MODE === "true";

const HOP_BY_HOP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "host",
]);

function misconfigured(detail: string): NextResponse {
  return NextResponse.json(
    { error: { code: "dashboard_misconfigured", message: detail } },
    { status: 500 },
  );
}

/**
 * No session, and nothing to fall back to.
 *
 * Deliberately the same envelope the backend would have sent, so call sites see
 * one shape of 401 whether the proxy or the API produced it.
 */
function unauthenticated(): NextResponse {
  return NextResponse.json(
    { error: { code: "unauthenticated", message: "Sign in to continue." } },
    { status: 401 },
  );
}

/**
 * Answers a mutating request without ever contacting the real backend.
 *
 * DELETE gets a real 204 — nothing to fake, and it matches the shape callers
 * already expect. Everything else gets a 200 whose body echoes back whatever
 * JSON the caller sent, plus a synthetic id/timestamp where the path or a
 * fresh value is the only sensible source for one. The intent is not for this
 * body to be a complete, faithful resource — it's for mutation hooks to merge
 * `variables` (what they just sent) onto their own cached copy of the item
 * rather than trust the network response to be complete. See
 * lib/hooks/use-sites.ts for the pattern.
 *
 * File uploads (multipart form data — CV uploads) are refused with a clear
 * message instead of faked: there's no real file to derive a size, hash, or
 * S3 key from, and a fabricated one would just look broken (wrong size,
 * dead download link). Better to say plainly that it's disabled here.
 */
async function fakeMutation(request: NextRequest, path: string[]): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        error: {
          code: "demo_uploads_disabled",
          message: "File uploads are turned off in the public demo.",
        },
      },
      { status: 403 },
    );
  }

  if (request.method === "DELETE") {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // No JSON body (e.g. the sites toggle, which sends {}), fine either way.
  }

  const id = path.at(-1);

  return NextResponse.json(
    {
      ...body,
      ...(id ? { id } : {}),
      updated_at: new Date().toISOString(),
    },
    { status: request.method === "POST" ? 201 : 200 },
  );
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  if (!BASE_URL) {
    return misconfigured(
      "Set APPLYMIND_API_BASE_URL in .env.local, then restart the dev server.",
    );
  }

  const plan = planRequest({
    signedIn: Boolean(request.cookies.get(SESSION_COOKIE)?.value),
    isAuthRoute: path[0] === "auth",
    method: request.method,
    demoMode: DEMO_MODE,
    hasDemoToken: Boolean(DEMO_TOKEN),
  });

  if (plan.action === "unauthenticated") return unauthenticated();
  if (plan.action === "fake") return fakeMutation(request, path);

  const target = new URL(`${BASE_URL.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  // The cookie rides along in the copy above. What must not is a bearer token
  // on top of it: two credentials on one request leaves which identity the
  // backend picks up to the order its middleware happens to check them in.
  const usingDemoCredential = plan.credential === "demo";
  if (usingDemoCredential) {
    headers.set("Authorization", `Bearer ${DEMO_TOKEN}`);
  } else {
    headers.delete("Authorization");
    headers.delete("x-api-key");
  }

  const hasBody = request.method !== "GET" && request.method !== "DELETE";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by undici when streaming a request body.
      duplex: hasBody ? "half" : undefined,
      cache: "no-store",
    } as RequestInit);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "backend_unreachable",
          message: "The API did not respond. Check the base URL and that the stage is deployed.",
        },
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    // set-cookie is handled below. Copying it here would fold multiple cookies
    // into one comma-joined string, which browsers do not unpick.
    if (name !== "set-cookie" && !HOP_BY_HOP.has(name)) responseHeaders.set(key, value);
  });

  /**
   * The login and logout responses carry the session cookie, and this is the
   * only place it can cross domains: the backend set it host-only for the API
   * host, and re-emitting it here re-homes it on the dashboard's own origin.
   * Drop this and sign-in returns 200 with nothing to show for it.
   */
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  // Lets the client render the demo banner from what actually happened, rather
  // than inferring it from a build-time flag it cannot see.
  if (usingDemoCredential) responseHeaders.set("x-applymind-demo", "1");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function POST(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}

export const dynamic = "force-dynamic";
