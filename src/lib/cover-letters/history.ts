import type { Application, CoverLetter } from "@/lib/api/types";
import { effectiveDate } from "@/lib/applications/filters";

/**
 * Assembling the cover letter history, kept pure so it can be tested without a
 * query client.
 *
 * There is no "list every cover letter" endpoint — the coverletters module is
 * addressed entirely through /applications/{id}/coverletter, because a letter
 * belongs to exactly one application and never travels. So the history is built
 * by walking a batch of applications and asking each one for its letter; the
 * ones that answer 404 (most of them, early on) simply drop out. That is why the
 * page loads in batches rather than claiming to show everything at once.
 */

export interface CoverLetterEntry {
  application: Application;
  coverLetter: CoverLetter;
  /** When the letter went out: the application's date, which is what it is filed under. */
  sentAt: string;
}

/** The shape this module needs from a React Query result. */
export interface LetterLookup {
  data?: CoverLetter | null;
  isPending: boolean;
  isError: boolean;
}

/**
 * Pairs each application with its letter, newest first. `lookups` is positional:
 * lookups[i] is the answer for applications[i].
 */
export function collectEntries(
  applications: readonly Application[],
  lookups: readonly LetterLookup[],
): CoverLetterEntry[] {
  const entries: CoverLetterEntry[] = [];

  applications.forEach((application, index) => {
    const coverLetter = lookups[index]?.data;
    if (!coverLetter) return;
    entries.push({ application, coverLetter, sentAt: effectiveDate(application) });
  });

  return entries.sort((a, b) => {
    const delta = new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    if (delta !== 0 && !Number.isNaN(delta)) return delta;
    return a.application.id.localeCompare(b.application.id);
  });
}

export interface HistoryProgress {
  /** Applications still being checked. */
  pending: number;
  /** Applications whose letter could not be read at all. */
  failed: number;
  /** True while the first pass is running and there is nothing to show yet. */
  isInitial: boolean;
}

export function summarise(
  lookups: readonly LetterLookup[],
  found: number,
): HistoryProgress {
  const pending = lookups.filter((lookup) => lookup.isPending).length;
  const failed = lookups.filter((lookup) => lookup.isError).length;
  return { pending, failed, isInitial: found === 0 && pending > 0 };
}

/**
 * The one-line summary shown before a letter is opened. A file letter has no
 * body to preview, so it shows what was actually attached.
 */
export function preview(coverLetter: CoverLetter, maxLength = 180): string {
  if (coverLetter.kind === "file") {
    return coverLetter.original_filename ?? "Attached document";
  }
  const text = (coverLetter.body_text ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "Empty letter";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}…`;
}
