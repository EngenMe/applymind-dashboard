"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StatusBadge } from "../status-badge";
import type { Application } from "@/lib/api/types";
import { isTerminal, pipelineProgress } from "@/lib/applications/status";
import { formatDate, formatRelativeDays, hostOf } from "@/lib/format";
import { effectiveDate } from "@/lib/applications/filters";

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
      <Link
        href="/applications"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All applications
      </Link>

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
