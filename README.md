# ApplyMind — Web Dashboard

A web dashboard for tracking job applications end to end: which CV version was
sent where, what cover letter went with it, and where every application
currently stands — so you're never caught off guard when a recruiter calls
back weeks later asking "what did I actually send you?"

**Live:** [applymind.faroukhasnaoui.tech](https://applymind.faroukhasnaoui.tech)

This is the dashboard half of ApplyMind. A companion browser extension
silently captures applications as they're submitted on LinkedIn; this app is
where that data is reviewed, edited, and tracked through to an outcome.

## Features

- **Application ledger** — every application in one filterable, sortable list:
  by status, site, CV version, or date range
- **Full detail view** — captured job data, the exact CV and cover letter
  sent, an AI-generated match score, and a complete status-change history
- **Status pipeline** — move an application through Saved → Applied →
  Interviewing → Offer/Rejected, with every transition timestamped and
  optionally annotated, building a natural audit trail as you go
- **CV version history** — every CV you've uploaded, every version of it, and
  a reverse lookup showing exactly which applications each version was sent to
- **Cover letter management** — inline editing for text letters; file-based
  letters are preserved read-only, since the whole point is keeping an
  unaltered record of what was actually sent
- **Settings** — the profile summary that drives AI job-match scoring, plus
  management of which job sites are tracked
- **Light and dark mode**, matching system preference by default

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** with a small custom design-token system (no default
  Tailwind palette — a deliberate, cohesive visual language instead)
- **shadcn/ui** primitives, adapted to the token system above
- **TanStack Query** for all server state
- **Vitest** + **React Testing Library** for unit and component tests
- Deployed on **Vercel**, backed by a **Go / AWS Lambda** API (see the
  companion backend repository)

## Architecture

The browser never talks to the API directly:

```
browser ──► /api/backend/*  ──►  API Gateway ──► Lambda
            (Next.js route handler,
             attaches the API key server-side)
```

The backend is protected by a static API key. If the browser called it
directly, that key would have to live in a `NEXT_PUBLIC_*` variable — shipped
to every visitor's browser. Instead, a Next.js route handler at
`src/app/api/backend/[...path]/route.ts` proxies every request, attaching the
key server-side where it's never exposed. The typed API client in `src/lib/api/`
talks to this proxy as if it were the real API — method, query string, body,
and status all pass through untouched.

### A note on authentication

This is a deliberately single-user, personal tool — there is no login screen,
by design. The API key above is what stands between the backend and the
public internet; the dashboard itself trusts whoever can reach it. That's the
right tradeoff for a personal job-search tracker, and a clearly signposted
scope boundary rather than an oversight — a multi-user version would need a
proper auth layer in front of this.

## Getting started

```bash
npm install          # or: bun install
cp .env.example .env.local
npm run dev           # or: bun run dev — http://localhost:3000/applications
```

Two environment variables are required in `.env.local`:

| Variable | Purpose |
|---|---|
| `APPLYMIND_API_BASE_URL` | The backend's base URL, no trailing slash |
| `APPLYMIND_API_KEY` | The key the backend's auth middleware expects |

```bash
npm test           # unit and component tests
npx tsc --noEmit   # type check
npm run build      # production build
```

## Project structure

```
src/
  app/
    api/backend/[...path]/route.ts   API proxy — attaches the key server-side
    applications/                    application list + detail routes
    cvs/                             CV manager
    cover-letters/                   cover letter manager
    settings/                        profile summary + tracked sites
    globals.css                      design tokens (light + dark)
  components/
    ui/                              shadcn-derived primitives
    applications/                    filters, table, status badge/select
    applications/detail/             the detail-page panels
    cvs/                             CV upload + version history
    settings/                        settings page cards
    theme-toggle.tsx                 light/dark switch
  lib/
    api/                             typed client, one module per backend resource
    hooks/                           TanStack Query hooks
    applications/                    filter, sort and edit-merge logic (unit tested)
    settings/, sites/                pure logic backing the settings page (unit tested)
```

## Engineering notes worth highlighting

- **`PUT /applications/{id}` replaces the entire captured-data block** — there
  is no partial-update endpoint. Every edit is merged onto the current record
  before it's sent (`toUpdateBody`), so editing the job description can never
  accidentally blank the company name.
- **Status changes are append-only and fully audited.** Every transition goes
  through its own endpoint and writes a permanent history row; the UI
  disables the update button on a no-op transition rather than letting the
  user discover that from a server error.
- **CV version labels are derived, not stored** — the backend has no version
  number, so the dashboard computes "v3" by ordering each group's uploads by
  timestamp.
- **The whole app runs on one design-token system.** Every color is a named
  token (`ink`, `paper`, `graphite`, `rule`, …) rather than a hardcoded value,
  which is what makes dark mode a CSS-only change — no component needed to
  know a theme exists.

## License

MIT — see [LICENSE](./LICENSE).