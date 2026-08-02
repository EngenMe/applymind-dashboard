"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTextCoverLetter,
  editTextCoverLetter,
  getCoverLetter,
  getCoverLetterDownloadLink,
} from "@/lib/api/cover-letters";
import type { Application, CoverLetter } from "@/lib/api/types";
import { collectEntries, summarise } from "@/lib/cover-letters/history";
import { queryKeys } from "./query-keys";

export function useCoverLetter(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.coverLetter(applicationId),
    queryFn: ({ signal }) => getCoverLetter(applicationId, signal),
    enabled: Boolean(applicationId),
  });
}

/**
 * Saves the text body. POST creates, PUT edits — the backend keeps them separate
 * because a file cover letter can only be replaced, never edited, so the caller
 * has to say which it means. Here the existing letter decides.
 */
export function useSaveCoverLetterText(applicationId: string, exists: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bodyText: string) =>
        exists
            ? editTextCoverLetter(applicationId, bodyText)
            : createTextCoverLetter(applicationId, bodyText),
    onSuccess: (coverLetter: CoverLetter) => {
      queryClient.setQueryData(queryKeys.coverLetter(applicationId), coverLetter);
    },
  });
}

/**
 * Fetches a presigned URL on demand. Deliberately a mutation rather than a
 * query: the link is short-lived, so it is asked for at the moment of the click
 * instead of being cached from page load.
 */
export function useCoverLetterDownload(applicationId: string) {
  return useMutation({
    mutationFn: () => getCoverLetterDownloadLink(applicationId),
    onSuccess: (link) => {
      window.open(link.url, "_blank", "noopener,noreferrer");
    },
  });
}

/**
 * Same thing for a list, where the application is only known at click time. One
 * mutation for the whole page instead of one hook per row.
 */
export function useCoverLetterFileDownload() {
  return useMutation({
    mutationFn: (applicationId: string) => getCoverLetterDownloadLink(applicationId),
    onSuccess: (link) => {
      window.open(link.url, "_blank", "noopener,noreferrer");
    },
  });
}

/**
 * The history behind /cover-letters.
 *
 * Nothing lists cover letters on their own — a letter is only ever addressed as
 * /applications/{id}/coverletter — so this asks each application in the batch
 * for its letter and keeps the ones that have one. Each answer is cached under
 * the same key the application detail page uses, so opening an application after
 * browsing the history costs nothing, and a save over there shows up here.
 */
export function useCoverLetterHistory(applications: Application[]) {
  const lookups = useQueries({
    queries: applications.map((application) => ({
      queryKey: queryKeys.coverLetter(application.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getCoverLetter(application.id, signal),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const entries = collectEntries(applications, lookups);

  return { entries, ...summarise(lookups, entries.length) };
}