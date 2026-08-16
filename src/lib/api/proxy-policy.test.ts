import { describe, expect, it } from "vitest";
import { planRequest, type ProxyContext } from "./proxy-policy";

const base: ProxyContext = {
  signedIn: false,
  isAuthRoute: false,
  method: "GET",
  demoMode: false,
  hasDemoToken: false,
};

const plan = (overrides: Partial<ProxyContext>) => planRequest({ ...base, ...overrides });

describe("planRequest — signed in", () => {
  it("forwards reads and writes on the session", () => {
    expect(plan({ signedIn: true })).toEqual({ action: "forward", credential: "session" });
    expect(plan({ signedIn: true, method: "POST" })).toEqual({
      action: "forward",
      credential: "session",
    });
  });

  it("never fakes a mutation, even on a demo deployment", () => {
    expect(plan({ signedIn: true, method: "POST", demoMode: true })).toEqual({
      action: "forward",
      credential: "session",
    });
  });

  it("never lends the demo credential to a request that already has a session", () => {
    expect(plan({ signedIn: true, hasDemoToken: true, demoMode: true })).toEqual({
      action: "forward",
      credential: "session",
    });
  });
});

describe("planRequest — auth routes", () => {
  it("forwards sign-in unauthenticated rather than faking it", () => {
    // The trap: without this, fakeMutation answers a login with a fabricated
    // 201 and no cookie, and sign-in appears to succeed and do nothing.
    expect(plan({ isAuthRoute: true, method: "POST", demoMode: true })).toEqual({
      action: "forward",
      credential: "none",
    });
  });

  it("does not lend the demo credential to /auth/me", () => {
    // Otherwise a signed-out visitor is told they are the demo account.
    expect(plan({ isAuthRoute: true, hasDemoToken: true })).toEqual({
      action: "forward",
      credential: "none",
    });
  });

  it("carries the session when there is one", () => {
    expect(plan({ isAuthRoute: true, signedIn: true, method: "POST" })).toEqual({
      action: "forward",
      credential: "session",
    });
  });
});

describe("planRequest — signed out", () => {
  it("reads demo data when a demo credential exists", () => {
    expect(plan({ hasDemoToken: true })).toEqual({ action: "forward", credential: "demo" });
  });

  it("refuses reads when there is nothing to read as", () => {
    expect(plan({})).toEqual({ action: "unauthenticated" });
  });

  it("fakes writes on a demo deployment", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(plan({ method, demoMode: true, hasDemoToken: true })).toEqual({ action: "fake" });
    }
  });

  it("refuses writes when this is not a demo deployment", () => {
    expect(plan({ method: "POST", hasDemoToken: true })).toEqual({
      action: "unauthenticated",
    });
  });
});
