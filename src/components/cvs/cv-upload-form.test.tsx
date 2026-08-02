import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CVUploadForm } from "./cv-upload-form";

function renderForm(overrides: Partial<React.ComponentProps<typeof CVUploadForm>> = {}) {
  const onUpload = vi.fn();
  const utils = render(<CVUploadForm onUpload={onUpload} isUploading={false} {...overrides} />);
  return { onUpload, ...utils };
}

const file = () => new File(["%PDF-1.7"], "backend-cv.pdf", { type: "application/pdf" });

describe("CVUploadForm", () => {
  it("uploads the chosen file", async () => {
    const user = userEvent.setup();
    const { onUpload } = renderForm();

    await user.upload(screen.getByLabelText(/cv file/i), file());
    await user.click(screen.getByRole("button", { name: /upload cv/i }));

    expect(onUpload).toHaveBeenCalledWith({
      file: expect.objectContaining({ name: "backend-cv.pdf" }),
      tag: undefined,
    });
  });

  it("sends the tag when one was typed", async () => {
    const user = userEvent.setup();
    const { onUpload } = renderForm();

    await user.upload(screen.getByLabelText(/cv file/i), file());
    await user.type(screen.getByLabelText(/tag/i), "  backend  ");
    await user.click(screen.getByRole("button", { name: /upload cv/i }));

    expect(onUpload).toHaveBeenCalledWith(expect.objectContaining({ tag: "backend" }));
  });

  it("asks for a file instead of sending an empty upload", async () => {
    const user = userEvent.setup();
    const { onUpload } = renderForm();

    await user.click(screen.getByRole("button", { name: /upload cv/i }));

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a file/i);
  });

  it("says where the name comes from, since the form has no name field", () => {
    renderForm();
    expect(screen.getByText(/named after the file/i)).toBeInTheDocument();
  });

  it("locks the controls while the upload is in flight", () => {
    renderForm({ isUploading: true });
    expect(screen.getByRole("button", { name: /uploading/i })).toBeDisabled();
    expect(screen.getByLabelText(/cv file/i)).toBeDisabled();
  });

  it("reports what was stored and clears the picker", async () => {
    const user = userEvent.setup();
    const { rerender } = renderForm();

    const input = screen.getByLabelText(/cv file/i) as HTMLInputElement;
    await user.upload(input, file());
    expect(input.files).toHaveLength(1);

    rerender(
      <CVUploadForm
        onUpload={vi.fn()}
        isUploading={false}
        outcome={{ cvName: "backend-cv", filename: "backend-cv.pdf", alreadyExisted: false }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("backend-cv.pdf saved as backend-cv.");
    expect(input.files).toHaveLength(0);
  });

  it("says plainly when the same bytes were already stored", () => {
    renderForm({
      outcome: { cvName: "backend-cv", filename: "backend-cv.pdf", alreadyExisted: true },
    });
    expect(screen.getByRole("status")).toHaveTextContent(/nothing new was created/i);
  });

  it("shows what the backend said when the upload fails", () => {
    renderForm({ error: "the uploaded file is too large" });
    expect(screen.getByRole("alert")).toHaveTextContent(/too large/i);
  });
});
