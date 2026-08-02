"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/errors";
import type { Site } from "@/lib/api/types";
import { canDelete, isActive, isPreconfigured, sortSites } from "@/lib/sites/list";
import {
  useAddSite,
  useDeleteSite,
  useSites,
  useToggleSite,
} from "@/lib/hooks/use-sites";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RowError {
  id: string;
  message: string;
}

/**
 * Where the extension is allowed to capture from. Pre-configured sites ship
 * with ApplyMind and can only be switched on and off; sites added here can also
 * be removed, unless an application already points at one.
 */
export function SitesCard() {
  const query = useSites();
  const toggle = useToggleSite();
  const remove = useDeleteSite();

  const [rowError, setRowError] = useState<RowError | null>(null);

  const sites = sortSites(query.data?.sites ?? []);

  function onToggle(site: Site) {
    setRowError(null);
    toggle.mutate(site.id, {
      onError: (cause) =>
        setRowError({
          id: site.id,
          message: errorMessage(cause, "Could not change this site. Try again."),
        }),
    });
  }

  function onRemove(site: Site) {
    setRowError(null);
    remove.mutate(site.id, {
      onError: (cause) =>
        setRowError({
          id: site.id,
          message: errorMessage(cause, "Could not remove this site. Try again."),
        }),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites</CardTitle>
        <CardDescription>
          The job sites ApplyMind watches. Switch one off to stop capturing
          applications from it — the applications you already have are kept either
          way.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {query.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-red-600" role="alert">
            {errorMessage(
              query.error,
              "Could not load your sites. Check the API is reachable and reload.",
            )}
          </p>
        ) : sites.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No sites yet. Add the first one below.
          </p>
        ) : (
          <ul className="flex flex-col">
            {sites.map((site) => {
              const busy =
                (toggle.isPending && toggle.variables === site.id) ||
                (remove.isPending && remove.variables === site.id);
              const error = rowError?.id === site.id ? rowError.message : null;

              return (
                <li
                  key={site.id}
                  className="flex flex-col gap-2 border-b border-ink/10 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm text-ink">
                        <span className="truncate">{site.name}</span>
                        {isPreconfigured(site) ? (
                          <span className="shrink-0 text-xs uppercase tracking-wide text-ink-muted">
                            Built in
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-ink-muted">{site.domain}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <ActiveToggle
                        active={isActive(site)}
                        busy={busy}
                        label={`Capture applications from ${site.name}`}
                        onToggle={() => onToggle(site)}
                      />
                      {canDelete(site) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => onRemove(site)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {error ? (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <AddSiteForm />
      </CardContent>
    </Card>
  );
}

/**
 * A switch rather than a checkbox: it takes effect immediately, there is nothing
 * to submit. Built from a button so no new dependency is needed for one control.
 */
function ActiveToggle({
  active,
  busy,
  label,
  onToggle,
}: {
  active: boolean;
  busy: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-ink" : "bg-ink/25",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
          active ? "translate-x-[1.125rem]" : "translate-x-[0.1875rem]",
        )}
      />
    </button>
  );
}

/**
 * Adding a site records that you apply through it. The extension only knows how
 * to read LinkedIn in this version, so applications from a site added here are
 * the ones you enter yourself.
 */
function AddSiteForm() {
  const add = useAddSite();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ready = name.trim().length > 0 && domain.trim().length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || add.isPending) return;

    setError(null);
    add.mutate(
      { name: name.trim(), domain: domain.trim() },
      {
        onSuccess: () => {
          setName("");
          setDomain("");
        },
        onError: (cause) =>
          setError(errorMessage(cause, "Could not add the site. Try again.")),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-ink/10 pt-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink">Add a site</p>
        <p className="text-sm text-ink-muted">
          A full URL works — ApplyMind stores just the domain.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="site-name">Name</Label>
          <Input
            id="site-name"
            value={name}
            disabled={add.isPending}
            placeholder="Acme Careers"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="site-domain">Domain</Label>
          <Input
            id="site-domain"
            value={domain}
            disabled={add.isPending}
            placeholder="careers.acme.com"
            onChange={(event) => setDomain(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={!ready || add.isPending}>
          {add.isPending ? "Adding…" : "Add site"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
