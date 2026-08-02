"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCVs } from "@/lib/api/cvs";
import type { CV, CVVersion } from "@/lib/api/types";
import { queryKeys } from "./query-keys";

export interface ResolvedCVVersion {
  cv: CV;
  version: CVVersion;
  /** "Backend CV — v3" style label, unique enough to sort and search on. */
  label: string;
}

/**
 * GET /cvs returns every group with its versions, which is the only way to turn
 * an application's cv_version_id into something a human recognises. One request
 * serves both pages, so it is cached generously.
 */
export function useCVIndex() {
  const query = useQuery({
    queryKey: queryKeys.cvs,
    queryFn: ({ signal }) => listCVs(signal),
    staleTime: 5 * 60 * 1000,
  });

  const index = useMemo(() => {
    const map = new Map<string, ResolvedCVVersion>();
    for (const cv of query.data?.cvs ?? []) {
      const versions = cv.versions ?? [];
      // Oldest first, so "v1" is the first thing that was uploaded.
      const ordered = [...versions].sort(
        (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime(),
      );
      ordered.forEach((version, position) => {
        map.set(version.id, {
          cv,
          version,
          label: `${cv.name} — v${position + 1}`,
        });
      });
    }
    return map;
  }, [query.data]);

  return {
    ...query,
    index,
    /** Ordered list for the CV filter dropdown. */
    options: useMemo(
      () =>
        [...index.entries()]
          .map(([id, resolved]) => ({ id, label: resolved.label }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      [index],
    ),
    label: (cvVersionId: string | null) =>
      cvVersionId ? (index.get(cvVersionId)?.label ?? "Unknown CV") : "",
  };
}
