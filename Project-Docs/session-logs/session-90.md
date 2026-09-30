# Session 90 — 2026-09-30: backend auto sign-out

## Done
- **Auto sign-out for the backend, live.** Every `/manage` request on the app host is checked in `middleware.ts`. A session ends 8 hours after the last activity, and always 7 days after sign-in (makers use shared/public devices; Supabase's own timeouts are paid-plan).
  - 7-day limit: the sign-in time Supabase signs into the login token (`amr`), read with `getClaims()`. A token with no sign-in time or session id is ended, not trusted.
  - 8-hour limit: `bk_seen` cookie on the app host only, HMAC-signed and bound to the session id (`lib/backend/session-limits.ts`). Missing or forged cookie → idle counted from sign-in, so tampering can only make it stricter.
  - Missing/short `BACKEND_SESSION_SECRET` is logged and falls back to that strict rule (signed out 8h after sign-in even while active).
  - On sign-out: local-scope Supabase sign-out, then redirect to `/signin?ended=idle|max`, which says why.
- Alex chose the signed cookie (my recommendation) and added `BACKEND_SESSION_SECRET` to the Worker's top-level Variables and Secrets. Local `.env.local` has its own, different value.
- Verified: real sign-in on app.localhost lands in the backend (real tokens carry `amr`); live after deploy: the sign-in note renders, `/manage` → sign-in when signed out, `/admin` on Classic Loafs → backend, bohdiai.com and Cut-Pro 200.
- Full suite: one failure on the first run, the known flaky `SectionEditor.test.tsx`; passes alone and on the re-run. tsc + lint clean.

## Not covered
- A server action posted after the session ended gets the sign-in redirect as its response; the next page load shows sign-in. Fine for now.

## Next
- Maker backend 1b — Catalog: write the plan from the piece-1 spec, then build.
