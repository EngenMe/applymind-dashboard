"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Mail } from "lucide-react";
import { CoverLetterList } from "@/components/cover-letters/cover-letter-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useApplicationList } from "@/lib/hooks/use-applications";
import { useCoverLetterFileDownload, useCoverLetterHistory } from "@/lib/hooks/use-cover-letter";
import type { ListApplicationsParams } from "@/lib/api/types";

/**
 * How many applications are checked per batch.
 *
 * Smaller than the applications page's own page size on purpose: there is no
 * endpoint that lists cover letters, so each application in the batch costs one
 * request to /applications/{id}/coverletter. Twenty-five keeps that fan-out to
 * something a browser will happily run while still filling a screen.
 */
const BATCH_SIZE = 25;

export function CoverLettersView() {
  const [batches, setBatches] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const params = useMemo<ListApplicationsParams>(
    () => ({ limit: BATCH_SIZE * batches, offset: 0 }),
    [batches],
  );

  const applicationsQuery = useApplicationList(params);
  const applications = useMemo(
    () => applicationsQuery.data?.applications ?? [],
    [applicationsQuery.data],
  );

  const { entries, pending, failed, isInitial } = useCoverLetterHistory(applications);
  const download = useCoverLetterFileDownload();

  const checked = applications.length;
  const hasMore = checked >= BATCH_SIZE * batches;
  const loading = applicationsQuery.isPending || isInitial;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cover letters</h1>
          <p className="mt-1 text-sm text-ink-muted">
            What was sent, and who it was sent to. Each letter belongs to one application — there
            is nothing to reuse here.
          </p>
        </div>
        <p className="eyebrow tabular">
          {entries.length} {entries.length === 1 ? "letter" : "letters"} from {checked} checked
          {pending > 0 ? ` · checking ${pending}` : ""}
        </p>
      </div>

      {applicationsQuery.isError ? (
        <ErrorState
          message={errorMessage(applicationsQuery.error)}
          onRetry={applicationsQuery.refetch}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-rule bg-surface">
          {loading ? (
            <ListSkeleton />
          ) : entries.length === 0 ? (
            <EmptyState checked={checked} />
          ) : (
            <CoverLetterList
              entries={entries}
              openId={openId}
              onToggle={(id) => setOpenId((current) => (current === id ? null : id))}
              onDownload={(id) => download.mutate(id)}
              downloadingId={download.isPending ? (download.variables ?? null) : null}
              downloadError={
                download.isError ? "The download link could not be created. Try again." : null
              }
            />
          )}
        </div>
      )}

      {failed > 0 ? (
        <p className="text-sm text-ink-muted" role="status">
          {failed} {failed === 1 ? "application" : "applications"} could not be checked, so a letter
          may be missing from this list.
        </p>
      ) : null}

      {hasMore && !applicationsQuery.isError ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setBatches((current) => current + 1)}
            disabled={applicationsQuery.isFetching || pending > 0}
          >
            {applicationsQuery.isFetching || pending > 0
              ? "Checking…"
              : `Check ${BATCH_SIZE} older applications`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function EmptyState({ checked }: { checked: number }) {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-sm text-center">
        <Mail className="mx-auto size-5 text-ink-faint" aria-hidden />
        <p className="mt-3 text-sm font-medium">No cover letters yet.</p>
        <p className="mt-1 text-sm text-ink-muted">
          {checked === 0
            ? "Nothing has been tracked yet, so there is nothing to show."
            : `None of the ${checked} most recent applications had a cover letter attached.`}
        </p>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-rule">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-rose-200 bg-rose-50/60 px-4 py-6 text-center">
      <AlertTriangle className="mx-auto size-5 text-rose-600" aria-hidden />
      <p className="mt-3 text-sm font-medium text-rose-900">The applications did not load.</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
