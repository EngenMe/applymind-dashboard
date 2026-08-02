"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addSite, deleteSite, listSites, toggleSite } from "@/lib/api/sites";
import type { AddSiteBody } from "@/lib/api/types";
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

/** POST /sites. Invalidates the list so the new site appears everywhere at once. */
export function useAddSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddSiteBody) => addSite(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  });
}

/**
 * PATCH /sites/{id}/toggle. Not optimistic on purpose: the endpoint flips
 * whatever it finds rather than setting a value, so the server's answer is the
 * only reliable state to render.
 */
export function useToggleSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  });
}

/** DELETE /sites/{id}. Rejected for pre-configured and in-use sites — see api/sites.ts. */
export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sites }),
  });
}
