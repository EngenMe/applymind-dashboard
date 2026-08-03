import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to the API Gateway.
 *
 * React Query runs in the browser, so anything it calls directly would need the
 * API key in a NEXT_PUBLIC_ variable — which means shipping the key to every
 * visitor. Instead the browser calls this route on the same origin and the key
 * is attached here, where it stays on the server.
 *
 * /api/backend/applications?status=Applied  ->  {BASE}/applications?status=Applied
 */

const BASE_URL = process.env.APPLYMIND_API_BASE_URL;
const API_KEY = process.env.APPLYMIND_API_KEY;

/**
 * When true, this deployment is a public demo: every mutating request is
 * answered here, synthetically, and never forwarded to the real backend. GETs
 * always pass through untouched, so browsing the seeded demo data works
 * normally — only writes are intercepted.
 *
 * This is deliberately a whole-deployment switch, not a per-user check: there
 * is no login yet, so there is no "guest" to distinguish from "you" within a
 * single deployment. Set DEMO_MODE=true on this domain's Vercel project; leave
 * it unset (or false) on the future authenticated deployment on its own
 * domain, whenever that exists.
 */
const DEMO_MODE = process.env.DEMO_MODE === "true";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const HOP_BY_HOP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "host",
]);

function misconfigured(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "dashboard_misconfigured",
        message:
          "Set APPLYMIND_API_BASE_URL and APPLYMIND_API_KEY in .env.local, then restart the dev server.",
      },
    },
    { status: 500 },
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
  if (!BASE_URL || !API_KEY) return misconfigured();

  if (DEMO_MODE && MUTATING_METHODS.has(request.method)) {
    return fakeMutation(request, path);
  }

  const target = new URL(`${BASE_URL.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("Authorization", `Bearer ${API_KEY}`);
  // Some deployments read the key from x-api-key instead; sending both costs
  // nothing and saves a round of debugging.
  headers.set("x-api-key", API_KEY);

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
    if (!HOP_BY_HOP.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

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
