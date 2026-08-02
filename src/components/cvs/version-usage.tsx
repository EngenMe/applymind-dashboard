"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/applications/status-badge";
import { useCVVersionUsage } from "@/lib/hooks/use-cvs";
import { effectiveDate } from "@/lib/applications/filters";
import { formatDate } from "@/lib/format";
import type { Application } from "@/lib/api/types";

/**
 * Where one version has actually been sent — the answer to "what did I send
 * these people?" read from the CV end instead of the application end.
 *
 * Fetches only when the group it lives in is open; a closed group costs nothing.
 */
export function VersionUsage({ versionId }: { versionId: string }) {
  const { data, isPending, isError } = useCVVersionUsage(versionId);
  const applications = data?.applications ?? [];

  if (isPending) {
    return <p className="eyebrow">Checking where this went…</p>;
  }

  if (isError) {
    return (
      <p className="text-xs text-rose-700" role="alert">
        Could not load where this version was sent.
      </p>
    );
  }

  if (applications.length === 0) {
    return <p className="eyebrow">Not sent anywhere yet</p>;
  }

  return (
    <div>
      <p className="eyebrow">
        Sent to {applications.length} {applications.length === 1 ? "application" : "applications"}
      </p>
      <ul className="mt-1.5 space-y-1">
        {applications.map((application) => (
          <li key={application.id}>
            <UsageRow application={application} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsageRow({ application }: { application: Application }) {
  return (
    <Link
      href={`/applications/${application.id}`}
      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm hover:underline"
    >
      <span className="font-medium">{application.company_name}</span>
      <span className="text-ink-muted">{application.job_title}</span>
      <span className="eyebrow tabular">{formatDate(effectiveDate(application))}</span>
      <StatusBadge status={application.status} />
    </Link>
  );
}
