"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCoverLetter, useCoverLetterDownload, useSaveCoverLetterText } from "@/lib/hooks/use-cover-letter";
import { formatDateTime } from "@/lib/format";

/**
 * Text cover letters are edited in place. File ones are not: the stored bytes
 * are the record of what was actually sent, so the backend refuses a PUT on
 * them and replacing one means an upload — which belongs to the Cover Letter
 * Manager, not here.
 */
export function CoverLetterCard({ applicationId }: { applicationId: string }) {
  const { data: coverLetter, isPending, isError } = useCoverLetter(applicationId);
  const isText = !coverLetter || coverLetter.kind === "text";

  const save = useSaveCoverLetterText(applicationId, Boolean(coverLetter));
  const download = useCoverLetterDownload(applicationId);

  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(coverLetter?.body_text ?? "");
  }, [coverLetter, dirty]);

  const commit = () => {
    if (!dirty) return;
    save.mutate(draft, { onSuccess: () => setDirty(false) });
  };

  return (
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Cover letter</CardTitle>
          <div className="flex items-center gap-2">
            {coverLetter ? (
                <span className="eyebrow">
              {coverLetter.kind} · saved {formatDateTime(coverLetter.updated_at)}
            </span>
            ) : null}
            {coverLetter?.kind === "file" ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => download.mutate()}
                    disabled={download.isPending}
                >
                  <Download aria-hidden />
                  {download.isPending ? "Preparing…" : "Download"}
                </Button>
            ) : null}
            {isText ? (
                <Button size="sm" onClick={commit} disabled={!dirty || save.isPending}>
                  {save.isPending ? "Saving…" : "Save cover letter"}
                </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {isPending ? (
              <p className="text-sm text-ink-faint">Loading…</p>
          ) : isError ? (
              <p className="text-sm text-rose-700" role="alert">
                The cover letter did not load.
              </p>
          ) : coverLetter?.kind === "file" ? (
              <p className="font-mono text-sm text-ink-muted">
                {coverLetter.original_filename}
              </p>
          ) : (
              <>
                <Textarea
                    value={draft}
                    rows={12}
                    aria-label="Cover letter text"
                    placeholder={
                      coverLetter
                          ? "This cover letter is empty."
                          : "Nothing was captured for this application. Paste the letter you sent."
                    }
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setDirty(true);
                    }}
                    onBlur={commit}
                />
                {save.isError ? (
                    <p className="mt-2 text-sm text-rose-700" role="alert">
                      {save.error instanceof Error ? save.error.message : "The save failed."}
                    </p>
                ) : null}
              </>
          )}
        </CardContent>
      </Card>
  );
}