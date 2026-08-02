import type {
  Application,
  ApplicationStatus,
  ListApplicationsParams,
} from "@/lib/api/types";
import { statusRank } from "./status";

/**
 * Filter and sort logic for the list page, kept pure so it can be tested
 * without rendering anything.
 *
 * Division of labour: the backend does the filtering (GET /applications takes
 * status, site_id, cv_version_id, q and a date range), the browser does the
 * sorting. GET /applications has no sort parameter and returns no total count,
 * so sorting server-side is not on the table — the sort applies to the rows
 * currently loaded, which is why the page loads in chunks rather than pretending
 * to paginate.
 */

export const ALL = "all" as const;
export type AllOr<T extends string> = T | typeof ALL;

export interface ApplicationFilters {
  /** Company name or job title. Sent to the backend as `q`. */
  search: string;
  status: AllOr<ApplicationStatus>;
  siteId: AllOr<string>;
  cvVersionId: AllOr<string>;
  /** YYYY-MM-DD, inclusive bounds on the effective date. */
  from: string;
  to: string;
}

export const EMPTY_FILTERS: ApplicationFilters = {
  search: "",
  status: ALL,
  siteId: ALL,
  cvVersionId: ALL,
  from: "",
  to: "",
};

export function hasActiveFilters(filters: ApplicationFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== ALL ||
    filters.siteId !== ALL ||
    filters.cvVersionId !== ALL ||
    filters.from !== "" ||
    filters.to !== ""
  );
}

export const PAGE_SIZE = 50;

/** Maps UI filter state onto the query string GET /applications understands. */
export function toListParams(
  filters: ApplicationFilters,
  page = 0,
  pageSize = PAGE_SIZE,
): ListApplicationsParams {
  const params: ListApplicationsParams = {
    limit: pageSize,
    offset: page * pageSize,
  };

  const search = filters.search.trim();
  if (search) params.q = search;
  if (filters.status !== ALL) params.status = filters.status;
  if (filters.siteId !== ALL) params.site_id = filters.siteId;
  if (filters.cvVersionId !== ALL) params.cv_version_id = filters.cvVersionId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  return params;
}

/**
 * The date the row is "about": when it was applied, falling back to when it was
 * saved. Same rule the backend's From/To filter uses, so the column and the date
 * filter agree.
 */
export function effectiveDate(application: Application): string {
  return application.applied_at ?? application.created_at;
}

export type SortKey = "date" | "company" | "role" | "status" | "site" | "cv";
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export const DEFAULT_SORT: SortState = { key: "date", direction: "desc" };

/** Clicking the active column flips it; clicking another starts it descending. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, direction: "desc" };
  return { key, direction: current.direction === "desc" ? "asc" : "desc" };
}

/**
 * Labels for the two columns that arrive as bare ids. Supplied by the page from
 * the sites and cvs queries so sorting matches what is on screen.
 */
export interface SortLabels {
  siteName: (siteId: string) => string;
  cvLabel: (cvVersionId: string | null) => string;
}

const DEFAULT_LABELS: SortLabels = {
  siteName: (siteId) => siteId,
  cvLabel: (cvVersionId) => cvVersionId ?? "",
};

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function compare(
  a: Application,
  b: Application,
  key: SortKey,
  labels: SortLabels,
): number {
  switch (key) {
    case "company":
      return collator.compare(a.company_name, b.company_name);
    case "role":
      return collator.compare(a.job_title, b.job_title);
    case "status":
      return statusRank(a.status) - statusRank(b.status);
    case "site":
      return collator.compare(labels.siteName(a.site_id), labels.siteName(b.site_id));
    case "cv":
      return collator.compare(labels.cvLabel(a.cv_version_id), labels.cvLabel(b.cv_version_id));
    case "date":
    default:
      return new Date(effectiveDate(a)).getTime() - new Date(effectiveDate(b)).getTime();
  }
}

/**
 * Rows with no CV attached sink to the bottom in both directions. This is
 * deliberately applied before the direction factor: an empty cell is never the
 * interesting end of the list, so flipping the sort should not drag a pile of
 * blanks to the top.
 */
function pinEmptyLast(
  a: Application,
  b: Application,
  key: SortKey,
  labels: SortLabels,
): number {
  if (key !== "cv") return 0;
  const left = labels.cvLabel(a.cv_version_id);
  const right = labels.cvLabel(b.cv_version_id);
  if (Boolean(left) === Boolean(right)) return 0;
  return left ? -1 : 1;
}

export function sortApplications(
  applications: Application[],
  sort: SortState = DEFAULT_SORT,
  labels: SortLabels = DEFAULT_LABELS,
): Application[] {
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...applications].sort((a, b) => {
    const pinned = pinEmptyLast(a, b, sort.key, labels);
    if (pinned !== 0) return pinned;

    const result = compare(a, b, sort.key, labels);
    if (result !== 0) return result * factor;
    // Stable tie-break so the order never jitters between renders.
    return collator.compare(a.id, b.id);
  });
}

/**
 * Local narrowing over already-loaded rows. The backend's `q` is the real
 * search; this keeps the table honest while a debounced request is in flight,
 * so typing never shows rows that no longer match.
 */
export function matchesSearch(application: Application, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    application.company_name.toLowerCase().includes(needle) ||
    application.job_title.toLowerCase().includes(needle)
  );
}

export function applyLocalSearch(
  applications: Application[],
  search: string,
): Application[] {
  return applications.filter((application) => matchesSearch(application, search));
}
