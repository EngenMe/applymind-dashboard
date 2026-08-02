import { describe, expect, it } from "vitest";
import {
  canSave,
  characterCount,
  currentValue,
  isDirty,
  savedAtLabel,
} from "./profile-summary";

describe("currentValue", () => {
  it("shows the saved value until something is typed", () => {
    expect(currentValue(null, "Go backend engineer.")).toBe("Go backend engineer.");
  });

  it("shows the draft once there is one, including an emptied one", () => {
    expect(currentValue("Rewritten.", "Go backend engineer.")).toBe("Rewritten.");
    expect(currentValue("", "Go backend engineer.")).toBe("");
  });

  it("falls back to an empty string when nothing is set", () => {
    expect(currentValue(null, null)).toBe("");
    expect(currentValue(null, undefined)).toBe("");
  });
});

describe("isDirty", () => {
  it("is false before anything is typed", () => {
    expect(isDirty(null, "Go backend engineer.")).toBe(false);
  });

  it("is false when the draft only differs by surrounding whitespace", () => {
    expect(isDirty("  Go backend engineer.  ", "Go backend engineer.")).toBe(false);
  });

  it("is true for real edits", () => {
    expect(isDirty("Go backend engineer, six years.", "Go backend engineer.")).toBe(true);
  });

  it("is true for the first draft against an unset summary", () => {
    expect(isDirty("Go backend engineer.", null)).toBe(true);
  });

  it("treats emptying a saved summary as a change", () => {
    expect(isDirty("", "Go backend engineer.")).toBe(true);
  });
});

describe("canSave", () => {
  it("refuses an unchanged summary", () => {
    expect(canSave(null, "Go backend engineer.")).toBe(false);
  });

  it("refuses an emptied summary — the backend rejects a blank one", () => {
    expect(canSave("", "Go backend engineer.")).toBe(false);
    expect(canSave("   \n  ", "Go backend engineer.")).toBe(false);
  });

  it("refuses a blank first draft", () => {
    expect(canSave("  ", null)).toBe(false);
  });

  it("allows a changed, non-empty summary", () => {
    expect(canSave("Go backend engineer, six years.", "Go backend engineer.")).toBe(true);
    expect(canSave("Go backend engineer.", null)).toBe(true);
  });
});

describe("characterCount", () => {
  it("counts what is on screen, untrimmed", () => {
    expect(characterCount("abc ", null)).toBe(4);
    expect(characterCount(null, "abcde")).toBe(5);
    expect(characterCount(null, null)).toBe(0);
  });
});

describe("savedAtLabel", () => {
  it("is empty when no summary has been saved, whatever the row timestamp says", () => {
    expect(savedAtLabel(null, "2026-05-16T10:00:00Z")).toBe("");
    expect(savedAtLabel("", "2026-05-16T10:00:00Z")).toBe("");
  });

  it("is empty when the timestamp is missing or unparseable", () => {
    expect(savedAtLabel("Go backend engineer.", null)).toBe("");
    expect(savedAtLabel("Go backend engineer.", "not a date")).toBe("");
  });

  it("formats a real save", () => {
    expect(savedAtLabel("Go backend engineer.", "2026-05-16T10:00:00Z")).not.toBe("");
  });
});
