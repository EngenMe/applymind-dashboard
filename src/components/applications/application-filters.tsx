"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusSelect } from "./status-select";
import {
  ALL,
  EMPTY_FILTERS,
  hasActiveFilters,
  type ApplicationFilters,
} from "@/lib/applications/filters";
import type { ApplicationStatus } from "@/lib/api/types";

interface Option {
  id: string;
  label: string;
}

interface ApplicationFiltersBarProps {
  filters: ApplicationFilters;
  onChange: (filters: ApplicationFilters) => void;
  siteOptions: Option[];
  cvOptions: Option[];
}

export function ApplicationFiltersBar({
  filters,
  onChange,
  siteOptions,
  cvOptions,
}: ApplicationFiltersBarProps) {
  const set = <K extends keyof ApplicationFilters>(key: K, value: ApplicationFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-4 lg:flex-row lg:items-end">
      <div className="lg:max-w-xs lg:flex-1">
        <Label htmlFor="application-search">Search</Label>
        <div className="relative mt-1.5">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Input
            id="application-search"
            value={filters.search}
            onChange={(event) => set("search", event.target.value)}
            placeholder="Company or job title"
            className="pl-8"
            type="search"
          />
        </div>
      </div>

      <div className="w-full lg:w-48">
        <Label htmlFor="application-status-filter">Status</Label>
        <div className="mt-1.5">
          <StatusSelect
            id="application-status-filter"
            aria-label="Filter by status"
            includeAll
            value={filters.status}
            onValueChange={(value) => set("status", value as ApplicationStatus | typeof ALL)}
          />
        </div>
      </div>

      <div className="w-full lg:w-44">
        <Label htmlFor="application-site-filter">Site</Label>
        <div className="mt-1.5">
          <Select value={filters.siteId} onValueChange={(value) => set("siteId", value)}>
            <SelectTrigger id="application-site-filter" aria-label="Filter by site">
              <SelectValue placeholder="Any site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any site</SelectItem>
              {siteOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full lg:w-52">
        <Label htmlFor="application-cv-filter">CV version</Label>
        <div className="mt-1.5">
          <Select
            value={filters.cvVersionId}
            onValueChange={(value) => set("cvVersionId", value)}
          >
            <SelectTrigger id="application-cv-filter" aria-label="Filter by CV version">
              <SelectValue placeholder="Any CV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any CV</SelectItem>
              {cvOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <div>
          <Label htmlFor="application-from">From</Label>
          <Input
            id="application-from"
            type="date"
            className="mt-1.5 w-[9.5rem]"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => set("from", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="application-to">To</Label>
          <Input
            id="application-to"
            type="date"
            className="mt-1.5 w-[9.5rem]"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => set("to", event.target.value)}
          />
        </div>
      </div>

      {hasActiveFilters(filters) ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start lg:self-auto"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
