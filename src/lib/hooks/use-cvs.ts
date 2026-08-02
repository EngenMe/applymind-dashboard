"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCVDownloadLink, listCVs, uploadCV } from "@/lib/api/cvs";
import { listApplications } from "@/lib/api/applications";
import type { CV, CVVersion, ListApplicationsParams } from "@/lib/api/types";
import { numberVersions, sortCVs } from "@/lib/cvs/versions";
import { queryKeys } from "./query-keys";

export interface ResolvedCVVersion {
  cv: CV;
  version: CVVersion;
  /** "Backend CV — v3" style label, unique enough to sort and search on. */
  label: string;
}

const CVS_STALE_TIME = 5 * 60 * 1000;

/**
 * GET /cvs returns every group with its versions, which is the only way to turn
 * an application's cv_version_id into something a human recognises. One request
 * serves both pages, so it is cached generously.
 */
export function useCVIndex() {
  const query = useQuery({
    queryKey: queryKeys.cvs,
    queryFn: ({ signal }) => listCVs(signal),
    staleTime: CVS_STALE_TIME,
  });

  const index = useMemo(() => {
    const map = new Map<string, ResolvedCVVersion>();
    for (const cv of query.data?.cvs ?? []) {
      for (const { version, label } of numberVersions(cv)) {
        map.set(version.id, { cv, version, label });
      }
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

/**
 * The same request as useCVIndex — same key, so one fetch serves both — shaped
 * for the CV manager: groups in the order they should be read.
 */
export function useCVList() {
  const query = useQuery({
    queryKey: queryKeys.cvs,
    queryFn: ({ signal }) => listCVs(signal),
    staleTime: CVS_STALE_TIME,
  });

  return {
    ...query,
    cvs: useMemo(() => sortCVs(query.data?.cvs ?? []), [query.data]),
  };
}

export function useUploadCV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, tag }: { file: File; tag?: string }) => uploadCV(file, tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cvs });
    },
  });
}

/**
 * One mutation for the whole version list rather than one per row. Deliberately
 * a mutation and not a query: presigned links expire, so the URL is asked for at
 * the moment of the click.
 */
export function useCVVersionDownload() {
  return useMutation({
    mutationFn: ({ cvId, versionId }: { cvId: string; versionId: string }) =>
      getCVDownloadLink(cvId, versionId),
    onSuccess: (link) => {
      window.open(link.url, "_blank", "noopener,noreferrer");
    },
  });
}

/** How many applications one version's usage list will show before it stops counting. */
export const USAGE_LIMIT = 100;

/**
 * Where a version has been sent.
 *
 * The cvs module has an ApplicationUsage projection but no route that returns
 * it, so this asks the applications list instead — GET /applications already
 * filters on cv_version_id. Using the applications list query key is the point:
 * changing a status on the detail page invalidates this too, so the usage list
 * cannot go stale behind the CV manager.
 *
 * Enabled only when the group is expanded, so opening the page costs one
 * request, not one per version.
 */
export function useCVVersionUsage(versionId: string, enabled = true) {
  const params: ListApplicationsParams = { cv_version_id: versionId, limit: USAGE_LIMIT };

  return useQuery({
    queryKey: queryKeys.applicationList(params),
    queryFn: ({ signal }) => listApplications(params, signal),
    enabled: enabled && Boolean(versionId),
    staleTime: 30 * 1000,
  });
}
