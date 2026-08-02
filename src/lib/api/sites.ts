import { request } from "./client";
import type { AddSiteBody, ListSitesResponse, Site } from "./types";

/**
 * GET /sites — every site, pre-configured and custom. The handler also accepts
 * ?active=true, which the extension uses; the dashboard settings page wants the
 * inactive ones too, so nothing here narrows the list.
 */
export function listSites(signal?: AbortSignal): Promise<ListSitesResponse> {
  return request<ListSitesResponse>("/sites", { signal });
}

/**
 * POST /sites. Answers 201 with the created site, unwrapped. `domain` may be a
 * bare host or a full URL — the stored value is the normalised host, so callers
 * should show what comes back rather than what they sent.
 *
 * 409 site_already_exists when the name or domain is taken.
 */
export function addSite(body: AddSiteBody): Promise<Site> {
  return request<Site>("/sites", { method: "POST", body });
}

/**
 * PATCH /sites/{id}/toggle. Flips is_active rather than setting it, so this
 * takes no desired value — the response carries the new one. Allowed on
 * pre-configured sites; that is how they are switched off without deleting.
 *
 * The empty object is deliberate: the proxy route streams `request.body` on
 * PATCH, and every other PATCH in the dashboard reaches it with a body. The
 * handler does not read it.
 */
export function toggleSite(id: string): Promise<Site> {
  return request<Site>(`/sites/${id}/toggle`, { method: "PATCH", body: {} });
}

/**
 * DELETE /sites/{id} — 204 on success. Refused with 409 for pre-configured
 * sites (site_is_preconfigured) and for sites an application still points at
 * (site_in_use); applications.site_id is ON DELETE RESTRICT.
 */
export function deleteSite(id: string): Promise<void> {
  return request<void>(`/sites/${id}`, { method: "DELETE" });
}
