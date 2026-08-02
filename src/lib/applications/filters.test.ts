import { describe, expect, it } from "vitest";
import {
  ALL,
  applyLocalSearch,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  effectiveDate,
  hasActiveFilters,
  nextSort,
  PAGE_SIZE,
  sortApplications,
  toListParams,
  type ApplicationFilters,
} from "./filters";
import type { Application, ApplicationStatus } from "@/lib/api/types";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    company_name: "Acme",
    job_title: "Backend Engineer",
    job_description: "",
    job_url: "https://www.linkedin.com/jobs/view/1",
    site_id: "site-linkedin",
    cv_version_id: null,
    status: "Applied" as ApplicationStatus,
    ai_score: null,
    ai_score_explanation: null,
    applied_at: "2026-05-01T10:00:00Z",
    created_at: "2026-05-01T09:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("toListParams", () => {
  it("asks for one page and nothing else when no filter is set", () => {
    expect(toListParams(EMPTY_FILTERS)).toEqual({ limit: PAGE_SIZE, offset: 0 });
  });

  it("maps every filter onto the query the backend understands", () => {
    const filters: ApplicationFilters = {
      search: "  acme  ",
      status: "Interviewing",
      siteId: "site-1",
      cvVersionId: "cv-1",
      from: "2026-01-01",
      to: "2026-03-31",
    };

    expect(toListParams(filters)).toEqual({
      limit: PAGE_SIZE,
      offset: 0,
      q: "acme",
      status: "Interviewing",
      site_id: "site-1",
      cv_version_id: "cv-1",
      from: "2026-01-01",
      to: "2026-03-31",
    });
  });

  it("leaves 'all' selections out of the query rather than sending the sentinel", () => {
    const params = toListParams({ ...EMPTY_FILTERS, status: ALL, siteId: ALL, cvVersionId: ALL });
    expect(params).not.toHaveProperty("status");
    expect(params).not.toHaveProperty("site_id");
    expect(params).not.toHaveProperty("cv_version_id");
  });

  it("grows the page size as more rows are requested", () => {
    expect(toListParams(EMPTY_FILTERS, 0, PAGE_SIZE * 3)).toMatchObject({
      limit: PAGE_SIZE * 3,
      offset: 0,
    });
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty state", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("ignores whitespace-only search", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: "   " })).toBe(false);
  });

  it("is true once anything is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: "Ghost" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, from: "2026-01-01" })).toBe(true);
  });
});

describe("effectiveDate", () => {
  it("prefers applied_at", () => {
    const application = makeApplication({ applied_at: "2026-04-02T00:00:00Z" });
    expect(effectiveDate(application)).toBe("2026-04-02T00:00:00Z");
  });

  it("falls back to created_at for a Saved application", () => {
    const application = makeApplication({ applied_at: null, created_at: "2026-04-01T00:00:00Z" });
    expect(effectiveDate(application)).toBe("2026-04-01T00:00:00Z");
  });
});

describe("sortApplications", () => {
  const older = makeApplication({ id: "a", company_name: "Zeta", applied_at: "2026-01-01T00:00:00Z" });
  const newer = makeApplication({ id: "b", company_name: "Alpha", applied_at: "2026-06-01T00:00:00Z" });
  const saved = makeApplication({
    id: "c",
    company_name: "Meridian",
    applied_at: null,
    created_at: "2026-03-01T00:00:00Z",
  });

  it("defaults to newest first", () => {
    const sorted = sortApplications([older, saved, newer], DEFAULT_SORT);
    expect(sorted.map((a) => a.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts a Saved application by its created_at", () => {
    const sorted = sortApplications([newer, older, saved], { key: "date", direction: "asc" });
    expect(sorted.map((a) => a.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts company names case-insensitively", () => {
    const lower = makeApplication({ id: "d", company_name: "apex" });
    const sorted = sortApplications([older, lower, newer], { key: "company", direction: "asc" });
    expect(sorted.map((a) => a.company_name)).toEqual(["Alpha", "apex", "Zeta"]);
  });

  it("sorts status by pipeline order, not alphabetically", () => {
    const applied = makeApplication({ id: "e", status: "Applied" });
    const interviewing = makeApplication({ id: "f", status: "Interviewing" });
    const saved2 = makeApplication({ id: "g", status: "Saved" });

    const sorted = sortApplications([interviewing, saved2, applied], {
      key: "status",
      direction: "asc",
    });
    expect(sorted.map((a) => a.status)).toEqual(["Saved", "Applied", "Interviewing"]);
  });

  it("sorts CV versions by their resolved label and puts rows with no CV last", () => {
    const withCV = makeApplication({ id: "h", cv_version_id: "v1" });
    const otherCV = makeApplication({ id: "i", cv_version_id: "v2" });
    const noCV = makeApplication({ id: "j", cv_version_id: null });
    const labels = {
      siteName: (id: string) => id,
      cvLabel: (id: string | null) => (id === "v1" ? "Backend CV — v3" : id === "v2" ? "Alpha CV — v1" : ""),
    };

    const ascending = sortApplications([withCV, noCV, otherCV], { key: "cv", direction: "asc" }, labels);
    expect(ascending.map((a) => a.id)).toEqual(["i", "h", "j"]);

    const descending = sortApplications([withCV, noCV, otherCV], { key: "cv", direction: "desc" }, labels);
    expect(descending.map((a) => a.id)).toEqual(["h", "i", "j"]);
  });

  it("does not mutate the array it was given", () => {
    const input = [older, newer];
    sortApplications(input, { key: "company", direction: "asc" });
    expect(input.map((a) => a.id)).toEqual(["a", "b"]);
  });
});

describe("nextSort", () => {
  it("starts a new column descending", () => {
    expect(nextSort({ key: "date", direction: "asc" }, "company")).toEqual({
      key: "company",
      direction: "desc",
    });
  });

  it("flips the active column", () => {
    expect(nextSort({ key: "date", direction: "desc" }, "date")).toEqual({
      key: "date",
      direction: "asc",
    });
  });
});

describe("applyLocalSearch", () => {
  const rows = [
    makeApplication({ id: "a", company_name: "Stripe", job_title: "Backend Engineer" }),
    makeApplication({ id: "b", company_name: "Intercom", job_title: "Platform Engineer" }),
  ];

  it("returns everything for an empty query", () => {
    expect(applyLocalSearch(rows, "   ")).toHaveLength(2);
  });

  it("matches on company name, case-insensitively", () => {
    expect(applyLocalSearch(rows, "stri").map((a) => a.id)).toEqual(["a"]);
  });

  it("matches on job title too", () => {
    expect(applyLocalSearch(rows, "platform").map((a) => a.id)).toEqual(["b"]);
  });

  it("returns nothing when there is no match", () => {
    expect(applyLocalSearch(rows, "zzz")).toHaveLength(0);
  });
});
