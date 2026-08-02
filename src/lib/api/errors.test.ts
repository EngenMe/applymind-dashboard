import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { errorMessage } from "./errors";

const FALLBACK = "Could not save. Try again.";

describe("errorMessage", () => {
  it("shows what the backend said, because those messages are written for a reader", () => {
    const error = new ApiError(
      409,
      "site_in_use",
      "applications still reference this site — deactivate it instead",
    );

    expect(errorMessage(error, FALLBACK)).toBe(
      "applications still reference this site — deactivate it instead",
    );
  });

  it("uses the fallback for a plain Error, whose message is for a developer", () => {
    expect(errorMessage(new Error("Failed to fetch"), FALLBACK)).toBe(FALLBACK);
    expect(errorMessage(new TypeError("NetworkError"), FALLBACK)).toBe(FALLBACK);
  });

  it("uses the fallback for anything that is not an error at all", () => {
    expect(errorMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(errorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(errorMessage("a string", FALLBACK)).toBe(FALLBACK);
    expect(errorMessage({ message: "quacks like one" }, FALLBACK)).toBe(FALLBACK);
  });

  it("returns each caller's own fallback", () => {
    expect(errorMessage(null, "Could not add the site. Try again.")).toBe(
      "Could not add the site. Try again.",
    );
  });
});
