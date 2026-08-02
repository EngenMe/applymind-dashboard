import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/api/types";

export { APPLICATION_STATUSES };

/**
 * How far through the pipeline a status sits, 0–1. Drives the progress rail on
 * the detail page. Terminal statuses are full — they are done, whatever the
 * outcome was.
 */
const PIPELINE: ApplicationStatus[] = [
  "Saved",
  "Applied",
  "Acknowledged",
  "In Review",
  "Interview Scheduled",
  "Interviewing",
  "Offer Received",
  "Accepted",
];

export const TERMINAL_STATUSES: ApplicationStatus[] = [
  "Accepted",
  "Rejected",
  "Withdrawn",
  "Ghost",
];

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function pipelineProgress(status: ApplicationStatus): number {
  const index = PIPELINE.indexOf(status);
  if (index >= 0) return (index + 1) / PIPELINE.length;
  return 1;
}

type Tone = "neutral" | "live" | "warm" | "good" | "bad" | "cold";

const TONE: Record<ApplicationStatus, Tone> = {
  Saved: "neutral",
  Applied: "live",
  Acknowledged: "live",
  "In Review": "live",
  "Interview Scheduled": "warm",
  Interviewing: "warm",
  "Offer Received": "good",
  Accepted: "good",
  Rejected: "bad",
  Withdrawn: "cold",
  Ghost: "cold",
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-stone-300 bg-stone-100 text-stone-700",
  live: "border-sky-300 bg-sky-50 text-sky-800",
  warm: "border-amber-300 bg-amber-50 text-amber-900",
  good: "border-emerald-300 bg-emerald-50 text-emerald-800",
  bad: "border-rose-300 bg-rose-50 text-rose-800",
  cold: "border-stone-300 bg-transparent text-stone-500",
};

const DOT_CLASS: Record<Tone, string> = {
  neutral: "bg-stone-400",
  live: "bg-sky-500",
  warm: "bg-amber-500",
  good: "bg-emerald-500",
  bad: "bg-rose-500",
  cold: "bg-stone-300",
};

export function statusClasses(status: ApplicationStatus): string {
  return TONE_CLASS[TONE[status]] ?? TONE_CLASS.neutral;
}

export function statusDotClasses(status: ApplicationStatus): string {
  return DOT_CLASS[TONE[status]] ?? DOT_CLASS.neutral;
}

/** Sort weight for the status column: pipeline order, exactly as the enum reads. */
export function statusRank(status: ApplicationStatus): number {
  const index = APPLICATION_STATUSES.indexOf(status);
  return index === -1 ? APPLICATION_STATUSES.length : index;
}
