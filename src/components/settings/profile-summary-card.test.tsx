import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileSummaryResponse } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  query: {
    data: undefined as ProfileSummaryResponse | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
  },
  update: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/lib/hooks/use-profile-summary", () => ({
  useProfileSummary: () => mocks.query,
  useUpdateProfileSummary: () => mocks.update,
}));

import { ProfileSummaryCard } from "./profile-summary-card";

const SAVED = "Backend engineer, six years in Go and Postgres.";

function field() {
  return screen.getByLabelText("Summary") as HTMLTextAreaElement;
}

function saveButton() {
  return screen.getByRole("button", { name: "Save summary" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.data = { profile_summary: SAVED, updated_at: "2026-05-16T10:00:00Z" };
  mocks.query.isPending = false;
  mocks.query.isError = false;
  mocks.query.error = null;
  mocks.update.isPending = false;
});

describe("ProfileSummaryCard", () => {
  it("shows the saved summary and when it was saved", () => {
    render(<ProfileSummaryCard />);

    expect(field().value).toBe(SAVED);
    expect(screen.getByText(/saved /)).toBeTruthy();
  });

  it("starts empty when nothing has been saved, and offers no save time", () => {
    mocks.query.data = { profile_summary: null, updated_at: "2026-05-16T10:00:00Z" };
    render(<ProfileSummaryCard />);

    expect(field().value).toBe("");
    expect(screen.queryByText(/saved /)).toBeNull();
  });

  it("keeps Save disabled until the text actually changes", () => {
    render(<ProfileSummaryCard />);
    expect(saveButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(field(), { target: { value: `  ${SAVED}  ` } });
    expect(saveButton().hasAttribute("disabled")).toBe(true);

    fireEvent.change(field(), { target: { value: `${SAVED} Remote only.` } });
    expect(saveButton().hasAttribute("disabled")).toBe(false);
  });

  it("will not save an emptied summary — the backend rejects a blank one", () => {
    render(<ProfileSummaryCard />);

    fireEvent.change(field(), { target: { value: "   " } });

    expect(saveButton().hasAttribute("disabled")).toBe(true);
  });

  it("sends the trimmed summary", () => {
    render(<ProfileSummaryCard />);

    fireEvent.change(field(), { target: { value: "  Rewritten summary.  " } });
    fireEvent.click(saveButton());

    expect(mocks.update.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.update.mutate.mock.calls[0][0]).toBe("Rewritten summary.");
  });

  it("counts what is on screen", () => {
    render(<ProfileSummaryCard />);

    fireEvent.change(field(), { target: { value: "abcde" } });

    expect(screen.getByText(/^5 characters/)).toBeTruthy();
  });

  it("explains a failed save", () => {
    mocks.update.mutate.mockImplementation(
      (_summary: string, options: { onError: (e: unknown) => void }) => {
        options.onError(new Error("network"));
      },
    );
    render(<ProfileSummaryCard />);

    fireEvent.change(field(), { target: { value: "Rewritten summary." } });
    fireEvent.click(saveButton());

    expect(screen.getByRole("alert").textContent).toContain("Could not save the summary");
  });

  it("says so when the summary cannot be loaded", () => {
    mocks.query.data = undefined;
    mocks.query.isError = true;
    render(<ProfileSummaryCard />);

    expect(screen.getByRole("alert").textContent).toContain("Could not load your summary");
  });
});
