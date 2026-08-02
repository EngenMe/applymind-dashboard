"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface UploadOutcome {
  /** The name the backend gave the group. */
  cvName: string;
  filename: string;
  /** True when these exact bytes were already stored and nothing was written. */
  alreadyExisted: boolean;
}

interface CVUploadFormProps {
  onUpload: (input: { file: File; tag?: string }) => void;
  isUploading: boolean;
  /** What the backend said, once. Cleared by the page when the form is reused. */
  outcome?: UploadOutcome | null;
  error?: string | null;
}

/**
 * Adding a CV by hand. The usual route is the extension — Flow 3 uploads
 * whatever was attached on the job site — so this is the fallback for a CV that
 * has not been sent anywhere yet.
 *
 * There is no name field because POST /cvs has none: the group takes its name
 * from the file, which is worth saying out loud rather than letting the user
 * discover it in the list afterwards.
 */
export function CVUploadForm({ onUpload, isUploading, outcome, error }: CVUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState("");
  const [touched, setTouched] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!file) return;

    onUpload({ file, tag: tag.trim() || undefined });
  };

  // Once the upload lands the picker is cleared, so it never keeps showing a
  // file that has already been stored.
  useEffect(() => {
    if (!outcome) return;
    setFile(null);
    setTag("");
    setTouched(false);
    if (fileInput.current) fileInput.current.value = "";
  }, [outcome]);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Add a CV</PanelTitle>
        <span className="text-xs text-ink-faint">
          The extension adds versions on its own while you apply
        </span>
      </PanelHeader>

      <PanelBody>
        <form className="flex flex-wrap items-end gap-3" onSubmit={submit}>
          <div className="min-w-[16rem] flex-1 space-y-1.5">
            <Label htmlFor="cv-file">CV file</Label>
            <Input
              id="cv-file"
              ref={fileInput}
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={isUploading}
              className="py-1.5 file:mr-3 file:rounded-[0.2rem] file:border-0 file:bg-paper file:px-2 file:py-1 file:font-sans file:text-xs file:text-ink-muted"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setTouched(false);
              }}
            />
          </div>

          <div className="w-40 space-y-1.5">
            <Label htmlFor="cv-tag">Tag (optional)</Label>
            <Input
              id="cv-tag"
              value={tag}
              placeholder="backend"
              disabled={isUploading}
              onChange={(event) => setTag(event.target.value)}
            />
          </div>

          <Button type="submit" disabled={isUploading}>
            <Upload aria-hidden />
            {isUploading ? "Uploading…" : "Upload CV"}
          </Button>
        </form>

        <p className="mt-2.5 text-xs text-ink-faint">
          A new CV is named after the file, so rename the file first if you want it listed
          differently. Uploading a file that already exists changes nothing.
        </p>

        {touched && !file ? (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            Choose a file to upload.
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        {outcome ? (
          <p className="mt-2 text-sm text-ink-muted" role="status">
            {outcome.alreadyExisted
              ? `${outcome.filename} was already stored under ${outcome.cvName} — nothing new was created.`
              : `${outcome.filename} saved as ${outcome.cvName}.`}
          </p>
        ) : null}
      </PanelBody>
    </Panel>
  );
}
