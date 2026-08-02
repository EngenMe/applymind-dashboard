"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { ApplicationFiltersBar } from "@/components/applications/application-filters";
import { ApplicationTable } from "@/components/applications/application-table";
import { Button } from "@/components/ui/button";
import { useApplicationList } from "@/lib/hooks/use-applications";
import { useCVIndex } from "@/lib/hooks/use-cvs";
import { useSiteIndex } from "@/lib/hooks/use-sites";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  applyLocalSearch,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  hasActiveFilters,
  PAGE_SIZE,
  sortApplications,
  toListParams,
  type ApplicationFilters,
  type SortState,
} from "@/lib/applications/filters";

export function ApplicationsView() {
  const [filters, setFilters] = useState<ApplicationFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [pages, setPages] = useState(1);

  // The typed value drives the input and the local narrowing; the debounced one
  // drives the request, so the table never flickers a stale row set mid-word.
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const params = useMemo(
    () => toListParams({ ...filters, search: debouncedSearch }, 0, PAGE_SIZE * pages),
    [filters, debouncedSearch, pages],
  );

  const { data, isPending, isFetching, isError, error, refetch } = useApplicationList(params);
  const cvs = useCVIndex();
  const sites = useSiteIndex();

  const rows = useMemo(() => {
    const fetched = data?.applications ?? [];
    const narrowed = applyLocalSearch(fetched, filters.search);
    return sortApplications(narrowed, sort, {
      siteName: (siteId) => sites.name(siteId),
      cvLabel: (cvVersionId) => cvs.label(cvVersionId),
    });
  }, [data, filters.search, sort, sites, cvs]);

  const changeFilters = (next: ApplicationFilters) => {
    setFilters(next);
    setPages(1);
  };

  const fetchedCount = data?.applications.length ?? 0;
  const hasMore = fetchedCount >= PAGE_SIZE * pages;
  const filtered = hasActiveFilters(filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Everything captured so far, newest first.
          </p>
        </div>
        <p className="eyebrow tabular">
          {rows.length} shown
          {isFetching && !isPending ? " · refreshing" : ""}
        </p>
      </div>

      <ApplicationFiltersBar
        filters={filters}
        onChange={changeFilters}
        siteOptions={sites.options}
        cvOptions={cvs.options}
      />

      {isError ? (
        <ErrorState message={error instanceof Error ? error.message : "Unknown error"} onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-card border border-rule bg-surface">
          <ApplicationTable
            applications={rows}
            sort={sort}
            onSortChange={setSort}
            siteName={(siteId) => sites.name(siteId)}
            cvLabel={(cvVersionId) => cvs.label(cvVersionId)}
            isLoading={isPending}
            emptyState={<EmptyState filtered={filtered} onClear={() => changeFilters(EMPTY_FILTERS)} />}
          />
        </div>
      )}

      {hasMore && !isError ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPages((current) => current + 1)}
            disabled={isFetching}
          >
            {isFetching ? "Loading…" : `Load ${PAGE_SIZE} more`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  if (filtered) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <Inbox className="mx-auto size-5 text-ink-faint" aria-hidden />
        <p className="mt-3 text-sm font-medium">No applications match these filters.</p>
        <p className="mt-1 text-sm text-ink-muted">Widen the date range or clear the filters.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <Inbox className="mx-auto size-5 text-ink-faint" aria-hidden />
      <p className="mt-3 text-sm font-medium">Nothing tracked yet.</p>
      <p className="mt-1 text-sm text-ink-muted">
        Apply to a job with the extension active and it will show up here.
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-rose-200 bg-rose-50/60 px-4 py-6 text-center">
      <AlertTriangle className="mx-auto size-5 text-rose-600" aria-hidden />
      <p className="mt-3 text-sm font-medium text-rose-900">The applications did not load.</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
