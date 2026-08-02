"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTextCoverLetter,
  editTextCoverLetter,
  getCoverLetter,
  getCoverLetterDownloadLink,
} from "@/lib/api/cover-letters";
import type { CoverLetter } from "@/lib/api/types";
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
