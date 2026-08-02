import { ApiError, request } from "./client";
import type { CoverLetter, DownloadLink } from "./types";

/**
 * GET /applications/{id}/coverletter.
 *
 * Returns null rather than throwing when the application has no cover letter —
 * that is a normal state on the detail page, not an error worth surfacing.
 */
export async function getCoverLetter(
  applicationId: string,
  signal?: AbortSignal,
): Promise<CoverLetter | null> {
  try {
    return await request<CoverLetter>(`/applications/${applicationId}/coverletter`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.code === "cover_letter_not_found") {
      return null;
    }
    throw error;
  }
}

/** POST /applications/{id}/coverletter — creates a text cover letter. */
export function createTextCoverLetter(
  applicationId: string,
  bodyText: string,
): Promise<CoverLetter> {
  return request<CoverLetter>(`/applications/${applicationId}/coverletter`, {
    method: "POST",
    body: { body_text: bodyText },
  });
}

/**
 * PUT /applications/{id}/coverletter — edits an existing text cover letter.
 * A file cover letter is a record of what was actually sent, so the backend
 * answers 409 not_editable here; replacing it means uploading a new one, which
 * belongs to the Cover Letter Manager phase.
 */
export function editTextCoverLetter(
  applicationId: string,
  bodyText: string,
): Promise<CoverLetter> {
  return request<CoverLetter>(`/applications/${applicationId}/coverletter`, {
    method: "PUT",
    body: { body_text: bodyText },
  });
}

/** GET /applications/{id}/coverletter/download — file cover letters only. */
export function getCoverLetterDownloadLink(applicationId: string): Promise<DownloadLink> {
  return request<DownloadLink>(`/applications/${applicationId}/coverletter/download`);
}
