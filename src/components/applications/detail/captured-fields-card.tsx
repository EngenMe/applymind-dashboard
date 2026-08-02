"use client";

import { useEffect, useState } from "react";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/card";
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
import type { Application, UpdateApplicationBody } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { toUpdateBody } from "@/lib/applications/edit";

const NO_CV = "none";

interface Option {
  id: string;
  label: string;
}

interface CapturedFieldsCardProps {
  application: Application;
  siteOptions: Option[];
  cvOptions: Option[];
  onSave: (body: UpdateApplicationBody) => Promise<unknown>;
  isSaving: boolean;
  error?: string | null;
}

export function CapturedFieldsCard({
  application,
  siteOptions,
  cvOptions,
  onSave,
  isSaving,
  error,
}: CapturedFieldsCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(application));

  // Re-seed whenever the record changes underneath, e.g. after a status update
  // refetch, so the form never edits a stale copy.
  useEffect(() => {
    if (!editing) setDraft(toDraft(application));
  }, [application, editing]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    await onSave(
      toUpdateBody(application, {
        company_name: draft.companyName.trim(),
        job_title: draft.jobTitle.trim(),
        job_url: draft.jobUrl.trim(),
        site_id: draft.siteId,
        cv_version_id: draft.cvVersionId === NO_CV ? null : draft.cvVersionId,
      }),
    );
    setEditing(false);
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Captured details</PanelTitle>
        {editing ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(toDraft(application));
                setEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </PanelHeader>

      <PanelBody className="grid gap-4 sm:grid-cols-2">
        {editing ? (
          <>
            <Field label="Company" htmlFor="edit-company">
              <Input
                id="edit-company"
                value={draft.companyName}
                onChange={(event) => set("companyName", event.target.value)}
              />
            </Field>
            <Field label="Job title" htmlFor="edit-title">
              <Input
                id="edit-title"
                value={draft.jobTitle}
                onChange={(event) => set("jobTitle", event.target.value)}
              />
            </Field>
            <Field label="Job URL" htmlFor="edit-url" className="sm:col-span-2">
              <Input
                id="edit-url"
                type="url"
                value={draft.jobUrl}
                onChange={(event) => set("jobUrl", event.target.value)}
              />
            </Field>
            <Field label="Site" htmlFor="edit-site">
              <Select value={draft.siteId} onValueChange={(value) => set("siteId", value)}>
                <SelectTrigger id="edit-site" aria-label="Site">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.length === 0 ? (
                    <SelectItem value={application.site_id}>Current site</SelectItem>
                  ) : (
                    siteOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="CV version" htmlFor="edit-cv">
              <Select
                value={draft.cvVersionId}
                onValueChange={(value) => set("cvVersionId", value)}
              >
                <SelectTrigger id="edit-cv" aria-label="CV version">
                  <SelectValue placeholder="Select a CV version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CV}>No CV recorded</SelectItem>
                  {cvOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        ) : (
          <>
            <ReadOnly label="Company" value={application.company_name} />
            <ReadOnly label="Job title" value={application.job_title} />
            <ReadOnly label="Job URL" value={application.job_url} className="sm:col-span-2" mono />
            <ReadOnly
              label="Applied"
              value={application.applied_at ? formatDate(application.applied_at) : "Not applied yet"}
            />
            <ReadOnly label="Last updated" value={formatDateTime(application.updated_at)} />
          </>
        )}

        {error ? (
          <p className="text-sm text-rose-700 sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

interface Draft {
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  siteId: string;
  cvVersionId: string;
}

function toDraft(application: Application): Draft {
  return {
    companyName: application.company_name,
    jobTitle: application.job_title,
    jobUrl: application.job_url,
    siteId: application.site_id,
    cvVersionId: application.cv_version_id ?? NO_CV,
  };
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ReadOnly({
  label,
  value,
  className,
  mono = false,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-1 text-sm break-words ${mono ? "font-mono text-[0.8125rem] text-ink-muted" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
