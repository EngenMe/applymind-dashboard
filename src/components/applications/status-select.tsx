"use client";

import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/api/types";
import { ALL } from "@/lib/applications/filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusSelectProps {
  value: ApplicationStatus | typeof ALL;
  onValueChange: (value: string) => void;
  /** Adds the "Any status" option — the list filter wants it, the detail page does not. */
  includeAll?: boolean;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * The full workflow in enum order, Saved through Ghost. Order matters: it is the
 * order the backend declares in statusOrder, so the dropdown reads like the
 * pipeline rather than like an alphabetised list.
 */
export function StatusSelect({
  value,
  onValueChange,
  includeAll = false,
  disabled,
  id,
  className,
  ...rest
}: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className} aria-label={rest["aria-label"]}>
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        {includeAll ? <SelectItem value={ALL}>Any status</SelectItem> : null}
        {APPLICATION_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
