import { request } from "./client";
import type { ProfileSummaryResponse } from "./types";

/**
 * GET /settings/profile-summary.
 *
 * The settings row always exists, so this is always a 200 — an unset summary
 * comes back as `{ profile_summary: null, updated_at: ... }`. Note that
 * updated_at is the row's timestamp, not the summary's: it is populated from
 * the migration even when no summary has ever been saved, so only show it
 * alongside a non-null summary.
 */
export function getProfileSummary(signal?: AbortSignal): Promise<ProfileSummaryResponse> {
  return request<ProfileSummaryResponse>("/settings/profile-summary", { signal });
}

/**
 * PUT /settings/profile-summary. Answers 200 with the stored value.
 *
 * The backend rejects an empty summary with 400 profile_summary_required, so
 * there is no way to clear one once set — only to replace it.
 */
export function updateProfileSummary(profileSummary: string): Promise<ProfileSummaryResponse> {
  return request<ProfileSummaryResponse>("/settings/profile-summary", {
    method: "PUT",
    body: { profile_summary: profileSummary },
  });
}
