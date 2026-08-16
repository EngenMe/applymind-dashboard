import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";

/**
 * Hooks and navigation are mocked, matching sites-card.test.tsx: this file is
 * about what the form sends and where it goes afterwards, not about React Query.
 */
const mocks = vi.hoisted(() => ({
  signIn: { mutate: vi.fn(), isPending: false },
  signUp: { mutate: vi.fn(), isPending: false },
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useSignIn: () => mocks.signIn,
  useSignUp: () => mocks.signUp,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mocks.params,
}));

import { CredentialsForm } from "./credentials-form";

/** Drives a mutation to its success callback with no server involved. */
function succeeds(mutation: { mutate: ReturnType<typeof vi.fn> }) {
  mutation.mutate.mockImplementation(
    (_body: unknown, options: { onSuccess: (r: unknown) => void }) => options.onSuccess({}),
  );
}

function fails(mutation: { mutate: ReturnType<typeof vi.fn> }, cause: unknown) {
  mutation.mutate.mockImplementation(
    (_body: unknown, options: { onError: (e: unknown) => void }) => options.onError(cause),
  );
}

function fillCredentials(email = "sam@example.com", password = "correct horse battery") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signIn.isPending = false;
  mocks.signUp.isPending = false;
  mocks.params = new URLSearchParams();
});

describe("CredentialsForm — signing in", () => {
  it("lands on the applications list", () => {
    succeeds(mocks.signIn);
    render(<CredentialsForm mode="sign-in" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mocks.signIn.mutate.mock.calls[0][0]).toEqual({
      email: "sam@example.com",
      password: "correct horse battery",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/applications");
  });

  it("returns to the page that sent them to sign in", () => {
    mocks.params = new URLSearchParams({ next: "/cvs" });
    succeeds(mocks.signIn);
    render(<CredentialsForm mode="sign-in" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mocks.replace).toHaveBeenCalledWith("/cvs");
  });

  it("refuses to follow a destination that leaves the site", () => {
    mocks.params = new URLSearchParams({ next: "https://evil.example" });
    succeeds(mocks.signIn);
    render(<CredentialsForm mode="sign-in" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mocks.replace).toHaveBeenCalledWith("/applications");
  });

  it("stays put and explains when the credentials are wrong", () => {
    fails(mocks.signIn, new ApiError(401, "invalid_credentials", "email or password is incorrect"));
    render(<CredentialsForm mode="sign-in" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("alert").textContent).toContain("do not match an account");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("says so when the session ended rather than showing a bare form", () => {
    mocks.params = new URLSearchParams({ expired: "1" });
    render(<CredentialsForm mode="sign-in" />);

    expect(screen.getByRole("status").textContent).toContain("session ended");
  });

  it("has no name field", () => {
    render(<CredentialsForm mode="sign-in" />);
    expect(screen.queryByLabelText("Name (optional)")).toBeNull();
  });
});

describe("CredentialsForm — signing up", () => {
  it("sends the optional display name only when given one", () => {
    succeeds(mocks.signUp);
    render(<CredentialsForm mode="sign-up" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(mocks.signUp.mutate.mock.calls[0][0]).not.toHaveProperty("display_name");

    fireEvent.change(screen.getByLabelText("Name (optional)"), { target: { value: " Sam " } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(mocks.signUp.mutate.mock.calls[1][0]).toMatchObject({ display_name: "Sam" });
  });

  it("catches a short password without a round trip", () => {
    render(<CredentialsForm mode="sign-up" />);

    fillCredentials("sam@example.com", "short");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert").textContent).toContain("at least 12 characters");
    expect(mocks.signUp.mutate).not.toHaveBeenCalled();
  });

  it("measures the password in bytes, as bcrypt does", () => {
    render(<CredentialsForm mode="sign-up" />);

    // 45 characters, 90 bytes: comfortably under a character limit, over
    // bcrypt's byte one.
    fillCredentials("sam@example.com", "é".repeat(45));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert").textContent).toContain("72 bytes");
    expect(mocks.signUp.mutate).not.toHaveBeenCalled();
  });

  it("points a returning user at sign-in when the address is taken", () => {
    fails(mocks.signUp, new ApiError(409, "email_taken", "an account with that email already exists"));
    render(<CredentialsForm mode="sign-up" />);

    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("alert").textContent).toContain("Sign in instead");
  });
});
