import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiTokenSummary, IssuedToken } from "@/lib/api/auth";

const mocks = vi.hoisted(() => ({
  tokens: {
    data: undefined as ApiTokenSummary[] | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
  },
  issue: { mutate: vi.fn(), isPending: false },
  revoke: { mutate: vi.fn(), isPending: false, variables: undefined as string | undefined },
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useApiTokens: () => mocks.tokens,
  useIssueToken: () => mocks.issue,
  useRevokeToken: () => mocks.revoke,
}));

import { TokensCard } from "./tokens-card";

const chrome: ApiTokenSummary = {
  id: "token-chrome",
  name: "Chrome on Linux",
  read_only: false,
  last_used_at: "2026-05-14T09:00:00Z",
  created_at: "2026-05-01T09:00:00Z",
};

const demo: ApiTokenSummary = {
  id: "token-demo",
  name: "Public demo",
  read_only: true,
  last_used_at: null,
  created_at: "2026-04-01T09:00:00Z",
};

const issued: IssuedToken = {
  token: "amt_live_2f8c1d",
  warning: "This token is shown once and cannot be retrieved again. Store it now.",
  api_token: chrome,
};

function row(name: string) {
  return screen.getByText(name).closest("li") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tokens.data = [chrome, demo];
  mocks.tokens.isPending = false;
  mocks.tokens.isError = false;
  mocks.issue.isPending = false;
  mocks.revoke.isPending = false;
  mocks.revoke.variables = undefined;
});

describe("TokensCard", () => {
  it("labels read-only tokens so it is clear which one can write", () => {
    render(<TokensCard />);

    expect(within(row("Public demo")).getByText("Read only")).toBeTruthy();
    expect(within(row("Chrome on Linux")).queryByText("Read only")).toBeNull();
  });

  it("distinguishes a token that has never been used", () => {
    render(<TokensCard />);

    expect(within(row("Public demo")).getByText(/Never used/)).toBeTruthy();
    expect(within(row("Chrome on Linux")).getByText(/Last used/)).toBeTruthy();
  });

  it("revokes the token that was clicked", () => {
    render(<TokensCard />);

    fireEvent.click(within(row("Public demo")).getByRole("button", { name: "Revoke" }));

    expect(mocks.revoke.mutate.mock.calls[0][0]).toBe("token-demo");
  });

  it("says so when there is nothing connected yet", () => {
    mocks.tokens.data = [];
    render(<TokensCard />);

    expect(screen.getByText(/Nothing connected yet/)).toBeTruthy();
  });

  it("issues a token under the name given, always writable", () => {
    render(<TokensCard />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Work laptop  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(mocks.issue.mutate.mock.calls[0][0]).toBe("Work laptop");
  });

  it("shows the token once, with the backend's own warning", () => {
    mocks.issue.mutate.mockImplementation(
      (_name: string, options: { onSuccess: (r: IssuedToken) => void }) => options.onSuccess(issued),
    );
    render(<TokensCard />);

    fireEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(screen.getByText("amt_live_2f8c1d")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("shown once");
    // The form is gone while it is displayed, so it cannot be issued again by
    // accident before this one has been saved.
    expect(screen.queryByRole("button", { name: "Create token" })).toBeNull();
  });

  it("hides the token for good once dismissed", () => {
    mocks.issue.mutate.mockImplementation(
      (_name: string, options: { onSuccess: (r: IssuedToken) => void }) => options.onSuccess(issued),
    );
    render(<TokensCard />);

    fireEvent.click(screen.getByRole("button", { name: "Create token" }));
    fireEvent.click(screen.getByRole("button", { name: "I have saved it" }));

    expect(screen.queryByText("amt_live_2f8c1d")).toBeNull();
    expect(screen.getByRole("button", { name: "Create token" })).toBeTruthy();
  });

  it("surfaces a failure to issue without pretending a token exists", () => {
    mocks.issue.mutate.mockImplementation(
      (_name: string, options: { onError: (e: unknown) => void }) => options.onError(new Error("boom")),
    );
    render(<TokensCard />);

    fireEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(screen.getByRole("alert").textContent).toContain("Could not create the token");
  });
});
