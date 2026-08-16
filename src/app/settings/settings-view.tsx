"use client";

import { ProfileSummaryCard } from "@/components/settings/profile-summary-card";
import { SessionsCard } from "@/components/settings/sessions-card";
import { SitesCard } from "@/components/settings/sites-card";
import { TokensCard } from "@/components/settings/tokens-card";

/**
 * What ApplyMind knows about you, where it watches, and now who's signed in.
 *
 * TokensCard is the "connect the extension" flow phase 16 asks for: creating a
 * token here and pasting it into the popup is how the extension authenticates,
 * so it sits above SessionsCard — the thing someone is more likely to come here
 * to do, ahead of the thing they come here to check.
 */
export function SettingsView() {
  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">
          How ApplyMind scores the jobs you apply to, which sites it watches,
          and what's signed in to your account.
        </p>
      </header>

      <ProfileSummaryCard />
      <SitesCard />
      <TokensCard />
      <SessionsCard />
    </div>
  );
}
