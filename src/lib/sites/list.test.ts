import { describe, expect, it } from "vitest";
import type { Site } from "@/lib/api/types";
import { canDelete, isActive, isPreconfigured, sortSites } from "./list";

function site(overrides: Partial<Site> & { name: string }): Site {
  return {
    id: `id-${overrides.name}`,
    domain: `${overrides.name.toLowerCase()}.com`,
    ...overrides,
  };
}

describe("isPreconfigured", () => {
  it("is true only when the flag is explicitly set", () => {
    expect(isPreconfigured(site({ name: "LinkedIn", is_preconfigured: true }))).toBe(true);
    expect(isPreconfigured(site({ name: "Mine", is_preconfigured: false }))).toBe(false);
    expect(isPreconfigured(site({ name: "Unknown" }))).toBe(false);
  });
});

describe("isActive", () => {
  it("defaults a missing flag to active", () => {
    expect(isActive(site({ name: "Unknown" }))).toBe(true);
    expect(isActive(site({ name: "On", is_active: true }))).toBe(true);
    expect(isActive(site({ name: "Off", is_active: false }))).toBe(false);
  });
});

describe("canDelete", () => {
  it("refuses pre-configured sites", () => {
    expect(canDelete(site({ name: "LinkedIn", is_preconfigured: true }))).toBe(false);
  });

  it("allows custom sites", () => {
    expect(canDelete(site({ name: "Mine", is_preconfigured: false }))).toBe(true);
  });
});

describe("sortSites", () => {
  it("puts pre-configured sites first, alphabetical within each group", () => {
    const sorted = sortSites([
      site({ name: "Zebra Careers", is_preconfigured: false }),
      site({ name: "Indeed", is_preconfigured: true }),
      site({ name: "Acme Jobs", is_preconfigured: false }),
      site({ name: "LinkedIn", is_preconfigured: true }),
    ]);

    expect(sorted.map((s) => s.name)).toEqual([
      "Indeed",
      "LinkedIn",
      "Acme Jobs",
      "Zebra Careers",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [
      site({ name: "Zebra", is_preconfigured: false }),
      site({ name: "Indeed", is_preconfigured: true }),
    ];
    sortSites(input);
    expect(input.map((s) => s.name)).toEqual(["Zebra", "Indeed"]);
  });
});
