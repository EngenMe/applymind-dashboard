import { request } from "./client";
import type { DownloadLink, ListCVsResponse, UploadCVResponse } from "./types";

/** GET /cvs — every CV group with its full version history. */
export function listCVs(signal?: AbortSignal): Promise<ListCVsResponse> {
  return request<ListCVsResponse>("/cvs", { signal });
}

/**
 * POST /cvs (multipart) — stores a file and creates the CV group for it.
 *
 * The endpoint takes `file`, `cv_id` and `tag`, and nothing else: there is no
 * name field, so a new group is named after the file it was created from.
 * `cv_id` attaches a file to an existing group as a new version, which is what
 * the extension does after a Flow 3 new_version outcome; the dashboard does not
 * send it, so an upload here always starts a new group.
 */
export function uploadCV(file: File, tag?: string): Promise<UploadCVResponse> {
  const form = new FormData();
  form.append("file", file);
  if (tag?.trim()) form.append("tag", tag.trim());
  return request<UploadCVResponse>("/cvs", { method: "POST", formData: form });
}

/**
 * GET /cvs/{cvId}/versions/{versionId}/download — a short-lived presigned S3
 * URL, returned as JSON rather than a redirect.
 */
export function getCVDownloadLink(cvId: string, versionId: string): Promise<DownloadLink> {
  return request<DownloadLink>(`/cvs/${cvId}/versions/${versionId}/download`);
}
