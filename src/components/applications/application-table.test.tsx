import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ApplicationTable } from "./application-table";
import { DEFAULT_SORT, sortApplications, type SortState } from "@/lib/applications/filters";
import type { Application } from "@/lib/api/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    company_name: "Stripe",
    job_title: "Backend Engineer",
    job_description: "",
    job_url: "https://www.linkedin.com/jobs/view/1",
    site_id: "site-1",
    cv_version_id: "cv-1",
    status: "Applied",
    ai_score: null,
    ai_score_explanation: null,
    applied_at: "2026-05-01T10:00:00Z",
    created_at: "2026-05-01T09:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

const rows = [
  makeApplication({ id: "app-1", company_name: "Stripe", applied_at: "2026-05-01T10:00:00Z" }),
  makeApplication({
    id: "app-2",
    company_name: "Intercom",
    job_title: "Platform Engineer",
    cv_version_id: null,
    status: "Interviewing",
    applied_at: "2026-06-01T10:00:00Z",
  }),
];

const labels = {
  siteName: (id: string) => (id === "site-1" ? "LinkedIn" : id),
  cvLabel: (id: string | null) => (id === "cv-1" ? "Backend CV — v3" : ""),
};

/** Wrapper that owns the sort state, so a header click actually re-sorts. */
function Harness({ applications = rows }: { applications?: Application[] }) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  return (
      <ApplicationTable
          applications={sortApplications(applications, sort, labels)}
          sort={sort}
          onSortChange={setSort}
          siteName={labels.siteName}
          cvLabel={labels.cvLabel}
          emptyState={<p>Nothing tracked yet.</p>}
      />
  );
}

/**
 * The component renders both layouts and hides one with a CSS breakpoint, which
 * jsdom does not evaluate — so without scoping, every query matches twice.
 *
 * Rather than reach for getAllBy* and index into the results, each test says
 * which layout it is about. That is more honest about what is being asserted,
 * and it means a change to the card view can no longer quietly satisfy a test
 * written for the table.
 */
const table = () => within(screen.getByRole("table"));
const cards = () => within(screen.getByRole("list"));

describe("ApplicationTable — table layout", () => {
  it("shows one row per application with its site and CV version resolved", () => {
    render(<Harness />);

    expect(table().getByRole("link", { name: "Stripe" })).toBeInTheDocument();
    expect(table().getByText("Backend Engineer")).toBeInTheDocument();
    expect(table().getAllByText("LinkedIn")).toHaveLength(2);
    expect(table().getByText("Backend CV — v3")).toBeInTheDocument();
  });

  it("says so plainly when no CV was recorded", () => {
    render(<Harness />);
    expect(table().getByText("none recorded")).toBeInTheDocument();
  });

  it("renders the status badge for each row", () => {
    render(<Harness />);
    expect(table().getByText("Applied")).toBeInTheDocument();
    expect(table().getByText("Interviewing")).toBeInTheDocument();
  });

  it("starts newest first", () => {
    render(<Harness />);
    expect(table().getAllByRole("link")[0]).toHaveTextContent("Intercom");
  });

  it("re-sorts and marks the column when a header is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(table().getByRole("button", { name: /company/i }));
    expect(table().getAllByRole("link")[0]).toHaveTextContent("Stripe");
    expect(table().getByRole("columnheader", { name: /company/i })).toHaveAttribute(
        "aria-sort",
        "descending",
    );

    await user.click(table().getByRole("button", { name: /company/i }));
    expect(table().getAllByRole("link")[0]).toHaveTextContent("Intercom");
    expect(table().getByRole("columnheader", { name: /company/i })).toHaveAttribute(
        "aria-sort",
        "ascending",
    );
  });

  it("navigates to the detail page when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(table().getByText("Backend Engineer"));
    expect(push).toHaveBeenCalledWith("/applications/app-1");
  });
});

describe("ApplicationTable — card layout", () => {
  it("shows one card per application, carrying the same resolved values", () => {
    render(<Harness />);

    expect(cards().getAllByRole("listitem")).toHaveLength(2);
    expect(cards().getByText("Backend Engineer")).toBeInTheDocument();
    expect(cards().getByText("Backend CV — v3")).toBeInTheDocument();
    expect(cards().getAllByText("LinkedIn")).toHaveLength(2);
  });

  it("says so plainly when no CV was recorded", () => {
    render(<Harness />);
    expect(cards().getByText("no CV recorded")).toBeInTheDocument();
  });

  it("links the whole card to the detail page", () => {
    render(<Harness />);

    // Newest first, so Intercom leads — same order the table starts in.
    const links = cards().getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/applications/app-2");
    expect(links[1]).toHaveAttribute("href", "/applications/app-1");
  });

  it("sorts from its own control, since there are no column headers to click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const sortBar = within(screen.getByRole("group", { name: "Sort applications" }));
    await user.click(sortBar.getByRole("button", { name: /company/i }));

    expect(cards().getAllByRole("link")[0]).toHaveTextContent("Stripe");
    expect(sortBar.getByRole("button", { name: /company/i })).toHaveAttribute(
        "aria-pressed",
        "true",
    );
  });
});

describe("ApplicationTable — empty", () => {
  it("shows the empty state instead of either layout", () => {
    render(<Harness applications={[]} />);

    expect(screen.getByText("Nothing tracked yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});