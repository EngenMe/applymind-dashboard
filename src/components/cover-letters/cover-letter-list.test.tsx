import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoverLetterList } from "./cover-letter-list";
import type { Application, CoverLetter } from "@/lib/api/types";
import type { CoverLetterEntry } from "@/lib/cover-letters/history";

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
    body_text: "Dear hiring team, I have been following Stripe for years.",
    original_filename: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

const textEntry: CoverLetterEntry = {
  application: makeApplication(),
  coverLetter: makeLetter(),
  sentAt: "2026-05-01T10:00:00Z",
};

const fileEntry: CoverLetterEntry = {
  application: makeApplication({
    id: "app-2",
    company_name: "Intercom",
    job_title: "Platform Engineer",
  }),
  coverLetter: makeLetter({
    id: "letter-2",
    application_id: "app-2",
    kind: "file",
    body_text: null,
    original_filename: "intercom-cover-letter.pdf",
  }),
  sentAt: "2026-04-01T10:00:00Z",
};

/** Owns which row is open, so a click actually expands one. */
function Harness({
  entries = [textEntry, fileEntry],
  onDownload = vi.fn(),
  ...rest
}: Partial<React.ComponentProps<typeof CoverLetterList>> = {}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <CoverLetterList
      entries={entries}
      openId={openId}
      onToggle={(id) => setOpenId((current) => (current === id ? null : id))}
      onDownload={onDownload}
      {...rest}
    />
  );
}

describe("CoverLetterList", () => {
  it("files each letter under its application", () => {
    render(<Harness />);
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Intercom")).toBeInTheDocument();
    expect(screen.getByText("Platform Engineer")).toBeInTheDocument();
  });

  it("previews a text letter without opening it", () => {
    render(<Harness />);
    expect(screen.getByText(/i have been following stripe/i)).toBeInTheDocument();
  });

  it("shows the full text inline once opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const header = screen.getByRole("button", { name: /stripe/i });
    await user.click(header);

    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(textEntry.coverLetter.body_text as string)).toBeInTheDocument();
  });

  it("offers a download instead of a body for a file letter", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<Harness onDownload={onDownload} />);

    await user.click(screen.getByRole("button", { name: /intercom/i }));
    expect(screen.getByText("intercom-cover-letter.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /download/i }));
    expect(onDownload).toHaveBeenCalledWith("app-2");
  });

  it("keeps one letter open at a time", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /stripe/i }));
    await user.click(screen.getByRole("button", { name: /intercom/i }));

    expect(screen.getByRole("button", { name: /stripe/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("links through to the application rather than offering to edit here", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /stripe/i }));

    expect(screen.getByRole("link", { name: /open application/i })).toHaveAttribute(
      "href",
      "/applications/app-1",
    );
    expect(screen.queryByRole("button", { name: /reuse|edit|save/i })).not.toBeInTheDocument();
    expect(screen.getByText(/sent with this application only/i)).toBeInTheDocument();
  });

  it("says a letter is empty rather than showing a blank panel", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        entries={[{ ...textEntry, coverLetter: makeLetter({ body_text: "   " }) }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /stripe/i }));

    expect(screen.getByText("This letter is empty.")).toBeInTheDocument();
  });

  it("shows the kind of each letter", () => {
    render(<Harness />);
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("file")).toBeInTheDocument();
  });
});
