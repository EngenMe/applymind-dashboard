"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
  updateApplicationStatus,
} from "@/lib/api/applications";
import type {
  Application,
  ListApplicationsParams,
  ListApplicationsResponse,
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

/**
 * Merges a partial Application onto both the detail cache and every cached
 * list-query variant, without refetching either.
 *
 * Deliberately not `invalidateQueries`: in the demo deployment the proxy never
 * actually writes anything, so a refetch would return the real, unchanged
 * record and the edit would visibly revert inside the same session. A spread
 * merge is also safe against a partial response — any field the response
 * doesn't carry (the demo proxy's fake response, or PUT's real response,
 * which the existing comment below notes omits status_history) is simply
 * inherited from whatever was already cached, not wiped out.
 */
function patchApplicationEverywhere(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<Application>,
) {
  queryClient.setQueryData(queryKeys.application(id), (previous?: Application) =>
    previous ? { ...previous, ...patch } : previous,
  );

  queryClient.setQueriesData<ListApplicationsResponse>(
    { queryKey: ["applications", "list"], exact: false },
    (current) =>
      current
        ? {
            applications: current.applications.map((application) =>
              application.id === id ? { ...application, ...patch } : application,
            ),
          }
        : current,
  );
}

function removeApplicationEverywhere(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.removeQueries({ queryKey: queryKeys.application(id) });

  queryClient.setQueriesData<ListApplicationsResponse>(
    { queryKey: ["applications", "list"], exact: false },
    (current) =>
      current
        ? { applications: current.applications.filter((application) => application.id !== id) }
        : current,
  );
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateApplicationBody) => updateApplication(id, body),
    onMutate: async () => {
      return { previous: queryClient.getQueryData<Application>(queryKeys.application(id)) };
    },
    onSuccess: (application) => {
      // PUT's real response does not include status_history — keep whatever
      // the detail query already had rather than let this merge clear it.
      patchApplicationEverywhere(queryClient, id, {
        ...application,
        status_history: application.status_history ?? undefined,
      });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.application(id), context.previous);
      }
    },
  });
}

/**
 * PATCH /applications/{id}/status.
 *
 * The real endpoint's response is not trusted to carry a fresh status_history
 * — same reasoning as PUT above — so the new timeline entry is built here,
 * client-side, from what was actually submitted, and appended to whatever
 * history is already cached. On a real deployment, the next natural refetch
 * (a fresh page load) reconciles this against the server's own record; on the
 * demo deployment, there is no server record to reconcile against, which is
 * exactly the point.
 */
export function useUpdateApplicationStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateStatusBody) => updateApplicationStatus(id, body),
    onMutate: async (body) => {
      const previous = queryClient.getQueryData<Application>(queryKeys.application(id));

      if (previous) {
        const historyEntry = {
          id: `optimistic-${Date.now()}`,
          from_status: previous.status,
          to_status: body.status,
          changed_by: body.changed_by ?? "user",
          note: body.note ?? null,
          changed_at: new Date().toISOString(),
        };

        patchApplicationEverywhere(queryClient, id, {
          status: body.status,
          status_history: [historyEntry, ...(previous.status_history ?? [])],
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.application(id), context.previous);
      }
    },
  });
}

/**
 * DELETE /applications/{id}. Removes the row from every cached list and drops
 * the detail cache entry entirely, so navigating back to its URL after
 * deletion does not show a stale copy while the real GET (404, once this
 * really is gone) is in flight.
 */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: (_data, id) => {
      removeApplicationEverywhere(queryClient, id);
    },
  });
}
