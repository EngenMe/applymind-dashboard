"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApplication,
  listApplications,
  updateApplication,
  updateApplicationStatus,
} from "@/lib/api/applications";
import type {
  Application,
  ListApplicationsParams,
  UpdateApplicationBody,
  UpdateStatusBody,
} from "@/lib/api/types";
import { queryKeys } from "./query-keys";

export function useApplicationList(params: ListApplicationsParams) {
  return useQuery({
    queryKey: queryKeys.applicationList(params),
    queryFn: ({ signal }) => listApplications(params, signal),
    // Keeps the previous page on screen while a filter change loads, so the
    // table does not collapse to a spinner on every keystroke.
    placeholderData: (previous) => previous,
    staleTime: 15 * 1000,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.application(id),
    queryFn: ({ signal }) => getApplication(id, signal),
    enabled: Boolean(id),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateApplicationBody) => updateApplication(id, body),
    onSuccess: (application) => {
      queryClient.setQueryData(queryKeys.application(id), (previous?: Application) => ({
        ...application,
        // PUT does not return the history; keep what the detail query already has.
        status_history: application.status_history ?? previous?.status_history,
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

/**
 * PATCH /applications/{id}/status. Every call writes an application_status_history
 * row backend-side, which is why the detail query is refetched rather than
 * patched in place — the new timeline entry comes from the server.
 */
export function useUpdateApplicationStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStatusBody) => updateApplicationStatus(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.application(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}
