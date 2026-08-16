import { describe, expect, it } from "vitest";
import { decide, safeNextPath } from "./middleware";

/**
 * `decide` is tested rather than `middleware` itself: the interesting part is
 * the rule, and a NextRequest built in jsdom would be testing next/server.
 */

describe("decide — signed out", () => {
  it("sends a protected route to login, remembering where it was going", () => {
    expect(decide("/applications", "", null, false)).toEqual({
      redirectTo: "/login?next=%2Fapplications",
    });
  });

  it("keeps the query string on the remembered destination", () => {
    expect(decide("/applications", "?status=Applied", null, false)).toEqual({
      redirectTo: "/login?next=%2Fapplications%3Fstatus%3DApplied",
    });
  });

  it("protects nested routes as well as the section root", () => {
    expect(decide("/applications/abc-123", "", null, false)).not.toBeNull();
    expect(decide("/cvs", "", null, false)).not.toBeNull();
    expect(decide("/cover-letters", "", null, false)).not.toBeNull();
    expect(decide("/settings", "", null, false)).not.toBeNull();
  });

  it("leaves the auth pages alone", () => {
    expect(decide("/login", "", null, false)).toBeNull();
    expect(decide("/register", "", null, false)).toBeNull();
  });

  it("sends the root path to login, same as any other protected route", () => {
    // "/" isn't a real page on applymind.dev — it only dispatches. Signed out,
    // that's /login. (On the showcase deployment DEMO_MODE short-circuits
    // before decide() ever runs, so this rule never applies there.)
    expect(decide("/", "", null, false)).toEqual({ redirectTo: "/login" });
  });

  it("does not protect a route that merely starts with a protected name", () => {
    expect(decide("/applications-archive", "", null, false)).toBeNull();
  });
});

describe("decide — signed in", () => {
  it("lets protected routes through", () => {
    expect(decide("/applications", "", null, true)).toBeNull();
  });

  it("sends the root path to the applications list", () => {
    expect(decide("/", "", null, true)).toEqual({ redirectTo: "/applications" });
  });

  it("sends the auth pages to the applications list", () => {
    expect(decide("/login", "", null, true)).toEqual({ redirectTo: "/applications" });
    expect(decide("/register", "", null, true)).toEqual({ redirectTo: "/applications" });
  });

  it("prefers the remembered destination over the default", () => {
    expect(decide("/login", "?next=%2Fcvs", "/cvs", true)).toEqual({ redirectTo: "/cvs" });
  });

  it("ignores a destination pointing off-site", () => {
    expect(decide("/login", "", "https://evil.example", true)).toEqual({
      redirectTo: "/applications",
    });
  });
});

describe("safeNextPath", () => {
  it("accepts same-origin paths", () => {
    expect(safeNextPath("/cvs")).toBe("/cvs");
    expect(safeNextPath("/applications?status=Applied")).toBe("/applications?status=Applied");
  });

  it("rejects anything that could leave the origin", () => {
    // //host and /\host are both protocol-relative URLs to a browser, despite
    // looking like paths.
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});