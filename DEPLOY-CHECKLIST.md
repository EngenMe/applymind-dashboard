# ApplyMind dashboard — deploy checklist

Phase 11. Run this top to bottom once; after that only the "every deploy" section
matters.

## 1. API key wiring — the audit

The claim to verify is that the API key reaches the backend on every request and
never reaches the browser.

- [ ] `grep -rn "APPLYMIND_API_KEY" src/` returns **only** `src/app/api/backend/[...path]/route.ts`.
- [ ] `grep -rn "NEXT_PUBLIC" src/` returns **only** `NEXT_PUBLIC_API_PROXY_PATH` in `src/lib/api/client.ts`. Anything else named `NEXT_PUBLIC_*` is shipped to every visitor — a key there is a leak.
- [ ] Every `src/lib/api/*.ts` module calls `request()` from `./client` and none calls `fetch` directly. `grep -rn "fetch(" src/lib src/components` should come back empty.
- [ ] Load the deployed dashboard, open devtools → Network, and confirm requests go to `/api/backend/...` on your own origin, with no `Authorization` header on the browser side.

Because the browser only ever talks to the same origin, the backend's
`CORS_ALLOWED_ORIGINS` does **not** need the Vercel domain for the dashboard to
work. Only add the Vercel origin there if something calls API Gateway directly.

## 2. Environment variables

Server-only, set in Vercel → Project → Settings → Environment Variables, for
Production and Preview:

| Name | Value | Notes |
| --- | --- | --- |
| `APPLYMIND_API_BASE_URL` | `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}` | No trailing slash needed — the proxy strips one. |
| `APPLYMIND_API_KEY` | the same key the Lambda's `API_KEY` holds | Never prefix with `NEXT_PUBLIC_`. |

`NEXT_PUBLIC_API_PROXY_PATH` is optional and should stay unset unless the proxy
route is moved.

- [ ] Both set for Production.
- [ ] Both set for Preview, if you use preview deploys.
- [ ] Local `.env.local` has the same two names.

`route.ts` reads both at module scope, so **changing them in Vercel needs a
redeploy**, not just a new request. If the dashboard answers
`dashboard_misconfigured`, that is this: the variable is missing from the build
that is serving. (The message text mentions `.env.local`, which is the local
wording — on Vercel read it as "the two variables above".)

## 3. Smoke test after deploy

Against the live dashboard URL:

- [ ] `curl -s {BACKEND_BASE}/health` → `{"status":"ok","database":"reachable"}`. This one is unauthenticated by design.
- [ ] `curl -s {DASHBOARD_URL}/api/backend/sites` → the site list. If this returns 401 the key is wrong; if it returns 502 `backend_unreachable` the base URL is.
- [ ] `/applications` lists applications and site names resolve to names, not UUIDs.
- [ ] `/settings` loads both cards without an error banner.

## 4. End-to-end, by hand (the phase deliverable)

- [ ] **View an application** — open `/applications`, click through to a detail page.
- [ ] **Edit an application** — change a field, reload, confirm it stuck.
- [ ] **Change a status** — confirm the new entry appears in the status history.
- [ ] **Upload a CV** — `/cvs`, upload a file, confirm the version appears. Upload the same bytes again and confirm it is recognised as the existing version rather than duplicated.
- [ ] **Add a cover letter** — attach one to an application, reload, confirm it renders.
- [ ] **Save a profile summary** — `/settings`, save three or four sentences, reload, confirm it comes back and the saved time is shown.
- [ ] **Toggle a site** — switch one off, reload, confirm it stayed off. Confirm it disappears from the site filter on `/applications` (that list is active-only).
- [ ] **Add a custom site** — a full URL like `https://careers.example.com/jobs`; confirm what comes back is the bare domain.
- [ ] **Remove a custom site** — confirm it goes.
- [ ] **Try to remove a built-in site** — there should be no Remove control on it at all.
- [ ] **Try to remove a site that has applications** — expect the row to explain that applications still reference it.

> **Creating** an application is not something the dashboard does — the tree has
> no new-application route, and applications arrive from the extension. Cover the
> "create an application" line of the phase deliverable with the extension, or
> with `POST /applications` via curl, and confirm it then appears in the list.

## 5. Every deploy after this one

- [ ] `bun run build` (or `npm run build`) passes locally.
- [ ] `bun run test` passes.
- [ ] After the Vercel deploy finishes, load `/settings` once — it is the page that touches the most endpoints in one screen, so it is the fastest way to notice a broken key or base URL.
