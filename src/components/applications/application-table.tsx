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
    return <div className="py-16">{emptyState}</div>;
  }

  return (
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
            const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;

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
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-rule border-t border-rule">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 bg-surface px-3 py-3.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
