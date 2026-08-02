import type { ApiErrorBody } from "./types";

/**
 * Everything from the browser goes through the Next.js proxy at /api/backend/*,
 * which adds the API key server-side. Set NEXT_PUBLIC_API_PROXY_PATH only if you
 * mount the proxy somewhere else.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_API_PROXY_PATH ?? "/api/backend";

/** An error the backend described in its `{"error": {...}}` envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** True for the 404 the coverletters module returns when there is no letter. */
  get isNotFound() {
    return this.status === 404;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. Mutually exclusive with `formData`. */
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

async function readError(response: Response): Promise<ApiError> {
  let code = "unknown_error";
  let message = `Request failed with status ${response.status}`;
  try {
    const parsed = (await response.json()) as Partial<ApiErrorBody>;
    if (parsed?.error?.code) code = parsed.error.code;
    if (parsed?.error?.message) message = parsed.error.message;
  } catch {
    // Non-JSON body (a gateway error page, usually) — keep the defaults.
  }
  return new ApiError(response.status, code, message);
}

/**
 * One request against the backend. Returns the decoded JSON body, or undefined
 * for a 204 (DELETE).
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, signal } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (formData) {
    // Let the browser set the multipart boundary.
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_PATH}${path}`, {
    method,
    headers,
    body: payload,
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await readError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
