import type { CV, CVVersion } from "@/lib/api/types";

/**
 * Version numbering, kept pure so it can be tested without rendering anything.
 *
 * The backend has no version number — a cv_version row knows its hash, size and
 * upload time, nothing else. The "v3" the user sees is this file's invention,
 * derived by ordering a group's versions oldest first. Numbering from the oldest
 * end is the point: v1 stays v1 forever, so a number written down today still
 * means the same file next month.
 */

export interface NumberedVersion {
  version: CVVersion;
  /** 1-based, counted from the oldest upload. */
  number: number;
  /** "Backend CV — v3". Same shape the applications table uses. */
  label: string;
}

/**
 * Oldest first. Equal timestamps fall back to the id so two files uploaded in
 * the same second do not swap numbers between renders.
 */
export function orderVersions(versions: readonly CVVersion[]): CVVersion[] {
  return [...versions].sort((a, b) => {
    const delta = time(a.uploaded_at) - time(b.uploaded_at);
    if (delta !== 0 && !Number.isNaN(delta)) return delta;
    return a.id.localeCompare(b.id);
  });
}

/** Every version of a group, numbered, oldest first. */
export function numberVersions(cv: CV): NumberedVersion[] {
  return orderVersions(cv.versions ?? []).map((version, index) => ({
    version,
    number: index + 1,
    label: `${cv.name} — v${index + 1}`,
  }));
}

/** The same list in reading order: newest at the top, numbers unchanged. */
export function versionHistory(cv: CV): NumberedVersion[] {
  return numberVersions(cv).reverse();
}

export function versionCount(cv: CV): number {
  return cv.versions?.length ?? 0;
}

export function hasMultipleVersions(cv: CV): boolean {
  return versionCount(cv) > 1;
}

/**
 * When this CV was last touched. The newest upload, falling back to the group's
 * own updated_at for a group whose versions were not loaded.
 */
export function lastUploadedAt(cv: CV): string {
  const ordered = orderVersions(cv.versions ?? []);
  return ordered.length > 0 ? ordered[ordered.length - 1].uploaded_at : cv.updated_at;
}

/** Most recently touched group first, then alphabetically. */
export function sortCVs(cvs: readonly CV[]): CV[] {
  const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  return [...cvs].sort((a, b) => {
    const delta = time(lastUploadedAt(b)) - time(lastUploadedAt(a));
    if (delta !== 0 && !Number.isNaN(delta)) return delta;
    return collator.compare(a.name, b.name);
  });
}

/** Hashes are 64 hex characters; the first dozen is plenty to eyeball a match. */
export function shortHash(hash: string, length = 12): string {
  if (!hash) return "—";
  return hash.length <= length ? hash : `${hash.slice(0, length)}…`;
}

function time(value: string): number {
  return new Date(value).getTime();
}
