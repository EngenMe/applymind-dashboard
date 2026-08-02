"use client";

import { ChevronRight, Download } from "lucide-react";
import { Panel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CV } from "@/lib/api/types";
import { lastUploadedAt, shortHash, versionCount, versionHistory } from "@/lib/cvs/versions";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CVGroupProps {
  cv: CV;
  expanded: boolean;
  onToggle: () => void;
  onDownload: (versionId: string) => void;
  /** The version whose presigned link is being fetched right now. */
  downloadingVersionId?: string | null;
  downloadError?: string | null;
  /** Where this version has been sent. Supplied by the page so this stays a view. */
  renderUsage: (versionId: string) => React.ReactNode;
}

/**
 * One CV group and, when opened, every file ever stored under it.
 *
 * Version history is a CV idea and only a CV idea: cover letters have one row
 * per application and no history at all, so nothing in here is meant to be
 * reused for them.
 */
export function CVGroup({
  cv,
  expanded,
  onToggle,
  onDownload,
  downloadingVersionId,
  downloadError,
  renderUsage,
}: CVGroupProps) {
  const history = versionHistory(cv);
  const count = versionCount(cv);
  const panelId = `cv-versions-${cv.id}`;

  return (
    <Panel>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            "flex w-full items-center gap-3 rounded-card px-4 py-3 text-left hover:bg-highlight",
            expanded && "border-b border-rule",
          )}
        >
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-ink-faint transition-transform",
              expanded && "rotate-90",
            )}
            aria-hidden
          />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{cv.name}</span>
            <span className="eyebrow tabular">
              last upload {formatDate(lastUploadedAt(cv))}
            </span>
          </span>

          {cv.tag ? (
            <span className="rounded-full border border-rule px-2 py-0.5 font-mono text-[0.6875rem] text-ink-muted">
              {cv.tag}
            </span>
          ) : null}

          <VersionBadge count={count} />
        </button>
      </h3>

      {expanded ? (
        <ul id={panelId} className="divide-y divide-rule">
          {history.length === 0 ? (
            <li className="px-4 py-4 text-sm text-ink-faint">
              No files are stored under this CV.
            </li>
          ) : (
            history.map(({ version, number }) => {
              const downloading = downloadingVersionId === version.id;
              return (
                <li key={version.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <div className="flex min-w-0 items-baseline gap-2.5">
                      <span className="rounded-[0.2rem] bg-paper px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-muted">
                        v{number}
                      </span>
                      <span className="truncate font-mono text-[0.8125rem]">
                        {version.original_filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="eyebrow tabular whitespace-nowrap">
                        {formatDate(version.uploaded_at)}
                      </span>
                      <span className="eyebrow tabular whitespace-nowrap">
                        {formatBytes(version.file_size_bytes)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(version.id)}
                        disabled={downloading}
                      >
                        <Download aria-hidden />
                        {downloading ? "Preparing…" : "Download"}
                      </Button>
                    </div>
                  </div>

                  <p
                    className="mt-1.5 font-mono text-[0.6875rem] text-ink-faint"
                    title={version.sha256_hash}
                  >
                    sha256 {shortHash(version.sha256_hash)}
                  </p>

                  <div className="mt-2.5">{renderUsage(version.id)}</div>
                </li>
              );
            })
          )}

          {downloadError ? (
            <li className="px-4 py-3 text-sm text-rose-700" role="alert">
              {downloadError}
            </li>
          ) : null}
        </ul>
      ) : null}
    </Panel>
  );
}

/**
 * The multiple-versions cue. A single-version CV is the ordinary case and stays
 * quiet; anything above one is the thing worth noticing, so it gets ink.
 */
function VersionBadge({ count }: { count: number }) {
  const many = count > 1;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] tabular",
        many
          ? "border-rule-strong bg-paper text-ink"
          : "border-transparent bg-transparent text-ink-faint",
      )}
    >
      {count === 1 ? "1 version" : `${count} versions`}
    </span>
  );
}
