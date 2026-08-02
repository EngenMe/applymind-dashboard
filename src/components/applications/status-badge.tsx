import type { ApplicationStatus } from "@/lib/api/types";
import { statusClasses, statusDotClasses } from "@/lib/applications/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap",
        statusClasses(status),
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", statusDotClasses(status))} aria-hidden />
      {status}
    </span>
  );
}
