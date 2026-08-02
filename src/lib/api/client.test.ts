import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, buildQuery, request } from "./client";

/**
 * Every call the dashboard makes goes through `request`, so this file is mostly
 * about the shape of what reaches fetch: the proxy prefix, the headers, and how
 * a failure turns into an ApiError the UI can put on screen.
 */

function ok(body: unknown, status = 200) {
  return {
    ok: true,
    status,
    json: async () => body,
  };
}

function failure(status: number, body?: unknown) {
  return {
    ok: false,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError("not json");
      return body;
    },
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildQuery", () => {
  it("returns an empty string when there is nothing to ask for", () => {
    expect(buildQuery()).toBe("");
    expect(buildQuery({})).toBe("");
  });

  it("prefixes a question mark only when there is something to add", () => {
    expect(buildQuery({ status: "Applied" })).toBe("?status=Applied");
  });

  it("drops undefined, null and empty values so cleared filters vanish", () => {
    expect(
      buildQuery({ status: undefined, site_id: null, company: "", q: "acme" }),
    ).toBe("?q=acme");
  });

  it("keeps false and zero, which are real values", () => {
    expect(buildQuery({ active: false })).toBe("?active=false");
    expect(buildQuery({ offset: 0 })).toBe("?offset=0");
  });

  it("encodes values", () => {
    expect(buildQuery({ company: "Acme Ltd" })).toBe("?company=Acme+Ltd");
  });

  it("keeps several parameters in insertion order", () => {
    expect(buildQuery({ status: "Applied", limit: 20 })).toBe("?status=Applied&limit=20");
  });
});

describe("ApiError", () => {
  it("carries the status, code and message", () => {
    const error = new ApiError(409, "site_in_use", "applications still reference this site");

    expect(error.status).toBe(409);
    expect(error.code).toBe("site_in_use");
    expect(error.message).toBe("applications still reference this site");
    expect(error.name).toBe("ApiError");
  });

  it("knows a 404 from anything else", () => {
    expect(new ApiError(404, "not_found", "gone").isNotFound).toBe(true);
    expect(new ApiError(409, "conflict", "nope").isNotFound).toBe(false);
    expect(new ApiError(500, "internal_error", "boom").isNotFound).toBe(false);
  });
});

describe("request", () => {
  it("goes through the proxy path and returns the decoded body", async () => {
    fetchMock.mockResolvedValue(ok({ sites: [] }));

    const result = await request<{ sites: unknown[] }>("/sites");

    expect(result).toEqual({ sites: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/backend/sites");
  });

  it("defaults to GET with no body and no content type", async () => {
    fetchMock.mockResolvedValue(ok({}));

    await request("/sites");

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({});
    expect(init.cache).toBe("no-store");
  });

  it("serialises a JSON body and declares its type", async () => {
    fetchMock.mockResolvedValue(ok({ id: "site-1" }, 201));

    await request("/sites", { method: "POST", body: { name: "Acme", domain: "acme.com" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Acme", domain: "acme.com" }));
  });

  it("leaves the content type off form data so the browser sets the boundary", async () => {
    fetchMock.mockResolvedValue(ok({}));
    const form = new FormData();
    form.set("file", "pretend");

    await request("/cvs", { method: "POST", formData: form });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("passes an abort signal through", async () => {
    fetchMock.mockResolvedValue(ok({}));
    const controller = new AbortController();

    await request("/sites", { signal: controller.signal });

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("returns undefined for a 204, which is what DELETE answers", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => undefined });

    await expect(request("/sites/site-1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("turns the error envelope into an ApiError", async () => {
    fetchMock.mockResolvedValue(
      failure(409, {
        error: {
          code: "site_is_preconfigured",
          message: "pre-configured sites cannot be deleted — deactivate it instead",
        },
      }),
    );

    await expect(request("/sites/site-1", { method: "DELETE" })).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "site_is_preconfigured",
      message: "pre-configured sites cannot be deleted — deactivate it instead",
    });
  });

  it("still throws something usable when the failure body is not JSON", async () => {
    fetchMock.mockResolvedValue(failure(502));

    await expect(request("/sites")).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      code: "unknown_error",
      message: "Request failed with status 502",
    });
  });

  it("keeps the status when the JSON body has no error envelope", async () => {
    fetchMock.mockResolvedValue(failure(500, { something: "else" }));

    await expect(request("/sites")).rejects.toMatchObject({
      status: 500,
      code: "unknown_error",
    });
  });

  it("lets a network failure surface as itself, not as an ApiError", async () => {
    const network = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(network);

    await expect(request("/sites")).rejects.toBe(network);
  });
});
