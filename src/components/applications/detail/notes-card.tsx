import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusHistoryEntry } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

/**
 * ⚠️ OPEN QUESTION — see the phase summary.
 *
 * The phase asks for a free-text notes section saved on blur. There is nowhere
 * to put it: `applications` has no notes column in the ERD, and no endpoint
 * accepts one. The only note the backend stores against an application is
 * `application_status_history.note`, which is attached to a transition.
 *
 * So this panel reads those notes back rather than inventing an endpoint. It is
 * deliberately read-only. Adding `applications.notes` plus a PUT is a small
 * backend change — say the word and this becomes an editable textarea with the
 * save-on-blur behaviour the phase describes.
 */
export function NotesCard({ history }: { history: StatusHistoryEntry[] }) {
    const notes = [...history]
        .filter((entry) => entry.note?.trim())
        .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                {notes.length === 0 ? (
                    <p className="text-sm text-ink-faint">
                        No notes yet. Notes are recorded with a status change — add one in the Status panel.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {notes.map((entry) => (
                            <li key={entry.id} className="border-l-2 border-rule pl-3">
                                <p className="text-sm leading-relaxed">{entry.note}</p>
                                <p className="tabular mt-1 font-mono text-xs text-ink-faint">
                                    {entry.to_status} · {formatDateTime(entry.changed_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}