"use client";

import { useEffect, useState } from "react";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Application, UpdateApplicationBody } from "@/lib/api/types";
import { toUpdateBody } from "@/lib/applications/edit";

/**
 * The job description as captured from the DOM. Read-only by default and
 * scrolled rather than truncated — the whole point of keeping it is being able
 * to re-read what the posting actually said months later.
 */
export function JobDescriptionCard({
  application,
  onSave,
  isSaving,
}: {
  application: Application;
  onSave: (body: UpdateApplicationBody) => Promise<unknown>;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(application.job_description);

  useEffect(() => {
    if (!editing) setDraft(application.job_description);
  }, [application.job_description, editing]);

  const save = async () => {
    await onSave(toUpdateBody(application, { job_description: draft }));
    setEditing(false);
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Job description</PanelTitle>
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(application.job_description);
                setEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save description"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </PanelHeader>
      <PanelBody>
        {editing ? (
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={18}
            aria-label="Job description"
          />
        ) : application.job_description.trim() ? (
          <div className="max-h-[26rem] overflow-y-auto pr-1 text-sm leading-relaxed whitespace-pre-wrap text-ink-muted">
            {application.job_description}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">
            No description was captured. Paste it in with Edit if you still have it.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}
