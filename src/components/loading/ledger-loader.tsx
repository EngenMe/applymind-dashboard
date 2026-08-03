import { cn } from "@/lib/utils";

/**
 * The loading state for a whole page.
 *
 * Deliberately not a spinner. A spinner says "something is happening
 * somewhere"; a skeleton that traces the layout it is standing in for says
 * "your table is arriving, and here is where it will be" — the wait reads as
 * shorter even when it is not, and the eye is already in the right place when
 * the real content lands.
 *
 * Every animation here sits under the prefers-reduced-motion rule in
 * globals.css, so it stops for anyone who has asked for that.
 */
export function LedgerLoader({
  rows = 6,
  label = "Loading",
  withFilters = false,
}: {
  rows?: number;
  /** Announced to screen readers, which get no benefit from the skeleton. */
  label?: string;
  /** Adds a filter-bar-shaped block above the rows, for the list pages. */
  withFilters?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex w-full flex-col gap-4"
    >
      <span className="sr-only">{label}</span>

      <div className="progress-rail" aria-hidden />

      {withFilters ? (
        <div className="flex flex-wrap items-end gap-3 border-b border-rule pb-4" aria-hidden>
          <SkeletonBlock className="h-9 w-full max-w-xs" />
          <SkeletonBlock className="h-9 w-40" />
          <SkeletonBlock className="h-9 w-36" />
          <SkeletonBlock className="h-9 w-44" />
        </div>
      ) : null}

      <div className="flex flex-col" aria-hidden>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-rule py-3.5 last:border-b-0"
            /* Each row starts its sweep slightly later than the one above, so
               the skeleton reads top-to-bottom the way the real list does. */
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <SkeletonBlock className="h-4 flex-1" style={{ animationDelay: `${index * 90}ms` }} />
            <SkeletonBlock className="hidden h-4 w-40 sm:block" />
            <SkeletonBlock className="hidden h-4 w-24 md:block" />
            <SkeletonBlock className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A single shimmering bar. The animation itself lives in globals.css. */
export function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={cn("shimmer rounded-[0.2rem]", className)} style={style} />;
}

/**
 * The detail-page shape: a header block, then two stacked panels. Same idea as
 * above, different silhouette.
 */
export function DetailLoader({ label = "Loading application" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex w-full flex-col gap-6">
      <span className="sr-only">{label}</span>

      <div className="progress-rail" aria-hidden />

      <div className="flex flex-col gap-2" aria-hidden>
        <SkeletonBlock className="h-6 w-64" />
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-3 w-80" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]" aria-hidden>
        <div className="flex flex-col gap-4">
          <PanelSkeleton lines={5} />
          <PanelSkeleton lines={8} />
        </div>
        <div className="flex flex-col gap-4">
          <PanelSkeleton lines={3} />
          <PanelSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton({ lines }: { lines: number }) {
  return (
    <div className="rounded-card border border-rule bg-surface">
      <div className="border-b border-rule px-4 py-3">
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-4">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="h-3.5"
            style={{
              // Ragged right edge, like real text — a stack of identical bars
              // reads as a placeholder, this reads as content.
              width: `${100 - ((index * 17) % 45)}%`,
              animationDelay: `${index * 70}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
