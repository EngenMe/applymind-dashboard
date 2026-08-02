import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatRelativeDays,
  hostOf,
  shortId,
} from "./format";

/**
 * The date helpers pin their locale to en-IE, so the shape of the output is
 * stable, but the exact separators ICU chooses are not worth freezing into
 * assertions — a Node upgrade would break them without anything being wrong.
 * These tests assert the parts that carry meaning (the sentinel, the
 * components) and leave the punctuation alone.
 *
 * Times are midday UTC throughout so a test machine in any European timezone
 * still lands on the same calendar day.
 */
const NOON = "2026-08-02T12:00:00Z";

/** ICU uses non-breaking spaces in places; normalise before matching. */
function plain(value: string): string {
  return value.replace(/\s/g, " ");
}

describe("formatDate", () => {
  it("renders day, short month and year", () => {
    const formatted = plain(formatDate(NOON));
    expect(formatted).toMatch(/^\d{2} \w{3} \d{4}$/);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("02");
  });

  it("returns the sentinel for nothing", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns the sentinel rather than 'Invalid Date'", () => {
    expect(formatDate("not a date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("adds a time to the date", () => {
    const formatted = plain(formatDateTime(NOON));
    expect(formatted).toMatch(/\d{2}:\d{2}/);
    expect(formatted).toContain("2026");
  });

  it("returns the sentinel for nothing or nonsense", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("not a date")).toBe("—");
  });
});

describe("formatRelativeDays", () => {
  const now = new Date("2026-08-02T12:00:00Z");

  it("calls the same instant today", () => {
    expect(formatRelativeDays(now.toISOString(), now)).toBe("today");
  });

  it("calls anything in the future today too", () => {
    expect(formatRelativeDays("2026-08-05T12:00:00Z", now)).toBe("today");
  });

  it("counts back in whole 24-hour periods, not calendar days", () => {
    expect(formatRelativeDays("2026-08-01T12:00:00Z", now)).toBe("yesterday");
    // 23 hours ago is still under a full day, so it reads as today.
    expect(formatRelativeDays("2026-08-01T13:00:00Z", now)).toBe("today");
  });

  it("counts days beyond that", () => {
    expect(formatRelativeDays("2026-07-21T12:00:00Z", now)).toBe("12 days ago");
  });

  it("returns an empty string for nothing, since it sits beside other text", () => {
    expect(formatRelativeDays(null, now)).toBe("");
    expect(formatRelativeDays("", now)).toBe("");
    expect(formatRelativeDays("not a date", now)).toBe("");
  });
});

describe("formatBytes", () => {
  it("keeps small sizes in bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("switches to whole kilobytes at 1024", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(1024 * 1023)).toBe("1023 KB");
  });

  it("switches to megabytes with one decimal", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(2_621_440)).toBe("2.5 MB");
  });

  it("returns the sentinel when there is no size", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(undefined)).toBe("—");
  });
});

describe("hostOf", () => {
  it("takes the host out of a url", () => {
    expect(hostOf("https://ie.linkedin.com/jobs/view/123")).toBe("ie.linkedin.com");
  });

  it("drops a leading www", () => {
    expect(hostOf("https://www.example.com/careers")).toBe("example.com");
  });

  it("keeps a port, which is part of the host", () => {
    expect(hostOf("http://localhost:3000/jobs")).toBe("localhost:3000");
  });

  it("hands back whatever it was given when that is not a url", () => {
    expect(hostOf("careers.example.com")).toBe("careers.example.com");
  });

  it("returns the sentinel for nothing", () => {
    expect(hostOf(null)).toBe("—");
    expect(hostOf("")).toBe("—");
  });
});

describe("shortId", () => {
  it("takes the first block of a uuid", () => {
    expect(shortId("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe("3f2504e0");
  });

  it("leaves anything already shorter alone", () => {
    expect(shortId("abc")).toBe("abc");
  });

  it("returns the sentinel for nothing", () => {
    expect(shortId(null)).toBe("—");
    expect(shortId("")).toBe("—");
  });
});
