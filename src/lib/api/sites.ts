import { request } from "./client";
import type { ListSitesResponse } from "./types";

/**
 * GET /sites.
 *
 * ASSUMPTION: the sites module exposes this and wraps the rows in a `sites` key,
 * matching how cvs wraps `cvs` and applications wraps `applications`. Its
 * handler was not attached to this phase. Everything that consumes this
 * degrades to showing the raw site id if the call fails, so a wrong guess here
 * costs a column, not the page.
 */
export function listSites(signal?: AbortSignal): Promise<ListSitesResponse> {
  return request<ListSitesResponse>("/sites", { signal });
}
