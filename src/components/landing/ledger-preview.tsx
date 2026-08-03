import { StatusBadge } from "@/components/applications/status-badge";
import type { ApplicationStatus } from "@/lib/api/types";

/**
 * A still of the real thing, built from the real components — StatusBadge here
 * is the same one the live table renders, so this cannot drift into showing a
 * design that no longer exists.
 *
 * Static and decorative: it is a picture of the product, not the product.
 */
const SAMPLE: Array<{
  company: string;
  role: string;
  status: ApplicationStatus;
  cv: string;
  date: string;
}> = [
  {
    company: "Stripe",
    role: "Backend Engineer",
    status: "Interview Scheduled",
    cv: "Backend CV — v3",
    date: "12 Jul 2026",
  },
  {
    company: "Datadog",
    role: "Platform Engineer",
    status: "In Review",
    cv: "Backend CV — v3",
    date: "09 Jul 2026",
  },
  {
    company: "Monzo",
    role: "Go Engineer",
    status: "Applied",
    cv: "Backend CV — v2",
    date: "04 Jul 2026",
  },
  {
    company: "Cloudflare",
    role: "Systems Engineer",
    status: "Rejected",
    cv: "Backend CV — v2",
    date: "28 Jun 2026",
  },
  {
    company: "Vercel",
    role: "Full Stack Engineer",
    status: "Ghost",
    cv: "Full Stack CV — v1",
    date: "19 Jun 2026",
  },
];

export function LedgerPreview() {
  return (
    <div
      className="overflow-hidden rounded-card border border-rule bg-surface"
      role="img"
      aria-label="Preview of the application list, showing five applications with their status, CV version and date"
    >
      <div className="flex items-center gap-2 border-b border-rule px-4 py-2.5" aria-hidden>
        <span className="size-2 rounded-full bg-rule-strong" />
        <span className="size-2 rounded-full bg-rule-strong" />
        <span className="size-2 rounded-full bg-rule-strong" />
        <span className="eyebrow ml-2">applymind — applications</span>
      </div>

      <div aria-hidden>
        {SAMPLE.map((row) => (
          <div
            key={row.company}
            className="flex items-center gap-4 border-b border-rule px-4 py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{row.company}</p>
              <p className="truncate text-sm text-ink-muted">{row.role}</p>
            </div>
            <span className="hidden font-mono text-[0.75rem] text-ink-faint md:block">
              {row.cv}
            </span>
            <span className="tabular hidden font-mono text-[0.75rem] text-ink-faint sm:block">
              {row.date}
            </span>
            <StatusBadge status={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
