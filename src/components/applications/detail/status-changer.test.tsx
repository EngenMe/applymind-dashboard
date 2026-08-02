import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusChanger } from "./status-changer";

function renderChanger(overrides: Partial<React.ComponentProps<typeof StatusChanger>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <StatusChanger status="Applied" onSubmit={onSubmit} isSaving={false} {...overrides} />,
  );
  return { onSubmit };
}

async function chooseStatus(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox", { name: /move to status/i }));
  await user.click(await screen.findByRole("option", { name: label }));
}

describe("StatusChanger", () => {
  it("blocks the update while the selection matches the current status", () => {
    renderChanger();
    expect(screen.getByRole("button", { name: /update status/i })).toBeDisabled();
    expect(screen.getByText(/already in this status/i)).toBeInTheDocument();
  });

  it("offers the whole workflow, Saved through Ghost", async () => {
    const user = userEvent.setup();
    renderChanger();

    await user.click(screen.getByRole("combobox", { name: /move to status/i }));
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(11);
    expect(options[0]).toHaveTextContent("Saved");
    expect(options[10]).toHaveTextContent("Ghost");
  });

  it("submits the chosen status with the note", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChanger();

    await chooseStatus(user, "Interviewing");
    await user.type(screen.getByLabelText(/note/i), "Phone screen booked");
    await user.click(screen.getByRole("button", { name: /update status/i }));

    expect(onSubmit).toHaveBeenCalledWith("Interviewing", "Phone screen booked");
  });

  it("sends an empty note rather than whitespace", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderChanger();

    await chooseStatus(user, "Rejected");
    await user.type(screen.getByLabelText(/note/i), "   ");
    await user.click(screen.getByRole("button", { name: /update status/i }));

    expect(onSubmit).toHaveBeenCalledWith("Rejected", "");
  });

  it("clears the note once the change is recorded", async () => {
    const user = userEvent.setup();
    renderChanger();

    await chooseStatus(user, "In Review");
    const note = screen.getByLabelText(/note/i);
    await user.type(note, "Recruiter replied");
    await user.click(screen.getByRole("button", { name: /update status/i }));

    expect(note).toHaveValue("");
  });

  it("locks the controls while the request is in flight", () => {
    renderChanger({ isSaving: true });
    expect(screen.getByRole("button", { name: /updating/i })).toBeDisabled();
    expect(screen.getByLabelText(/note/i)).toBeDisabled();
  });

  it("shows what the backend said when the update fails", () => {
    renderChanger({ error: "the application is already in that status" });
    expect(screen.getByRole("alert")).toHaveTextContent(/already in that status/i);
  });
});
