import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/card";
import type { StatusHistoryEntry } from "@/lib/api/types";
import { statusDotClasses } from "@/lib/applications/status";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The append-only trail from application_status_history, newest first. Read-only
 * by design: it is an audit record, and the only way to add to it is to actually
 * move the status.
 */
export function StatusHistoryTimeline({ history }: { history: StatusHistoryEntry[] }) {
  const entries = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>History</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-faint">No status changes recorded.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-rule pl-4">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.3125rem] top-1.5 size-2 rounded-full ring-2 ring-surface",
                    statusDotClasses(entry.to_status),
                  )}
                  aria-hidden
                />
                <p className="text-sm">
                  {entry.from_status ? (
                    <>
                      <span className="text-ink-muted">{entry.from_status}</span>
                      <span className="mx-1.5 text-ink-faint">→</span>
                    </>
                  ) : null}
                  <span className="font-medium">{entry.to_status}</span>
                  {entry.changed_by === "system" ? (
                    <span className="eyebrow ml-2">automatic</span>
                  ) : null}
                </p>
                <p className="tabular mt-0.5 font-mono text-xs text-ink-faint">
                  {formatDateTime(entry.changed_at)}
                </p>
                {entry.note ? (
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{entry.note}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </PanelBody>
    </Panel>
  );
}
