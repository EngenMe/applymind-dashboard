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

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  if (!BASE_URL || !API_KEY) return misconfigured();

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
