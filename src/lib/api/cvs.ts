import { request } from "./client";
import type { DownloadLink, ListCVsResponse } from "./types";

/** GET /cvs — every CV group with its full version history. */
export function listCVs(signal?: AbortSignal): Promise<ListCVsResponse> {
  return request<ListCVsResponse>("/cvs", { signal });
}

/**
 * GET /cvs/{cvId}/versions/{versionId}/download — a short-lived presigned S3
 * URL, returned as JSON rather than a redirect.
 */
export function getCVDownloadLink(cvId: string, versionId: string): Promise<DownloadLink> {
  return request<DownloadLink>(`/cvs/${cvId}/versions/${versionId}/download`);
}
