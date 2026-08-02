# ApplyMind — Web Dashboard

Phase 9: application list and detail views. Next.js 15 + TypeScript, Tailwind CSS v4,
Shadcn-style primitives, React Query.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in both values
npm run dev                  # http://localhost:3000/applications
```

```bash
npm test          # 35 tests
npx tsc --noEmit  # type check
npm run build
```

`APPLYMIND_API_BASE_URL` is the API Gateway stage URL with no trailing slash.
`APPLYMIND_API_KEY` is the key the backend middleware expects.

## How it is wired

```
browser ──► /api/backend/*  ──►  API Gateway ──► Lambda
            (Next route handler,
             attaches the API key)
```

React Query runs in the browser, so calling the API directly would mean putting the
key in a `NEXT_PUBLIC_` variable — which ships it to anyone who loads the page. The
proxy at `src/app/api/backend/[...path]/route.ts` keeps it server-side. It forwards
method, query string, body and status untouched, so the typed client in
`src/lib/api/` still speaks to the real routes.

Set `NEXT_PUBLIC_API_PROXY_PATH` only if you mount the proxy somewhere else.

## Layout

```
src/
  app/
    api/backend/[...path]/route.ts   proxy, adds the API key
    applications/page.tsx            list route
    applications/applications-view.tsx
    applications/[id]/page.tsx       detail route
    applications/[id]/application-detail-view.tsx
    globals.css                      design tokens
  components/
    ui/                              button, input, select, table, panel, …
    applications/                    filters bar, table, status badge/select
    applications/detail/             the detail panels
  lib/
    api/                             typed client, one file per backend module
    hooks/                           React Query hooks
    applications/filters.ts          filter + sort logic (pure, unit tested)
    applications/status.ts           status presentation rules
    applications/edit.ts             PUT body merge helper
```

## Decisions worth knowing about

**Filtering is server-side, sorting is client-side.** `GET /applications` accepts
`status`, `site_id`, `cv_version_id`, `q`, `from`, `to`, `limit`, `offset` but has no
sort parameter and returns no total count. So the backend narrows the set and the
browser orders it. "Load more" raises `limit` rather than walking `offset`, which
keeps the sort coherent across what is on screen.

**`PUT /applications/{id}` replaces the whole captured-data block.** Every partial
edit is merged onto the current record by `toUpdateBody` before it is sent, so
editing the job description cannot blank the company name.

**Status changes only go through `PATCH .../status`,** so every transition gets its
audit row. The button stays disabled while the selection matches the current status —
the backend answers 409 `status_unchanged` for a no-op, and there is no reason to
make the user discover that.

**Cover letters:** POST when none exists, PUT to edit an existing text one. File
cover letters are not editable — the backend answers 409 `not_editable`, because the
stored bytes are the record of what was actually sent. Replacing one is an upload,
which belongs to the Cover Letter Manager phase.

**CV version labels** ("Backend CV — v3") are derived in the browser by ordering each
group's versions by `uploaded_at`. The backend has no version number.

## Open questions

**Notes.** The phase asks for a free-text notes section saved on blur. There is
nowhere to put it: `applications` has no notes column in the ERD and no endpoint
accepts one. The only note the backend stores against an application is
`application_status_history.note`, which is attached to a transition. So the Notes
panel is read-only and replays those notes, and the note input lives in the Status
panel where the backend actually accepts it. Adding `applications.notes` plus a PUT
turns this into the editable textarea the phase describes — see the comment at the
top of `notes-card.tsx`.

**Follow-up due date column.** Not returned by `GET /applications`. Only `POST`
returns `follow_up_due_at`, and `GET /notifications/due` covers reminders already
due rather than ones due in three days — its handler was not attached to this phase,
so its wire format is unknown here too. The column is left out rather than guessed.
Adding `follow_up_due_at` to the list response is the smallest fix.

## Assumptions

- **`GET /sites` exists** and wraps rows in a `sites` key, matching how `cvs` wraps
  `cvs`. Its handler was not attached. The query does not retry and every consumer
  falls back to the job URL's host, so a wrong guess costs a column, not the page.
- **`applied_at` is not editable** — `applications.UpdateInput` does not accept it,
  so the detail page shows it read-only.
- The proxy sends the key as both `Authorization: Bearer` and `x-api-key`, since the
  middleware was not attached either.

## Out of scope, as specified

CV Manager, Cover Letter Manager, Settings, stats, export, auth UI. Deleting an
application is in the typed client but has no UI — it is in neither the scope nor
the out-of-scope list.
