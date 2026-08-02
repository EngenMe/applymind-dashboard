import { describe, expect, it } from "vitest";
import { collectEntries, preview, summarise, type LetterLookup } from "./history";
import type { Application, CoverLetter } from "@/lib/api/types";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    company_name: "Stripe",
    job_title: "Backend Engineer",
    job_description: "",
    job_url: "https://www.linkedin.com/jobs/view/1",
    site_id: "site-1",
    cv_version_id: "version-1",
    status: "Applied",
    ai_score: null,
    ai_score_explanation: null,
    applied_at: "2026-05-01T10:00:00Z",
    created_at: "2026-04-30T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeLetter(overrides: Partial<CoverLetter> = {}): CoverLetter {
  return {
    id: "letter-1",
    application_id: "app-1",
    kind: "text",
    body_text: "Dear hiring team,",
    original_filename: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

const settled = (data: CoverLetter | null): LetterLookup => ({
  data,
  isPending: false,
  isError: false,
});
const loading: LetterLookup = { isPending: true, isError: false };
const failed: LetterLookup = { isPending: false, isError: true };

describe("collectEntries", () => {
  it("drops the applications that never had a cover letter", () => {
    const applications = [
      makeApplication({ id: "app-1" }),
      makeApplication({ id: "app-2" }),
      makeApplication({ id: "app-3" }),
    ];
    const entries = collectEntries(applications, [
      settled(makeLetter({ application_id: "app-1" })),
      settled(null),
      settled(makeLetter({ application_id: "app-3" })),
    ]);

    expect(entries.map((entry) => entry.application.id)).toEqual(["app-1", "app-3"]);
  });

  it("orders newest first", () => {
    const applications = [
      makeApplication({ id: "old", applied_at: "2026-01-01T10:00:00Z" }),
      makeApplication({ id: "new", applied_at: "2026-06-01T10:00:00Z" }),
    ];
    const entries = collectEntries(applications, [
      settled(makeLetter({ application_id: "old" })),
      settled(makeLetter({ application_id: "new" })),
    ]);

    expect(entries.map((entry) => entry.application.id)).toEqual(["new", "old"]);
  });

  it("files a letter under the saved date when the application was never sent", () => {
    const application = makeApplication({ applied_at: null, created_at: "2026-02-02T10:00:00Z" });
    const [entry] = collectEntries([application], [settled(makeLetter())]);
    expect(entry.sentAt).toBe("2026-02-02T10:00:00Z");
  });

  it("skips applications whose letter has not come back yet", () => {
    const applications = [makeApplication({ id: "app-1" }), makeApplication({ id: "app-2" })];
    const entries = collectEntries(applications, [loading, settled(makeLetter())]);
    expect(entries).toHaveLength(1);
  });
});

describe("summarise", () => {
  it("counts what is still in flight and what broke", () => {
    const progress = summarise([settled(makeLetter()), loading, loading, failed], 1);
    expect(progress).toEqual({ pending: 2, failed: 1, isInitial: false });
  });

  it("marks the first pass so the page can show a skeleton instead of an empty state", () => {
    expect(summarise([loading, loading], 0).isInitial).toBe(true);
    expect(summarise([loading, loading], 3).isInitial).toBe(false);
    expect(summarise([settled(null)], 0).isInitial).toBe(false);
  });
});

describe("preview", () => {
  it("collapses whitespace in a text letter", () => {
    expect(preview(makeLetter({ body_text: "Dear team,\n\n  I am writing" }))).toBe(
      "Dear team, I am writing",
    );
  });

  it("truncates a long letter", () => {
    expect(preview(makeLetter({ body_text: "a".repeat(300) }), 10)).toBe(`${"a".repeat(10)}…`);
  });

  it("shows the filename for a file letter rather than pretending it has a body", () => {
    const letter = makeLetter({
      kind: "file",
      body_text: null,
      original_filename: "stripe-cover-letter.pdf",
    });
    expect(preview(letter)).toBe("stripe-cover-letter.pdf");
  });

  it("says so when a text letter is blank", () => {
    expect(preview(makeLetter({ body_text: "   " }))).toBe("Empty letter");
  });
});
