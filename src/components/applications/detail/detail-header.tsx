"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { StatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import type { Application } from "@/lib/api/types";
import { isTerminal, pipelineProgress } from "@/lib/applications/status";
import { formatDate, formatRelativeDays, hostOf } from "@/lib/format";
import { effectiveDate } from "@/lib/applications/filters";
import { useDeleteApplication } from "@/lib/hooks/use-applications";
import { errorMessage } from "@/lib/api/errors";

export function DetailHeader({
  application,
  siteName,
}: {
  application: Application;
  siteName: string;
}) {
  const date = effectiveDate(application);
  const progress = pipelineProgress(application.status);

  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All applications
        </Link>

        <DeleteApplicationControl applicationId={application.id} companyName={application.company_name} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{application.company_name}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">{application.job_title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
            <span className="tabular font-mono">
              {application.applied_at ? "Applied" : "Saved"} {formatDate(date)} ·{" "}
              {formatRelativeDays(date)}
            </span>
            <span>{siteName || hostOf(application.job_url)}</span>
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ink-muted hover:text-ink hover:underline"
            >
              Open job posting
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </div>
        </div>

        <StatusBadge status={application.status} className="mt-1 text-sm" />
      </div>

      {/*
        The pipeline rail. It encodes one true thing — how far this application
        got — and nothing else. Terminal statuses fill it whether the ending was
        good or not, because the process is over either way; the colour on the
        badge says which kind of ending it was.
      */}
      <div
        className="h-px w-full bg-rule"
        role="img"
        aria-label={`Pipeline position: ${application.status}`}
      >
        <div
          className={
            isTerminal(application.status)
              ? "h-px bg-rule-strong"
              : "h-px bg-graphite transition-[width] duration-500"
          }
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </header>
  );
}

/**
 * Delete, guarded by a two-step inline confirm rather than a modal — there is
 * no Dialog primitive in ui/ to build on, and a second click is enough
 * friction for a destructive action that only affects one record.
 *
 * On the public demo deployment this never actually reaches the database (see
 * DEMO_MODE in the API proxy) — the row still disappears from the list here,
 * it just comes back on the next real page load.
 */
function DeleteApplicationControl({
  applicationId,
  companyName,
}: {
  applicationId: string;
  companyName: string;
}) {
  const router = useRouter();
  const deleteApplication = useDeleteApplication();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    setError(null);
    deleteApplication.mutate(applicationId, {
      onSuccess: () => router.push("/applications"),
      onError: (cause) =>
        setError(errorMessage(cause, "Could not delete this application. Try again.")),
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <>
          <span className="text-sm text-ink-muted">Delete {companyName}?</span>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={confirm}
            disabled={deleteApplication.isPending}
          >
            {deleteApplication.isPending ? "Deleting…" : "Confirm delete"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={deleteApplication.isPending}
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden />
          Delete
        </Button>
      )}
    </div>
  );
}
