# Engineering Standards

**Status:** Draft, awaiting founder approval
**Document authority rank:** 2 (operates under Golden Rules and Master Spec)
**Purpose:** Define "best practices" for this project so the Approval Policy and Daily Audit can check against something concrete instead of a vibe.
**Date:** 2026-05-17

---

## 1. Language & Framework

- **TypeScript everywhere.** No `.js` source files in the app.
- **Strictest TypeScript config.** Beyond `strict: true`:
  - `noUncheckedIndexedAccess: true` (array/object access returns `T | undefined`)
  - `exactOptionalPropertyTypes: true` (no accidental `undefined` in optional props)
  - `noImplicitOverride: true`
  - `noFallthroughCasesInSwitch: true`
  - `noUnusedLocals: true`, `noUnusedParameters: true`
- **No `any` types.** Period. If a type is hard, use `unknown` and narrow, or define the real type. `any` is not allowed even with a comment. CI fails the build.
- **No `as` casts** except for the narrow case of telling the compiler about a runtime check it can't see. Prefer type guards.
- **No non-null assertions (`!`).** Use proper narrowing.
- **Next.js App Router** — server components by default; `"use client"` only when actually needed.
- **No `getServerSideProps` / `getStaticProps`** — App Router patterns only.
- **Node 20 LTS** — matches Vercel default.

## 2. Dependencies

- **Justify before adding.** Any new package added in Bucket 2+ requires a one-line justification in the commit message and a note in the session log.
- **Prefer fewer, larger, well-maintained packages over many small ones.** Each dependency is a future maintenance + security surface.
- **No deprecated or unmaintained packages.** Check last release date and weekly downloads before adding.
- **No packages with license issues.** MIT/Apache/BSD only unless Alex explicitly approves an exception.
- **No `npm install -g`** for project tooling — use `npx` or dev dependencies.

## 3. File organization

- **App routes:** `app/`
- **Reusable React components:** `components/`, grouped by domain (e.g., `components/marketing/`, `components/storefront/`)
- **Server logic / handlers:** `app/api/` (Route Handlers)
- **Domain logic / services:** `lib/`, grouped by domain (e.g., `lib/waitlist/`, `lib/tenant/`, `lib/ai/`)
- **Types:** colocate with usage; shared types in `lib/types.ts`
- **DB schema migrations:** `supabase/migrations/`
- **Tests:** colocated as `*.test.ts` next to the code under test; integration tests in `tests/`
- **Public assets:** `public/`
- **Config:** project root (`next.config.js`, `tailwind.config.ts`, etc.)

## 4. Naming

