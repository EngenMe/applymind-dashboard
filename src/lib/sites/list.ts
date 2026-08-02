import type { Site } from "@/lib/api/types";

/**
 * Reading the site flags. The handler always sends both, but the Site type
 * keeps them optional so partial fixtures still compile — these three functions
 * are the only place that decides what a missing flag means.
 */

export function isPreconfigured(site: Site): boolean {
  return site.is_preconfigured === true;
}

export function isActive(site: Site): boolean {
  return site.is_active !== false;
}

/**
 * Pre-configured sites cannot be deleted, only deactivated — a rule the service
 * layer enforces with a 409. The UI hides the control rather than offering an
 * action that always fails.
 *
 * A custom site can still be refused if an application points at it
 * (site_in_use); nothing in the list response says whether that is the case, so
 * that one surfaces as an error after the fact.
 */
export function canDelete(site: Site): boolean {
  return !isPreconfigured(site);
}

/**
 * Pre-configured sites first, then the ones added here, alphabetical within
 * each group. The split is the useful one: the top group is what ships with
 * ApplyMind and can only be switched on and off, the bottom group is yours.
 */
export function sortSites(sites: Site[]): Site[] {
  return [...sites].sort((a, b) => {
    const byGroup = Number(isPreconfigured(b)) - Number(isPreconfigured(a));
    if (byGroup !== 0) return byGroup;
    return a.name.localeCompare(b.name);
  });
}
