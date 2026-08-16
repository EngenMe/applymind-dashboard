"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as auth from "@/lib/api/auth";

/**
 * Query keys for the auth module.
 *
 * Written here rather than in query-keys.ts because that file was not in front
 * of me — move them across to match the others, the strings are what matter.
 */
export const authKeys = {
  me: ["auth", "me"] as const,
  sessions: ["auth", "sessions"] as const,
  tokens: ["auth", "tokens"] as const,
};

export function useMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: auth.me,
    // A 401 here means signed out, and asking three more times will not change
    // that — it just delays the redirect by three round trips.
    retry: false,
    enabled: options?.enabled ?? true,
  });
}

export function useSignIn() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: auth.login,
    onSuccess: () => {
      // Everything cached was fetched as somebody else — either the demo
      // credential or a previous account. None of it belongs to this user.
      client.clear();
      router.refresh();
    },
  });
}

export function useSignUp() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: auth.register,
    onSuccess: () => {
      client.clear();
      router.refresh();
    },
  });
}

/**
 * Signing out.
 *
 * The cache is cleared on settled rather than on success: logout answers 204
 * even when there was nothing to revoke, and on the paths where it fails the
 * user still asked to leave. Holding their applications in memory because the
 * request errored would be the wrong way to honour that.
 */
export function useSignOut() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: auth.logout,
    onSettled: () => {
      client.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}

export function useSessions() {
  return useQuery({ queryKey: authKeys.sessions, queryFn: auth.listSessions });
}

export function useRevokeSession() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: auth.revokeSession,
    onSuccess: (_result, id) => {
      /**
       * Revoking the session you are sitting in is allowed, and the next
       * request will 401. Refreshing sends the layout's own check into that
       * 401 immediately, so the user lands on /login rather than watching the
       * page decay one failed query at a time.
       */
      const revokedSelf = client
          .getQueryData<auth.SessionSummary[]>(authKeys.sessions)
          ?.some((session) => session.id === id && session.current);

      if (revokedSelf) {
        client.clear();
        router.replace("/login");
        router.refresh();
        return;
      }
      void client.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}

export function useApiTokens() {
  return useQuery({ queryKey: authKeys.tokens, queryFn: auth.listTokens });
}

export function useIssueToken() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: auth.issueToken,
    onSuccess: () => client.invalidateQueries({ queryKey: authKeys.tokens }),
  });
}

export function useRevokeToken() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: auth.revokeToken,
    onSuccess: () => client.invalidateQueries({ queryKey: authKeys.tokens }),
  });
}