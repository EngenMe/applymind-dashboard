import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CVGroup } from "./cv-group";
import type { CV, CVVersion } from "@/lib/api/types";

function makeVersion(overrides: Partial<CVVersion> = {}): CVVersion {
  return {
    id: "version-1",
    cv_id: "cv-1",
    sha256_hash: "abc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    file_size_bytes: 245_760,
    original_filename: "backend-cv.pdf",
    uploaded_at: "2026-01-10T09:00:00Z",
    ...overrides,
  };
}

const multiVersion: CV = {
  id: "cv-1",
  name: "Backend CV",
  tag: "backend",
  created_at: "2026-01-10T09:00:00Z",
  updated_at: "2026-05-02T09:00:00Z",
  versions: [
    makeVersion({ id: "version-1", uploaded_at: "2026-01-10T09:00:00Z" }),
    makeVersion({
      id: "version-2",
      uploaded_at: "2026-05-02T09:00:00Z",
      original_filename: "backend-cv-may.pdf",
    }),
  ],
};

const singleVersion: CV = {
  id: "cv-2",
  name: "Fullstack CV",
  tag: null,
  created_at: "2026-02-01T09:00:00Z",
  updated_at: "2026-02-01T09:00:00Z",
  versions: [makeVersion({ id: "version-3", cv_id: "cv-2" })],
};

/** Owns the expanded state, so clicking the header actually opens the group. */
function Harness({
  cv = multiVersion,
  onDownload = vi.fn(),
  ...rest
}: Partial<React.ComponentProps<typeof CVGroup>> = {}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <CVGroup
      cv={cv}
      expanded={expanded}
      onToggle={() => setExpanded((current) => !current)}
      onDownload={onDownload}
      renderUsage={(versionId) => <p>usage for {versionId}</p>}
      {...rest}
    />
  );
}

describe("CVGroup", () => {
  it("shows the CV name and its tag without opening anything", () => {
    render(<Harness />);
    expect(screen.getByText("Backend CV")).toBeInTheDocument();
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.queryByText("backend-cv.pdf")).not.toBeInTheDocument();
  });

  it("badges how many versions a CV has", () => {
    render(<Harness />);
    expect(screen.getByText("2 versions")).toBeInTheDocument();
  });

  it("still reads correctly for a CV with one version", () => {
    render(<Harness cv={singleVersion} />);
    expect(screen.getByText("1 version")).toBeInTheDocument();
  });

  it("reveals the version history when expanded, newest first", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const header = screen.getByRole("button", { name: /backend cv/i });
    expect(header).toHaveAttribute("aria-expanded", "false");

    await user.click(header);

    expect(header).toHaveAttribute("aria-expanded", "true");
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("v2");
    expect(items[0]).toHaveTextContent("backend-cv-may.pdf");
    expect(items[1]).toHaveTextContent("v1");
  });

  it("shows size and a truncated hash for each version, with the whole hash on hover", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /backend cv/i }));

    expect(screen.getAllByText("240 KB")).toHaveLength(2);
    const hash = screen.getAllByText(/^sha256 abc123def456…$/)[0];
    expect(hash).toHaveAttribute("title", multiVersion.versions?.[0].sha256_hash);
  });

  it("asks for a download link for the version whose button was clicked", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(<Harness onDownload={onDownload} />);

    await user.click(screen.getByRole("button", { name: /backend cv/i }));
    await user.click(screen.getAllByRole("button", { name: /download/i })[0]);

    expect(onDownload).toHaveBeenCalledWith("version-2");
  });

  it("marks only the version being fetched as busy", async () => {
    const user = userEvent.setup();
    render(<Harness downloadingVersionId="version-2" />);
    await user.click(screen.getByRole("button", { name: /backend cv/i }));

    expect(screen.getByRole("button", { name: /preparing/i })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /^download$/i })).toHaveLength(1);
  });

  it("renders the usage list for each version", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /backend cv/i }));

    expect(screen.getByText("usage for version-1")).toBeInTheDocument();
    expect(screen.getByText("usage for version-2")).toBeInTheDocument();
  });

  it("surfaces a failed download without collapsing the group", async () => {
    const user = userEvent.setup();
    render(<Harness downloadError="The download link could not be created. Try again." />);
    await user.click(screen.getByRole("button", { name: /backend cv/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/could not be created/i);
  });

  it("says so when a group has no files stored under it", async () => {
    const user = userEvent.setup();
    render(<Harness cv={{ ...singleVersion, versions: [] }} />);
    await user.click(screen.getByRole("button", { name: /fullstack cv/i }));

    expect(screen.getByText(/no files are stored/i)).toBeInTheDocument();
  });
});
