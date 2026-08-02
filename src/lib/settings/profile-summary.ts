/**
 * Editor state for the profile summary, kept out of the component so the rules
 * are testable without rendering anything.
 *
 * The draft is null until something is typed, which is what lets the textarea
 * follow the server value on load without a syncing effect.
 */

/** What the textarea shows: the draft once there is one, otherwise the saved value. */
export function currentValue(draft: string | null, saved: string | null | undefined): string {
  return draft ?? saved ?? "";
}

/** Whitespace-only edits do not count as changes. */
export function isDirty(draft: string | null, saved: string | null | undefined): boolean {
  if (draft === null) return false;
  return draft.trim() !== (saved ?? "").trim();
}

/**
 * The backend answers 400 profile_summary_required for an empty body, so an
 * empty summary is never savable — there is no way to clear one, only replace
 * it. Better to disable the button than to send a request that cannot succeed.
 */
export function canSave(draft: string | null, saved: string | null | undefined): boolean {
  return isDirty(draft, saved) && currentValue(draft, saved).trim().length > 0;
}

export function characterCount(draft: string | null, saved: string | null | undefined): number {
  return currentValue(draft, saved).length;
}

/**
 * The row's updated_at is seeded by the migration, so it is set even when no
 * summary has ever been written. Only treat it as a save time when there is a
 * summary to have saved.
 */
export function savedAtLabel(
  summary: string | null | undefined,
  updatedAt: string | null | undefined,
): string {
  if (!summary || !updatedAt) return "";
  const at = new Date(updatedAt);
  if (Number.isNaN(at.getTime())) return "";
  return at.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
