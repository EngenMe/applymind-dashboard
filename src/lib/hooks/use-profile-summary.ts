"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfileSummary, updateProfileSummary } from "@/lib/api/settings";
import type { ProfileSummaryResponse } from "@/lib/api/types";
import { queryKeys } from "./query-keys";

/**
 * The profile summary the AI job score is calculated against. Rarely changes,
 * so it is left stale for the length of a visit rather than refetched.
 */
export function useProfileSummary() {
  return useQuery({
    queryKey: queryKeys.profileSummary,
    queryFn: ({ signal }) => getProfileSummary(signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/**
 * PUT the summary. The response is the stored row, so it is written straight
 * into the cache — no refetch, and the saved-at line updates in the same tick.
 */
export function useUpdateProfileSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (summary: string) => updateProfileSummary(summary),
    onSuccess: (data: ProfileSummaryResponse) => {
      queryClient.setQueryData(queryKeys.profileSummary, data);
    },
  });
}
