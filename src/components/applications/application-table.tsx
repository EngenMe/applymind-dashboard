"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import type { Application } from "@/lib/api/types";
import {
  effectiveDate,
  nextSort,
  type SortKey,
  type SortState,
} from "@/lib/applications/filters";
import { formatDate, formatRelativeDays, hostOf } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Column {
  key: SortKey;
  label: string;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "date", label: "Date", className: "w-[9.5rem]" },
  { key: "status", label: "Status", className: "w-[11rem]" },
  { key: "site", label: "Site", className: "w-[8rem]" },
  { key: "cv", label: "CV version", className: "w-[13rem]" },
];

interface ApplicationTableProps {
  applications: Application[];
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  siteName: (siteId: string) => string;
  cvLabel: (cvVersionId: string | null) => string;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

/**
 * Two presentations of the same rows.
 *
 * Six columns is right on a laptop and unreadable on a phone — a table that
 * narrow means scrolling sideways to read every single row, which is worse than
 * no table. Below `md` the same records become stacked cards: company and role
 * lead, because that is what identifies an application, and the rest follows as
 * a labelled block.
 *
 * Sorting survives the switch rather than being dropped, since "newest first"
 * and "by status" are the two questions this list exists to answer.
 */
export function ApplicationTable({
                                   applications,
                                   sort,
                                   onSortChange,
                                   siteName,
                                   cvLabel,
                                   isLoading = false,
                                   emptyState,
                                 }: ApplicationTableProps) {
  const router = useRouter();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (applications.length === 0) {
    return <div className="px-4 py-16">{emptyState}</div>;
  }

  return (
      <>
        {/* ---------------------------------------------------------------- */}
        {/* Phone and small tablet                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="md:hidden">
          <SortBar sort={sort} onSortChange={onSortChange} />

          <ul className="divide-y divide-rule">
            {applications.map((application) => {
              const href = `/applications/${application.id}`;
              const date = effectiveDate(application);
              const cv = cvLabel(application.cv_version_id);

              return (
                  <li key={application.id}>
                    <Link
                        href={href}
                        className="block bg-surface px-4 py-3.5 transition-colors hover:bg-highlight"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{application.company_name}</p>
                          <p className="mt-0.5 truncate text-sm text-ink-muted">
                            {application.job_title}
                          </p>
                        </div>
                        <StatusBadge status={application.status} />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                        <span className="tabular font-mono">{formatDate(date)}</span>
                        <span>{application.applied_at ? formatRelativeDays(date) : "saved"}</span>
                        <span aria-hidden>·</span>
                        <span>{siteName(application.site_id) || hostOf(application.job_url)}</span>
                      </div>

                      <p className="mt-1 truncate font-mono text-xs text-ink-muted">
                        {cv || <span className="text-ink-faint">no CV recorded</span>}
                      </p>
                    </Link>
                  </li>
              );
            })}
          </ul>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Laptop and up                                                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((column) => {
                  const active = sort.key === column.key;
                  const ariaSort = active
                      ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                      : "none";
                  const Icon = !active
                      ? ChevronsUpDown
                      : sort.direction === "asc"
                          ? ArrowUp
                          : ArrowDown;

                  return (
                      <TableHead key={column.key} aria-sort={ariaSort} className={column.className}>
                        <button
                            type="button"
                            onClick={() => onSortChange(nextSort(sort, column.key))}
                            className={cn(
                                "eyebrow inline-flex items-center gap-1 rounded-sm hover:text-ink",
                                active && "text-ink",
                            )}
                        >
                          {column.label}
                          <Icon className="size-3" aria-hidden />
                        </button>
                      </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {applications.map((application) => {
                const href = `/applications/${application.id}`;
                const date = effectiveDate(application);
                const cv = cvLabel(application.cv_version_id);

                return (
                    <TableRow
                        key={application.id}
                        onClick={() => router.push(href)}
                        className="cursor-pointer bg-surface hover:bg-highlight"
                    >
                      <TableCell className="font-medium">
                        <Link
                            href={href}
                            onClick={(event) => event.stopPropagation()}
                            className="hover:underline"
                        >
                          {application.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-ink-muted">{application.job_title}</TableCell>
                      <TableCell className="tabular whitespace-nowrap">
                        <span className="font-mono text-[0.8125rem]">{formatDate(date)}</span>
                        <span className="ml-1.5 text-xs text-ink-faint">
                      {application.applied_at ? formatRelativeDays(date) : "saved"}
                    </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={application.status} />
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {siteName(application.site_id) || hostOf(application.job_url)}
                      </TableCell>
                      <TableCell className="font-mono text-[0.8125rem] text-ink-muted">
                        {cv || <span className="text-ink-faint">none recorded</span>}
                      </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </>
  );
}

/**
 * The card layout's stand-in for clickable column headers. Scrolls sideways
 * rather than wrapping, same as the main nav — six sort keys will not fit on a
 * phone and never will.
 */
function SortBar({
                   sort,
                   onSortChange,
                 }: {
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}) {
  return (
      <div
          role="group"
          aria-label="Sort applications"
          className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-rule bg-surface px-3 py-2"
      >
        <span className="eyebrow shrink-0 pr-1">Sort</span>
        {COLUMNS.map((column) => {
          const active = sort.key === column.key;
          const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;

          return (
              <button
                  key={column.key}
                  type="button"
                  onClick={() => onSortChange(nextSort(sort, column.key))}
                  aria-pressed={active}
                  className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
                      active
                          ? "border-rule-strong text-ink"
                          : "border-transparent text-ink-muted hover:text-ink",
                  )}
              >
                {column.label}
                <Icon className="size-3" aria-hidden />
              </button>
          );
        })}
      </div>
  );
}

function TableSkeleton() {
  return (
      <div className="divide-y border-t border-rule">
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-surface px-4 py-3.5">
              {/* Phones get the card shape back, laptops the row — the skeleton
              only helps if it stands in for what actually arrives. */}
              <div className="flex flex-col gap-2 md:hidden">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="hidden items-center gap-4 md:flex">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
        ))}
      </div>
  );
}