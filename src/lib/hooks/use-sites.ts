"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addSite, deleteSite, listSites, toggleSite } from "@/lib/api/sites";
import type { AddSiteBody, ListSitesResponse, Site } from "@/lib/api/types";
import { isActive } from "@/lib/sites/list";
import { queryKeys } from "./query-keys";

/**
 * The site list itself. The settings page reads this directly; useSiteIndex
 * below wraps it for the pages that only need a name. Both go through here so
 * there is one set of query options against one cache key.
 */
export function useSites() {
  return useQuery({
    queryKey: queryKeys.sites,
    queryFn: ({ signal }) => listSites(signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/**
 * Site names for the list column and filter. If GET /sites is not reachable the
 * query fails quietly and every consumer falls back to the site id — the rest of
 * the page carries on working.
 */
export function useSiteIndex() {
  const query = useSites();

  const index = useMemo(() => {
    const map = new Map<string, string>();
    for (const site of query.data?.sites ?? []) {
      map.set(site.id, site.name);
    }
    return map;
  }, [query.data]);

  return {
    ...query,
    index,
    options: useMemo(
      () =>
        (query.data?.sites ?? [])
          .filter(isActive)
          .map((site) => ({ id: site.id, label: site.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      [query.data],
    ),
    name: (siteId: string) => index.get(siteId) ?? "",
  };
}

/**
 * Merges a change into the cached site list without refetching.
 *
 * Deliberately not `invalidateQueries`: in the demo deployment, the proxy
 * never actually writes anything, so a refetch would return the real,
 * unchanged list and the edit would visibly revert inside the same session.
 * Patching the cache directly is also just a smaller, cheaper update in the
 * real deployment — the round trip already told us what changed.
 */
function patchSite(queryClient: ReturnType<typeof useQueryClient>, id: string, patch: Partial<Site>) {
  queryClient.setQueryData<ListSitesResponse>(queryKeys.sites, (current) => {
    if (!current) return current;
    return {
      sites: current.sites.map((site) => (site.id === id ? { ...site, ...patch } : site)),
    };
  });
}

/** POST /sites. Adds the new site straight into the cached list. */
export function useAddSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddSiteBody) => addSite(body),
    onSuccess: (created) => {
      queryClient.setQueryData<ListSitesResponse>(queryKeys.sites, (current) => ({
        sites: [...(current?.sites ?? []), created],
      }));
    },
  });
}

/**
 * PATCH /sites/{id}/toggle. The endpoint flips whatever it finds rather than
 * setting a value, so — unlike a normal PUT — there's no request body telling
 * us the new state. The toggle is computed here, from the cache's own current
 * value, before the request is even sent; the response is only consulted for
 * confirmation in the real deployment; the demo proxy's echo doesn't need to
 * carry `is_active` at all, since this hook never reads it from the response.
 */
export function useToggleSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleSite(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<ListSitesResponse>(queryKeys.sites);
      const current = previous?.sites.find((site) => site.id === id);
      if (current) {
        patchSite(queryClient, id, { is_active: !isActive(current) });
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      // Roll back if the real backend actually rejected it (only possible
      // outside demo mode — the demo proxy never fails a toggle).
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.sites, context.previous);
      }
    },
  });
}

/** DELETE /sites/{id}. Removes the row from the cached list on success. */
export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ListSitesResponse>(queryKeys.sites, (current) => ({
        sites: (current?.sites ?? []).filter((site) => site.id !== id),
      }));
    },
  });
}