- **Components:** `PascalCase.tsx`
- **Hooks:** `useThing.ts`
- **Files (non-component):** `kebab-case.ts`
- **Variables/functions:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE` for true constants (env-derived, magic numbers); otherwise `camelCase`
- **DB tables/columns:** `snake_case`
- **No abbreviations.** `subscription` not `sub`. Exception: standard ones (`id`, `url`, `db`).

## 5. Error handling

- **No silent failures.** Every catch block either handles meaningfully or rethrows. Empty catches are banned.
- **User-facing errors are graceful.** No stack traces shown to users. No "Error: undefined." Always a sentence a maker would understand.
- **All errors logged to Sentry** with context (user/tenant ID, route, action). PII is scrubbed.
- **Boundary errors only.** Validate at input boundaries (form submission, API request, external API response). Trust internal data after validation.
- **`Result` patterns for expected failures** (e.g., "email already exists"). `throw` only for genuinely exceptional cases.

## 6. Logging & observability

- **Sentry** captures uncaught errors and performance issues automatically.
- **PostHog** captures user actions: pageviews, form starts, form submits, key flow steps.
- **Server logs** via Vercel — structured JSON, including request ID and tenant ID.
- **No `console.log` in production code.** Use a logger (or remove). Lint enforces.
- **Sensitive data** (passwords, tokens, full emails in logs) is never logged. Hash or omit.

## 7. Testing

- **Every new feature has tests before it's considered done.** Code without tests does not merge.
- **Tests are written alongside the code, not after.** PRs without tests are bucket-4 escalations, not bucket-3 deploys.
- **Unit tests** for pure functions and domain logic (`lib/`).
- **Integration tests** for API routes, hitting a real test database (NOT mocks of the DB — per the Master Spec, mocks at this layer cause prod surprises).
- **E2E tests** (Playwright) for critical user flows: onboarding, checkout, log a sale, payment processor connection.
- **Coverage targets:**
  - `lib/` (domain logic): **≥ 90%**
  - `app/api/` (route handlers): **≥ 85%**
  - Components with logic: **≥ 75%**
  - Pure presentation components: best-effort
- **CI fails the build below targets.** Coverage drops are real and tracked.
- **Refactor confidence test:** before any non-trivial refactor, verify the affected code has tests. If not, write tests first, then refactor. This is the single biggest defense against rewrites.

## 8. Code style

- **Prettier** + **ESLint** with Next.js + TypeScript recommended configs. Auto-format on save.
- **Imports** ordered: external → internal absolute → internal relative.
- **No commented-out code in commits.** If you might want it later, that's what git history is for.
- **One responsibility per function.** If a function does two things, split it.
- **Function length:** if it doesn't fit on a screen, consider splitting. Not a hard rule.
- **No magic numbers.** Constants get names.

## 9. Comments

- **Default to no comments.** Well-named code documents itself.
- **Write comments when the WHY is non-obvious:** a hidden constraint, a workaround for a specific bug, surprising behavior, a load-bearing invariant.
- **Don't comment WHAT** — names already say what.
- **Don't reference the current task** ("added for the X flow") — that's what PR descriptions are for.

## 10. Git hygiene

- **Branch per feature** off `main`. Branch names: `phase-N/short-description`.
- **Commit messages:** imperative ("Add waitlist confirmation flow"), under 70 chars for the title; body explains why if non-obvious.
- **No `--no-verify`, `--no-gpg-sign`, `--force-push to main`.** Ever.
- **Squash-merge to main.** Keep history clean.
- **No secrets in commits.** `.env*` files are gitignored. Use `.env.example` for documentation.

## 11. Performance budgets

- **Storefront load: < 3s** on 4G mobile (per Golden Rule). Lighthouse mobile Performance ≥ 90.
- **API responses: < 500ms p95** for non-AI endpoints. AI endpoints have their own budget (TBD).
- **Initial JS bundle: < 200KB gzipped** for any user-facing page. Marketing site target < 100KB.
- **Image budget:** < 500KB per page total. Always use `next/image`.
- **Database queries:** N+1 patterns are banned. Use joins or batch loads.

## 12. Accessibility (WCAG 2.1 AA — Golden Rule)

- **Semantic HTML.** One `<h1>` per page. Proper landmarks.
- **All interactive elements keyboard-accessible.** Visible focus rings (not removed).
- **Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.** Verified in design tokens.
- **All images have meaningful `alt` text** (or `alt=""` if decorative).
- **Form labels associated with inputs.** Error messages programmatically linked.
- **`prefers-reduced-motion` respected** for any animation.
- **Axe scan on every PR.** Zero serious/critical violations to merge.

## 12.5 Database integrity (anti-rewrite)

Bad data is the most expensive thing to fix later. Constraints live at the DB level, not just the app level.

- **NOT NULL** on every column that should never be null. App-level "required" is not enough.
- **Foreign keys** on every relationship. With explicit `ON DELETE` behavior (cascade, set null, or restrict — never default).
- **CHECK constraints** for enum-like values, value ranges, and invariants (e.g., `price >= 0`, `status in ('draft','published')`).
- **UNIQUE constraints** wherever uniqueness matters (emails, slugs, etc.). Not just app-level checks.
- **Indexes** on every foreign key and every column used in a `WHERE` clause for hot queries.
- **Migrations are forward-only and immutable.** Never edit an applied migration; write a new one.
- **Every migration reviewed in bucket 4** before it runs in production. Schema decisions are the hardest to undo.
- **Soft-delete vs hard-delete decided per table** in the schema design phase, written into the migration.
- **`created_at` and `updated_at` on every table.** Always.
- **No application-managed IDs.** Use UUID v4 (or v7 for sortable) generated by the DB.

## 13. Feature flags (anti-rewrite)

- **Every user-facing feature ships behind a flag** for at least the first deploy.
- **Flags let us ship unfinished code dark** instead of building it in a long-lived branch (long branches → merge conflicts → rewrites).
- **Default to a simple, in-DB flag table** for now: `feature_flags(name, enabled, tenant_id_allowlist)`. No third-party service in Phase 0/1.
- **Flags get removed once a feature is fully rolled out.** Stale flags are tech debt; we audit quarterly.

## 14. Architectural Decision Records (anti-rewrite)

- **ADRs live in `project-docs/adr/NNNN-short-name.md`.**
- **An ADR is required for any decision that:**
  - Affects more than one module
  - Picks one option from multiple reasonable alternatives
  - Constrains future work
  - You'd want a new contributor to know in six months
- **ADR template:** Context → Decision → Consequences → Alternatives considered.
- **ADRs are append-only.** If a decision changes, write a new ADR that supersedes the old one (and link both ways). Never edit history.
- **Reason:** the most common cause of mid-project rewrites is forgetting why something was decided and silently undoing it. ADRs make that impossible.

## 15. Security baseline

- **No secrets in client-side code.** Anything `NEXT_PUBLIC_*` is treated as public.
- **All user input validated server-side**, regardless of client validation.
- **Parameterized queries only** (Supabase client handles this; no string-built SQL).
- **RLS enabled on every tenant table** (per Golden Rule) AND middleware tenant-scope check (defense in depth).
- **CSRF protection** on all state-changing routes.
- **Rate limiting** on public endpoints (waitlist, AI generation, auth).
- **Dependencies scanned** for vulnerabilities (Dependabot or equivalent).

## 16. AI usage (per Golden Rule)

- **Every AI call logs** the model used, prompt tokens, completion tokens, estimated cost, latency, and tenant ID.
- **Every AI call has a fallback** (cached content, niche default package, or graceful error).
- **AI output is validated** before being shown to the user or saved (schema check, content filter).
- **No PII sent to AI** beyond what the user explicitly entered for that generation.

## 17. Definition of Done (per feature)

A feature is "done" when ALL of the following are true:

- [ ] Code matches the spec
- [ ] Tests written and passing (meets coverage targets)
- [ ] No new lint or TypeScript errors
- [ ] DB constraints in place (NOT NULL, FK, CHECK, UNIQUE as applicable)
- [ ] Lighthouse / a11y / perf budgets met
- [ ] Feature flag added (if user-facing)
- [ ] ADR written (if the decision warrants it)
- [ ] Deployed to preview and reviewed by Alex
- [ ] Daily Audit Checklist passes for this feature
- [ ] Session log entry written

---

## Anti-patterns explicitly banned

- `if (tenantId === ...)` or any tenant-specific code paths
- Hardcoded colors, font sizes, spacing, border radii in components
- `any` types (no exceptions)
- `as` casts except for narrowing after a runtime check
- Non-null assertions (`!`)
- Empty catch blocks
- `console.log` in production code paths
- Commented-out code in commits
- Mocking the database in tests
- Editing an applied migration (always write a new one)
- App-level uniqueness or required checks without DB-level constraints to match
- Long-lived feature branches (use feature flags instead)
- Skipping the Daily Audit
- Force-pushing to main
- Adding features outside the current phase spec
- Making an architectural decision without writing an ADR
