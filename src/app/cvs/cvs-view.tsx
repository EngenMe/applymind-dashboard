"use client";

import { useState } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { CVGroup } from "@/components/cvs/cv-group";
import { CVUploadForm, type UploadOutcome } from "@/components/cvs/cv-upload-form";
import { VersionUsage } from "@/components/cvs/version-usage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useCVList, useCVVersionDownload, useUploadCV } from "@/lib/hooks/use-cvs";
import { versionCount } from "@/lib/cvs/versions";

export function CVsView() {
  const { cvs, isPending, isError, error, refetch } = useCVList();
  const upload = useUploadCV();
  const download = useCVVersionDownload();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [outcome, setOutcome] = useState<UploadOutcome | null>(null);

  const toggle = (cvId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(cvId)) next.delete(cvId);
      else next.add(cvId);
      return next;
    });

  const startUpload = ({ file, tag }: { file: File; tag?: string }) => {
    setOutcome(null);
    upload.mutate(
      { file, tag },
      {
        onSuccess: (result) => {
          setOutcome({
            cvName: result.cv.name,
            filename: result.version.original_filename,
            alreadyExisted: result.already_existed,
          });
          // Open whatever it landed under, so the result is visible rather than
          // just described.
          setExpanded((current) => new Set(current).add(result.cv.id));
        },
      },
    );
  };

  const versions = cvs.reduce((total, cv) => total + versionCount(cv), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">CVs</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every CV, every version of it, and where each one was sent.
          </p>
        </div>
        <p className="eyebrow tabular">
          {cvs.length} {cvs.length === 1 ? "CV" : "CVs"} · {versions}{" "}
          {versions === 1 ? "version" : "versions"}
        </p>
      </div>

      <CVUploadForm
        onUpload={startUpload}
        isUploading={upload.isPending}
        outcome={outcome}
        error={upload.isError ? errorMessage(upload.error) : null}
      />

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : isPending ? (
        <ListSkeleton />
      ) : cvs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <CVGroup
              key={cv.id}
              cv={cv}
              expanded={expanded.has(cv.id)}
              onToggle={() => toggle(cv.id)}
              onDownload={(versionId) => download.mutate({ cvId: cv.id, versionId })}
              downloadingVersionId={
                download.isPending ? (download.variables?.versionId ?? null) : null
              }
              downloadError={
                download.isError ? "The download link could not be created. Try again." : null
              }
              renderUsage={(versionId) => <VersionUsage versionId={versionId} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function EmptyState() {
  return (
    <div className="rounded-card border border-rule bg-surface py-16">
      <div className="mx-auto max-w-sm text-center">
        <FileText className="mx-auto size-5 text-ink-faint" aria-hidden />
        <p className="mt-3 text-sm font-medium">No CVs stored yet.</p>
        <p className="mt-1 text-sm text-ink-muted">
          Upload one above, or apply to a job with the extension active and whatever you attach
          lands here.
        </p>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-card border border-rule bg-surface px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-rose-200 bg-rose-50/60 px-4 py-6 text-center">
      <AlertTriangle className="mx-auto size-5 text-rose-600" aria-hidden />
      <p className="mt-3 text-sm font-medium text-rose-900">The CVs did not load.</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
