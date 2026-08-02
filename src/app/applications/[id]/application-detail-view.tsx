"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DetailHeader } from "@/components/applications/detail/detail-header";
import { CapturedFieldsCard } from "@/components/applications/detail/captured-fields-card";
import { JobDescriptionCard } from "@/components/applications/detail/job-description-card";
import { CVCard } from "@/components/applications/detail/cv-card";
import { CoverLetterCard } from "@/components/applications/detail/cover-letter-card";
import { AIScoreCard } from "@/components/applications/detail/ai-score-card";
import { StatusChanger } from "@/components/applications/detail/status-changer";
import { StatusHistoryTimeline } from "@/components/applications/detail/status-history-timeline";
import { NotesCard } from "@/components/applications/detail/notes-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  useApplication,
  useUpdateApplication,
  useUpdateApplicationStatus,
} from "@/lib/hooks/use-applications";
import { useCVIndex } from "@/lib/hooks/use-cvs";
import { useSiteIndex } from "@/lib/hooks/use-sites";
import type { ApplicationStatus, UpdateApplicationBody } from "@/lib/api/types";

export function ApplicationDetailView({ id }: { id: string }) {
  const { data: application, isPending, isError, error } = useApplication(id);
  const cvs = useCVIndex();
  const sites = useSiteIndex();

  const update = useUpdateApplication(id);
  const updateStatus = useUpdateApplicationStatus(id);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    const notFound = error instanceof ApiError && error.isNotFound;
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <AlertTriangle className="mx-auto size-5 text-rose-600" aria-hidden />
        <p className="mt-3 text-sm font-medium">
          {notFound ? "That application no longer exists." : "The application did not load."}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/applications">Back to applications</Link>
        </Button>
      </div>
    );
  }

  const history = application.status_history ?? [];
  const resolvedCV = application.cv_version_id
    ? cvs.index.get(application.cv_version_id)
    : undefined;

  const save = (body: UpdateApplicationBody) => update.mutateAsync(body);

  const changeStatus = (status: ApplicationStatus, note: string) =>
    updateStatus.mutateAsync({ status, note: note || null, changed_by: "user" });

  return (
    <div className="space-y-6">
      <DetailHeader application={application} siteName={sites.name(application.site_id)} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <CapturedFieldsCard
            application={application}
            siteOptions={sites.options}
            cvOptions={cvs.options}
            onSave={save}
            isSaving={update.isPending}
            error={update.isError ? errorMessage(update.error) : null}
          />
          <JobDescriptionCard
            application={application}
            onSave={save}
            isSaving={update.isPending}
          />
          <CoverLetterCard applicationId={application.id} />
        </div>

        <aside className="space-y-5">
          <StatusChanger
            status={application.status}
            onSubmit={changeStatus}
            isSaving={updateStatus.isPending}
            error={updateStatus.isError ? errorMessage(updateStatus.error) : null}
          />
          <CVCard resolved={resolvedCV} isLoading={cvs.isPending} />
          <AIScoreCard application={application} />
          <NotesCard history={history} />
          <StatusHistoryTimeline history={history} />
        </aside>
      </div>
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
