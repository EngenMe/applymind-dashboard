import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionSummary } from "@/lib/api/auth";

const mocks = vi.hoisted(() => ({
  sessions: {
    data: undefined as SessionSummary[] | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
  },
  revoke: { mutate: vi.fn(), isPending: false, variables: undefined as string | undefined },
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useSessions: () => mocks.sessions,
  useRevokeSession: () => mocks.revoke,
}));

import { SessionsCard } from "./sessions-card";

const here: SessionSummary = {
  id: "session-here",
  user_agent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  ip_address: "89.101.4.12",
  expires_at: "2026-06-15T09:00:00Z",
  created_at: "2026-05-16T09:00:00Z",
  current: true,
};

const phone: SessionSummary = {
  id: "session-phone",
  user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1",
  ip_address: null,
  expires_at: "2026-06-10T09:00:00Z",
  created_at: "2026-05-11T09:00:00Z",
  current: false,
};

function row(text: string) {
  return screen.getByText(text).closest("li") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessions.data = [here, phone];
  mocks.sessions.isPending = false;
  mocks.sessions.isError = false;
  mocks.revoke.isPending = false;
  mocks.revoke.variables = undefined;
});

describe("SessionsCard", () => {
  it("describes each browser without printing the raw user agent", () => {
    render(<SessionsCard />);

    expect(screen.getByText("Chrome on Linux")).toBeTruthy();
    expect(screen.getByText("Safari on iOS")).toBeTruthy();
    expect(screen.queryByText(/AppleWebKit/)).toBeNull();
  });

  it("marks the session doing the asking", () => {
    render(<SessionsCard />);

    expect(within(row("Chrome on Linux")).getByText("This browser")).toBeTruthy();
    expect(within(row("Safari on iOS")).queryByText("This browser")).toBeNull();
  });

  it("ends another session on the first click", () => {
    render(<SessionsCard />);

    fireEvent.click(within(row("Safari on iOS")).getByRole("button", { name: "End session" }));

    expect(mocks.revoke.mutate.mock.calls[0][0]).toBe("session-phone");
  });

  it("asks before ending the session you are using", () => {
    render(<SessionsCard />);
    const target = row("Chrome on Linux");

    fireEvent.click(within(target).getByRole("button", { name: "End session" }));
    expect(mocks.revoke.mutate).not.toHaveBeenCalled();
    expect(within(target).getByRole("status").textContent).toContain("signs you out now");

    fireEvent.click(within(target).getByRole("button", { name: "Sign out here?" }));
    expect(mocks.revoke.mutate.mock.calls[0][0]).toBe("session-here");
  });

  it("surfaces a failure against the row it came from", () => {
    mocks.revoke.mutate.mockImplementation(
      (_id: string, options: { onError: (e: unknown) => void }) => options.onError(new Error("net")),
    );
    render(<SessionsCard />);

    fireEvent.click(within(row("Safari on iOS")).getByRole("button", { name: "End session" }));

    expect(within(row("Safari on iOS")).getByRole("alert").textContent).toContain(
      "Could not end this session",
    );
    expect(within(row("Chrome on Linux")).queryByRole("alert")).toBeNull();
  });

  it("says so when the list cannot be loaded", () => {
    mocks.sessions.data = undefined;
    mocks.sessions.isError = true;
    render(<SessionsCard />);

    expect(screen.getByRole("alert").textContent).toContain("Could not load your sessions");
  });
});
