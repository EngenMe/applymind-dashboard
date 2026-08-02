"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/errors";
import {
  canSave,
  characterCount,
  currentValue,
  savedAtLabel,
} from "@/lib/settings/profile-summary";
import {
  useProfileSummary,
  useUpdateProfileSummary,
} from "@/lib/hooks/use-profile-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const FIELD_ID = "profile-summary";

/**
 * The three or four sentences the AI job-match score is calculated against.
 * Until one is saved, applications are stored without a score.
 */
export function ProfileSummaryCard() {
  const query = useProfileSummary();
  const update = useUpdateProfileSummary();

  // null until something is typed, so the textarea follows the server value on
  // load and after a save without an effect to keep the two in step.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saved = query.data?.profile_summary ?? null;
  const value = currentValue(draft, saved);
  const savedAt = savedAtLabel(saved, query.data?.updated_at);

  function save() {
    setError(null);
    update.mutate(value.trim(), {
      onSuccess: () => setDraft(null),
      onError: (cause) =>
        setError(errorMessage(cause, "Could not save the summary. Try again.")),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile summary</CardTitle>
        <CardDescription>
          Three or four sentences about the work you want and what you bring to it.
          ApplyMind scores each job you apply to against this. Until you save one,
          applications are stored without a score.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {query.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : query.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage(
              query.error,
              "Could not load your summary. Check the API is reachable and reload.",
            )}
          </p>
        ) : (
          <>
            <Label htmlFor={FIELD_ID}>Summary</Label>
            <Textarea
              id={FIELD_ID}
              rows={5}
              value={value}
              disabled={update.isPending}
              placeholder="Backend engineer, six years in Go and Postgres. Looking for remote-first product teams…"
              onChange={(event) => setDraft(event.target.value)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-muted">
                {characterCount(draft, saved)} characters
                {savedAt ? ` · saved ${savedAt}` : ""}
              </p>
              <Button
                type="button"
                onClick={save}
                disabled={!canSave(draft, saved) || update.isPending}
              >
                {update.isPending ? "Saving…" : "Save summary"}
              </Button>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
