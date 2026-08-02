import { describe, expect, it } from "vitest";
import {
  hasMultipleVersions,
  lastUploadedAt,
  numberVersions,
  orderVersions,
  shortHash,
  sortCVs,
  versionCount,
  versionHistory,
} from "./versions";
import type { CV, CVVersion } from "@/lib/api/types";

function makeVersion(overrides: Partial<CVVersion> = {}): CVVersion {
  return {
    id: "version-1",
    cv_id: "cv-1",
    sha256_hash: "a".repeat(64),
    file_size_bytes: 120_000,
    original_filename: "backend-cv.pdf",
    uploaded_at: "2026-01-01T09:00:00Z",
    ...overrides,
  };
}

function makeCV(overrides: Partial<CV> = {}): CV {
  return {
    id: "cv-1",
    name: "Backend CV",
    tag: null,
    created_at: "2026-01-01T09:00:00Z",
    updated_at: "2026-01-01T09:00:00Z",
    ...overrides,
  };
}

const threeVersions = makeCV({
  versions: [
    makeVersion({ id: "v-middle", uploaded_at: "2026-03-01T09:00:00Z" }),
    makeVersion({ id: "v-oldest", uploaded_at: "2026-01-01T09:00:00Z" }),
    makeVersion({ id: "v-newest", uploaded_at: "2026-05-01T09:00:00Z" }),
  ],
});

describe("orderVersions", () => {
  it("puts the oldest upload first whatever order the API returned", () => {
    const ordered = orderVersions(threeVersions.versions ?? []);
    expect(ordered.map((version) => version.id)).toEqual(["v-oldest", "v-middle", "v-newest"]);
  });

  it("breaks ties on id so the order never jitters", () => {
    const sameSecond = [
      makeVersion({ id: "b", uploaded_at: "2026-02-01T09:00:00Z" }),
      makeVersion({ id: "a", uploaded_at: "2026-02-01T09:00:00Z" }),
    ];
    expect(orderVersions(sameSecond).map((version) => version.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the array it was given", () => {
    const versions = threeVersions.versions ?? [];
    const before = versions.map((version) => version.id);
    orderVersions(versions);
    expect(versions.map((version) => version.id)).toEqual(before);
  });
});

describe("numberVersions", () => {
  it("numbers from the oldest upload, so v1 is the first file ever sent", () => {
    expect(numberVersions(threeVersions).map((entry) => [entry.version.id, entry.number])).toEqual([
      ["v-oldest", 1],
      ["v-middle", 2],
      ["v-newest", 3],
    ]);
  });

  it("labels each version with the group name", () => {
    expect(numberVersions(threeVersions)[2].label).toBe("Backend CV — v3");
  });

  it("keeps existing numbers stable when a newer version arrives", () => {
    const withFourth = makeCV({
      versions: [...(threeVersions.versions ?? []), makeVersion({ id: "v-fourth", uploaded_at: "2026-06-01T09:00:00Z" })],
    });
    const before = numberVersions(threeVersions);
    const after = numberVersions(withFourth);
    expect(after.slice(0, 3).map((entry) => entry.number)).toEqual(
      before.map((entry) => entry.number),
    );
    expect(after[3].number).toBe(4);
  });

  it("returns nothing for a group whose versions were not loaded", () => {
    expect(numberVersions(makeCV())).toEqual([]);
  });
});

describe("versionHistory", () => {
  it("reads newest first while keeping the numbers", () => {
    expect(versionHistory(threeVersions).map((entry) => entry.number)).toEqual([3, 2, 1]);
  });
});

describe("versionCount / hasMultipleVersions", () => {
  it("counts the versions that were loaded", () => {
    expect(versionCount(threeVersions)).toBe(3);
    expect(versionCount(makeCV())).toBe(0);
  });

  it("only flags a group with more than one version", () => {
    expect(hasMultipleVersions(threeVersions)).toBe(true);
    expect(hasMultipleVersions(makeCV({ versions: [makeVersion()] }))).toBe(false);
  });
});

describe("lastUploadedAt", () => {
  it("is the newest upload", () => {
    expect(lastUploadedAt(threeVersions)).toBe("2026-05-01T09:00:00Z");
  });

  it("falls back to the group timestamp when no versions were loaded", () => {
    expect(lastUploadedAt(makeCV({ updated_at: "2026-04-04T09:00:00Z" }))).toBe(
      "2026-04-04T09:00:00Z",
    );
  });
});

describe("sortCVs", () => {
  it("puts the most recently uploaded group first", () => {
    const stale = makeCV({
      id: "cv-2",
      name: "Fullstack CV",
      versions: [makeVersion({ id: "old", uploaded_at: "2025-11-01T09:00:00Z" })],
    });
    expect(sortCVs([stale, threeVersions]).map((cv) => cv.id)).toEqual(["cv-1", "cv-2"]);
  });

  it("falls back to name order when two groups were touched together", () => {
    const a = makeCV({ id: "a", name: "Zeta CV", versions: [makeVersion({ id: "a1" })] });
    const b = makeCV({ id: "b", name: "Alpha CV", versions: [makeVersion({ id: "b1" })] });
    expect(sortCVs([a, b]).map((cv) => cv.name)).toEqual(["Alpha CV", "Zeta CV"]);
  });
});

describe("shortHash", () => {
  it("truncates with an ellipsis", () => {
    expect(shortHash("abcdef1234567890", 6)).toBe("abcdef…");
  });

  it("leaves a short hash alone", () => {
    expect(shortHash("abc", 6)).toBe("abc");
  });

  it("has something to show for a missing hash", () => {
    expect(shortHash("")).toBe("—");
  });
});
