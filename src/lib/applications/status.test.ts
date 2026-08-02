import { describe, expect, it } from "vitest";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/api/types";
import {
  isTerminal,
  pipelineProgress,
  statusClasses,
  statusDotClasses,
  statusRank,
  TERMINAL_STATUSES,
} from "./status";

describe("isTerminal", () => {
  it("is true for the four endings", () => {
    expect(isTerminal("Accepted")).toBe(true);
    expect(isTerminal("Rejected")).toBe(true);
    expect(isTerminal("Withdrawn")).toBe(true);
    expect(isTerminal("Ghost")).toBe(true);
  });

  it("is false while the application is still moving", () => {
    expect(isTerminal("Saved")).toBe(false);
    expect(isTerminal("Applied")).toBe(false);
    expect(isTerminal("Interviewing")).toBe(false);
    expect(isTerminal("Offer Received")).toBe(false);
  });

  it("agrees with the exported list", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(isTerminal(status)).toBe(TERMINAL_STATUSES.includes(status));
    }
  });
});

describe("pipelineProgress", () => {
  it("starts part-way rather than at zero — being saved is progress", () => {
    expect(pipelineProgress("Saved")).toBeCloseTo(1 / 8);
  });

  it("fills at the good ending", () => {
    expect(pipelineProgress("Accepted")).toBe(1);
  });

  it("fills at the other endings too, because the process is over either way", () => {
    expect(pipelineProgress("Rejected")).toBe(1);
    expect(pipelineProgress("Withdrawn")).toBe(1);
    expect(pipelineProgress("Ghost")).toBe(1);
  });

  it("only ever moves forward through the live statuses", () => {
    const live: ApplicationStatus[] = [
      "Saved",
      "Applied",
      "Acknowledged",
      "In Review",
      "Interview Scheduled",
      "Interviewing",
      "Offer Received",
      "Accepted",
    ];

    const values = live.map(pipelineProgress);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("stays within 0 and 1 for every status", () => {
    for (const status of APPLICATION_STATUSES) {
      const progress = pipelineProgress(status);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });
});

describe("statusClasses", () => {
  it("returns classes for every status in the enum", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(statusClasses(status).length).toBeGreaterThan(0);
    }
  });

  it("gives the two good statuses the same tone", () => {
    expect(statusClasses("Offer Received")).toBe(statusClasses("Accepted"));
  });

  it("tells a rejection apart from an acceptance", () => {
    expect(statusClasses("Rejected")).not.toBe(statusClasses("Accepted"));
  });

  it("falls back to neutral for a status that is not in the enum", () => {
    const unknown = "Nonsense" as ApplicationStatus;
    expect(statusClasses(unknown)).toBe(statusClasses("Saved"));
  });
});

describe("statusDotClasses", () => {
  it("returns classes for every status in the enum", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(statusDotClasses(status).length).toBeGreaterThan(0);
    }
  });

  it("uses the same tone split as the badge", () => {
    expect(statusDotClasses("Interviewing")).toBe(statusDotClasses("Interview Scheduled"));
    expect(statusDotClasses("Rejected")).not.toBe(statusDotClasses("Accepted"));
  });

  it("falls back to neutral for a status that is not in the enum", () => {
    const unknown = "Nonsense" as ApplicationStatus;
    expect(statusDotClasses(unknown)).toBe(statusDotClasses("Saved"));
  });
});

describe("statusRank", () => {
  it("ranks in enum order", () => {
    expect(statusRank("Saved")).toBe(0);
    expect(statusRank("Applied")).toBe(1);
    expect(statusRank("Ghost")).toBe(APPLICATION_STATUSES.length - 1);
  });

  it("sorts a shuffled list back into pipeline order", () => {
    const shuffled: ApplicationStatus[] = ["Rejected", "Saved", "Interviewing", "Applied"];
    const sorted = [...shuffled].sort((a, b) => statusRank(a) - statusRank(b));

    expect(sorted).toEqual(["Saved", "Applied", "Interviewing", "Rejected"]);
  });

  it("puts an unknown status last rather than first", () => {
    const unknown = "Nonsense" as ApplicationStatus;
    expect(statusRank(unknown)).toBe(APPLICATION_STATUSES.length);
    expect(statusRank(unknown)).toBeGreaterThan(statusRank("Ghost"));
  });
});
