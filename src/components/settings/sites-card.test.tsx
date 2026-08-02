import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Site } from "@/lib/api/types";

/**
 * The hooks are mocked rather than the fetch layer: this file is about what the
 * card renders and which mutation a click reaches, and mocking the hooks keeps
 * it from needing a QueryClientProvider to say so.
 */
const mocks = vi.hoisted(() => ({
  sites: {
    data: undefined as { sites: Site[] } | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
  },
  toggle: { mutate: vi.fn(), isPending: false, variables: undefined as string | undefined },
  remove: { mutate: vi.fn(), isPending: false, variables: undefined as string | undefined },
  add: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/lib/hooks/use-sites", () => ({
  useSites: () => mocks.sites,
  useToggleSite: () => mocks.toggle,
  useDeleteSite: () => mocks.remove,
  useAddSite: () => mocks.add,
}));

import { SitesCard } from "./sites-card";

const linkedin: Site = {
  id: "site-linkedin",
  name: "LinkedIn",
  domain: "linkedin.com",
  is_preconfigured: true,
  is_active: true,
};

const indeed: Site = {
  id: "site-indeed",
  name: "Indeed",
  domain: "indeed.com",
  is_preconfigured: true,
  is_active: false,
};

const custom: Site = {
  id: "site-acme",
  name: "Acme Careers",
  domain: "careers.acme.com",
  is_preconfigured: false,
  is_active: true,
};

function row(name: string) {
  return screen.getByText(name).closest("li") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sites.data = { sites: [custom, linkedin, indeed] };
  mocks.sites.isPending = false;
  mocks.sites.isError = false;
  mocks.sites.error = null;
  mocks.toggle.isPending = false;
  mocks.toggle.variables = undefined;
  mocks.remove.isPending = false;
  mocks.remove.variables = undefined;
  mocks.add.isPending = false;
});

describe("SitesCard", () => {
  it("lists every site with its domain, pre-configured ones first", () => {
    render(<SitesCard />);

    const names = screen.getAllByRole("switch").map((el) => el.getAttribute("aria-label"));
    expect(names).toEqual([
      "Capture applications from Indeed",
      "Capture applications from LinkedIn",
      "Capture applications from Acme Careers",
    ]);
    expect(screen.getByText("careers.acme.com")).toBeTruthy();
  });

  it("shows each site's switch in its current position", () => {
    render(<SitesCard />);

    expect(
      within(row("LinkedIn")).getByRole("switch").getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      within(row("Indeed")).getByRole("switch").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("offers Remove on custom sites only", () => {
    render(<SitesCard />);

    expect(within(row("Acme Careers")).queryByRole("button", { name: "Remove" })).not.toBeNull();
    expect(within(row("LinkedIn")).queryByRole("button", { name: "Remove" })).toBeNull();
    expect(within(row("LinkedIn")).getByText("Built in")).toBeTruthy();
  });

  it("toggles the site that was clicked", () => {
    render(<SitesCard />);

    fireEvent.click(within(row("Indeed")).getByRole("switch"));

    expect(mocks.toggle.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.toggle.mutate.mock.calls[0][0]).toBe("site-indeed");
  });

  it("removes the site that was clicked", () => {
    render(<SitesCard />);

    fireEvent.click(within(row("Acme Careers")).getByRole("button", { name: "Remove" }));

    expect(mocks.remove.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.remove.mutate.mock.calls[0][0]).toBe("site-acme");
  });

  it("disables the row while its own mutation is in flight, leaving the others alone", () => {
    mocks.toggle.isPending = true;
    mocks.toggle.variables = "site-indeed";
    render(<SitesCard />);

    expect(within(row("Indeed")).getByRole("switch").hasAttribute("disabled")).toBe(true);
    expect(within(row("LinkedIn")).getByRole("switch").hasAttribute("disabled")).toBe(false);
  });

  it("surfaces a failed removal against the row it came from", () => {
    mocks.remove.mutate.mockImplementation(
      (_id: string, options: { onError: (e: unknown) => void }) => {
        options.onError(new Error("network"));
      },
    );
    render(<SitesCard />);

    fireEvent.click(within(row("Acme Careers")).getByRole("button", { name: "Remove" }));

    expect(within(row("Acme Careers")).getByRole("alert").textContent).toContain(
      "Could not remove this site",
    );
    expect(within(row("LinkedIn")).queryByRole("alert")).toBeNull();
  });

  it("says so when the list cannot be loaded", () => {
    mocks.sites.data = undefined;
    mocks.sites.isError = true;
    render(<SitesCard />);

    expect(screen.getByRole("alert").textContent).toContain("Could not load your sites");
  });
});

describe("SitesCard — adding a site", () => {
  it("keeps Add site disabled until both fields are filled", () => {
    render(<SitesCard />);
    const button = screen.getByRole("button", { name: "Add site" });

    expect(button.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Acme" } });
    expect(button.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "acme.com" } });
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("submits trimmed values", () => {
    render(<SitesCard />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Acme  " } });
    fireEvent.change(screen.getByLabelText("Domain"), {
      target: { value: "  https://acme.com/careers  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add site" }));

    expect(mocks.add.mutate.mock.calls[0][0]).toEqual({
      name: "Acme",
      domain: "https://acme.com/careers",
    });
  });

  it("shows the backend's reason when the site cannot be added", () => {
    mocks.add.mutate.mockImplementation(
      (_body: unknown, options: { onError: (e: unknown) => void }) => {
        options.onError(new Error("boom"));
      },
    );
    render(<SitesCard />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "acme.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Add site" }));

    expect(screen.getByRole("alert").textContent).toContain("Could not add the site");
  });
});
