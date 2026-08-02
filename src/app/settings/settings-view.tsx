"use client";

import { ProfileSummaryCard } from "@/components/settings/profile-summary-card";
import { SitesCard } from "@/components/settings/sites-card";

/**
 * Two things to set: what ApplyMind knows about you, and where it watches.
 * There is no account section — the MVP has one user and no login.
 */
export function SettingsView() {
  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">
          How ApplyMind scores the jobs you apply to, and which sites it watches.
        </p>
      </header>

      <ProfileSummaryCard />
      <SitesCard />
    </div>
  );
}
