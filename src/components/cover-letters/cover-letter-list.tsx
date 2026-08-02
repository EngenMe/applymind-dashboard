"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { preview, type CoverLetterEntry } from "@/lib/cover-letters/history";
import { cn } from "@/lib/utils";

interface CoverLetterListProps {
  entries: CoverLetterEntry[];
  /** Application id of the open letter, or null. One at a time: these are long. */
  openId: string | null;
  onToggle: (applicationId: string) => void;
  onDownload: (applicationId: string) => void;
  downloadingId?: string | null;
  downloadError?: string | null;
}

/**
 * Every letter that has gone out, filed under the application it went with.
 *
 * Read-only on purpose. A cover letter belongs to one application — the table
 * has unique(application_id), no history, nothing shared — so there is no
 * version history here and nothing to reuse. Editing a text letter lives on the
 * application it belongs to.
 */
export function CoverLetterList({
  entries,
  openId,
  onToggle,
  onDownload,
  downloadingId,
  downloadError,
}: CoverLetterListProps) {
  return (
    <ul className="divide-y divide-rule">
      {entries.map((entry) => {
        const { application, coverLetter } = entry;
        const open = openId === application.id;
        const panelId = `cover-letter-${application.id}`;

        return (
          <li key={application.id} className="bg-surface">
            <h3>
              <button
                type="button"
                onClick={() => onToggle(application.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-highlight"
              >
                <ChevronRight
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-ink-faint transition-transform",
                    open && "rotate-90",
                  )}
                  aria-hidden
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{application.company_name}</span>
                    <span className="text-sm text-ink-muted">{application.job_title}</span>
                    <span className="eyebrow tabular">{formatDate(entry.sentAt)}</span>
                  </span>
                  {!open ? (
                    <span className="mt-1 block truncate text-sm text-ink-faint">
                      {preview(coverLetter)}
                    </span>
                  ) : null}
                </span>

                <KindTag kind={coverLetter.kind} />
              </button>
            </h3>

            {open ? (
              <div id={panelId} className="border-t border-rule px-4 py-3.5">
                {coverLetter.kind === "file" ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-sm text-ink-muted">
                      {coverLetter.original_filename}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(application.id)}
                      disabled={downloadingId === application.id}
                    >
                      <Download aria-hidden />
                      {downloadingId === application.id ? "Preparing…" : "Download"}
                    </Button>
                  </div>
                ) : (
                  <p className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {coverLetter.body_text?.trim() ? coverLetter.body_text : "This letter is empty."}
                  </p>
                )}

                {downloadError && downloadingId === null ? (
                  <p className="mt-2 text-sm text-rose-700" role="alert">
                    {downloadError}
                  </p>
                ) : null}

                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-rule pt-3">
                  <p className="text-xs text-ink-faint">
                    Sent with this application only. Edit it on the application.
                  </p>
                  <Link
                    href={`/applications/${application.id}`}
                    className="inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    Open application
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function KindTag({ kind }: { kind: "text" | "file" }) {
  return (
    <span className="shrink-0 rounded-full border border-rule px-2 py-0.5 font-mono text-[0.6875rem] text-ink-muted">
      {kind}
    </span>
  );
}
