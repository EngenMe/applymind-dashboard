"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusSelect } from "../status-select";
import type { ApplicationStatus } from "@/lib/api/types";

/**
 * Moves the application through the workflow.
 *
 * Every change here writes an application_status_history row backend-side, so
 * the note travels with the transition rather than being a free-floating
 * comment. The button stays disabled while the selection matches the current
 * status: the backend answers 409 status_unchanged for a no-op transition, and
 * there is no reason to make the user discover that.
 */
export function StatusChanger({
                                status,
                                onSubmit,
                                isSaving,
                                error,
                              }: {
  status: ApplicationStatus;
  onSubmit: (next: ApplicationStatus, note: string) => Promise<unknown>;
  isSaving: boolean;
  error?: string | null;
}) {
  const [selected, setSelected] = useState<ApplicationStatus>(status);
  const [note, setNote] = useState("");

  // Follow the record if it moves for any other reason.
  useEffect(() => {
    setSelected(status);
  }, [status]);

  const unchanged = selected === status;

  const submit = async () => {
    if (unchanged) return;
    await onSubmit(selected, note.trim());
    setNote("");
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="status-change">Move to</Label>
            <div className="mt-1.5">
              <StatusSelect
                  id="status-change"
                  aria-label="Move to status"
                  value={selected}
                  onValueChange={(value) => setSelected(value as ApplicationStatus)}
                  disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status-note">Note (optional)</Label>
            <Input
                id="status-note"
                className="mt-1.5"
                value={note}
                placeholder="Phone screen booked for Tuesday"
                onChange={(event) => setNote(event.target.value)}
                disabled={isSaving}
            />
          </div>

          <Button className="w-full" onClick={submit} disabled={unchanged || isSaving}>
            {isSaving ? "Updating…" : "Update status"}
          </Button>

          {unchanged ? (
              <p className="text-xs text-ink-faint">
                Already in this status. Pick a different one to record a change.
              </p>
          ) : null}

          {error ? (
              <p className="text-sm text-rose-700" role="alert">
                {error}
              </p>
          ) : null}
        </CardContent>
      </Card>
  );
}