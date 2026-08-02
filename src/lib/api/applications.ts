import { buildQuery, request } from "./client";
import type {
  Application,
  ListApplicationsParams,
  ListApplicationsResponse,
  UpdateApplicationBody,
  UpdateStatusBody,
} from "./types";

export function listApplications(
  params: ListApplicationsParams = {},
  signal?: AbortSignal,
): Promise<ListApplicationsResponse> {
  return request<ListApplicationsResponse>(
    `/applications${buildQuery({ ...params })}`,
    { signal },
  );
}

/** GET /applications/{id} — includes the full status history. */
export function getApplication(id: string, signal?: AbortSignal): Promise<Application> {
  return request<Application>(`/applications/${id}`, { signal });
}

/** PUT /applications/{id} — captured job data only. */
export function updateApplication(
  id: string,
  body: UpdateApplicationBody,
): Promise<Application> {
  return request<Application>(`/applications/${id}`, { method: "PUT", body });
}

/**
 * PATCH /applications/{id}/status — the only way the status moves, so every
 * transition lands in application_status_history. The backend answers 409
 * status_unchanged if the application is already in that status.
 */
export function updateApplicationStatus(
  id: string,
  body: UpdateStatusBody,
): Promise<Application> {
  return request<Application>(`/applications/${id}/status`, {
    method: "PATCH",
    body: { changed_by: "user", ...body },
  });
}

export function deleteApplication(id: string): Promise<void> {
  return request<void>(`/applications/${id}`, { method: "DELETE" });
}
