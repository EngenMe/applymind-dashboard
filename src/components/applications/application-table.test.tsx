import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("ApplicationTable", () => {
  it("shows one row per application with its site and CV version resolved", () => {
    render(<Harness />);

    expect(screen.getByRole("link", { name: "Stripe" })).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("LinkedIn")).toHaveLength(2);
    expect(screen.getByText("Backend CV — v3")).toBeInTheDocument();
  });

  it("says so plainly when no CV was recorded", () => {
    render(<Harness />);
    expect(screen.getByText("none recorded")).toBeInTheDocument();
  });

  it("renders the status badge for each row", () => {
    render(<Harness />);
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Interviewing")).toBeInTheDocument();
  });

  it("starts newest first", () => {
    render(<Harness />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Intercom");
  });

  it("re-sorts and marks the column when a header is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /company/i }));
    expect(screen.getAllByRole("link")[0]).toHaveTextContent("Stripe");
    expect(screen.getByRole("columnheader", { name: /company/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    await user.click(screen.getByRole("button", { name: /company/i }));
    expect(screen.getAllByRole("link")[0]).toHaveTextContent("Intercom");
    expect(screen.getByRole("columnheader", { name: /company/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("navigates to the detail page when a row is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("Backend Engineer"));
    expect(push).toHaveBeenCalledWith("/applications/app-1");
  });

  it("shows the empty state instead of an empty table", () => {
    render(<Harness applications={[]} />);
    expect(screen.getByText("Nothing tracked yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
