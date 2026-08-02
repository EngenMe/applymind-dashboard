"use client";

import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCVDownloadLink } from "@/lib/api/cvs";
import type { ResolvedCVVersion } from "@/lib/hooks/use-cvs";
import { formatBytes, formatDate } from "@/lib/format";

/**
 * Which CV went to this company. The download asks for a presigned URL at click
 * time rather than at render time, because the link expires.
 */
export function CVCard({
                           resolved,
                           isLoading,
                       }: {
    resolved: ResolvedCVVersion | undefined;
    isLoading: boolean;
}) {
    const download = useMutation({
        mutationFn: () => {
            if (!resolved) throw new Error("No CV version attached");
            return getCVDownloadLink(resolved.cv.id, resolved.version.id);
        },
        onSuccess: (link) => {
            window.open(link.url, "_blank", "noopener,noreferrer");
        },
    });

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle>CV sent</CardTitle>
                {resolved ? (
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
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-sm text-ink-faint">Loading CV records…</p>
                ) : !resolved ? (
                    <p className="text-sm text-ink-faint">
                        No CV version was recorded for this application.
                    </p>
                ) : (
                    <dl className="space-y-2 text-sm">
                        <Row label="Version">{resolved.label}</Row>
                        <Row label="File" mono>
                            {resolved.version.original_filename}
                        </Row>
                        <Row label="Size" mono>
                            {formatBytes(resolved.version.file_size_bytes)}
                        </Row>
                        <Row label="Uploaded" mono>
                            {formatDate(resolved.version.uploaded_at)}
                        </Row>
                        <Row label="SHA-256" mono>
                            <span className="break-all">{resolved.version.sha256_hash.slice(0, 24)}…</span>
                        </Row>
                    </dl>
                )}
                {download.isError ? (
                    <p className="mt-3 text-sm text-rose-700" role="alert">
                        The download link could not be created. Try again.
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function Row({
                 label,
                 children,
                 mono = false,
             }: {
    label: string;
    children: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="eyebrow">{label}</dt>
            <dd className={mono ? "font-mono text-[0.8125rem] text-ink-muted" : "text-ink"}>
                {children}
            </dd>
        </div>
    );
}