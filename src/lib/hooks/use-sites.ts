"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listSites } from "@/lib/api/sites";
import { queryKeys } from "./query-keys";

/**
 * Site names for the list column and filter. If GET /sites is not reachable the
 * query fails quietly and every consumer falls back to the site id — the rest of
 * the page carries on working.
 */
export function useSiteIndex() {
  const query = useQuery({
    queryKey: queryKeys.sites,
    queryFn: ({ signal }) => listSites(signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

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
          .filter((site) => site.is_active !== false)
          .map((site) => ({ id: site.id, label: site.name }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      [query.data],
    ),
    name: (siteId: string) => index.get(siteId) ?? "",
  };
}
