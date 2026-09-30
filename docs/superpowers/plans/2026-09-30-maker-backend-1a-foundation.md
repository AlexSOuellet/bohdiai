# Maker Backend 1a — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client signs in at `app.bohdiai.com` (reached from a "Shop owner sign-in" link on their own site), sets their password from an emailed invite, and lands in a Penny-styled backend whose menu and home screen are assembled from the features switched on for their site.

**Architecture:** Sign-in, password setup and the backend (`/manage`) are served only on the app host; the edge middleware sends those paths there from every other host. Feature switches live in a new `tenant_features` table read through one registry in `lib/backend/features.ts`; the shell asks the registry which nav items and home cards to show. Invite and reset emails are built from Supabase `generateLink` hashed tokens, sent through Resend, and verified at `/auth/confirm`.

**Tech Stack:** Next.js 16 App Router (edge `middleware.ts`), Supabase Auth + Postgres (RLS), Resend, Cloudflare Workers Rate Limiting (`FORM_LIMITER`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-maker-backend-piece-1-design.md` (sections 1, 2, 2a, 3, the footer link in 7, 8, 9). Parent: `2026-09-30-maker-backend-overview.md`.

**Plans that follow (separate documents):** 1b Catalog (products, options, stock, photos, collections, one-place price, storefront rendering); 1c Video (Cloudflare Stream); 1d Custom domains + status panel. This plan leaves hooks for them (feature registry, home cards, needs-attention) but builds none of their screens.

**Rules that apply to every task:** read `node_modules/next/dist/docs/` for any Next API you touch (this Next has breaking changes); TypeScript strictest (`Engineering-Standards.md`); no inline styles (CSS classes + variables); storefront strings only through the renderer's strings maps; every failure shows the user a message; tests are part of done; run `npm run typecheck` and `npx eslint <files>` before each commit; never run the full suite alongside a dev server.

---

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/20260930000001_tenant_features.sql` | `tenant_features` table + RLS |
| `lib/backend/features.ts` | Feature keys, defaults, `loadSiteFeatures`, `hasFeature` |
| `lib/backend/modules.ts` | What each feature adds to the shell (nav items, home cards) |
| `lib/backend/app-url.ts` | The app host origin derived from `SITE_URL` |
| `lib/backend/backend-paths.ts` | Which paths belong to the app host; the redirect for other hosts |
| `lib/backend/current-site.ts` | The signed-in admin + the site they are acting on (picker cookie) |
| `lib/backend/auth-links.ts` | Build invite/reset links and emails (pure) + send them |
| `lib/backend/action-limit.ts` | Rate limit for server actions (sign-in, reset) |
| `lib/backend/auth-actions.ts` | Server actions: sign in, sign out, request reset, set password |
| `app/auth/confirm/route.ts` | Verify an emailed token, start the session, go to set-password |
| `app/signin/*`, `app/forgot-password/page.tsx`, `app/manage/set-password/page.tsx` | Auth pages in the backend look |
| `app/manage/layout.tsx`, `app/manage/backend.css`, `app/manage/_components/*` | The Penny-style shell |
| `app/manage/page.tsx` | Home screen |
| `app/manage/switch-site/route.ts` | Shop picker: set the acting site |
| `scripts/set-feature.ts`, `scripts/invite-maker.ts` | Claude's tools until Alex's admin exists |
| `lib/proxy-security.ts`, `middleware.ts` | App-host routing; dormant list update |
| `lib/archetypes/main-street/{defaults.ts,chrome.tsx}`, `lib/archetypes/contractor/{strings.ts,ContractorLanding.tsx}` | "Shop owner sign-in" footer link |
| `e2e/backend.spec.ts` | End-to-end: sign-in page, redirect when signed out, host routing |

---

### Task 1: `tenant_features` table

**Files:**
- Create: `supabase/migrations/20260930000001_tenant_features.sql`
- Modify: `lib/database.types.ts` (regenerated, never hand-edited)

- [ ] **Step 1: Write the migration**

```sql
-- Per-site feature switches (Maker Backend piece 1). Alex controls which features a
-- site has; later a plan/tier flips the same rows. A site with no row for a key gets
-- the key's default from lib/backend/features.ts.
create table if not exists tenant_features (
  tenant_id uuid not null references tenants(id) on delete cascade,
  feature_key text not null check (feature_key ~ '^[a-z][a-z0-9_]*$'),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, feature_key)
);

create trigger tenant_features_set_updated_at
  before update on tenant_features
  for each row execute function set_updated_at();

alter table tenant_features enable row level security;

-- A site's admins may read their own switches. Nobody writes through the API:
-- only the service role (scripts, later Alex's admin and billing) changes them.
create policy tenant_features_admin_read on tenant_features
  for select to authenticated
  using (is_tenant_admin(tenant_id));

comment on table tenant_features is
  'Per-site feature switches. Absent row = the key''s code default. Written only by the service role. Spec: docs/superpowers/specs/2026-09-30-maker-backend-piece-1-design.md §2.';
```

- [ ] **Step 2: Apply it and regenerate types**

Run: `node scripts/db-migrate.mjs` then `npm run gen:types`
Expected: the migration is listed as applied; `lib/database.types.ts` now contains `tenant_features`.

- [ ] **Step 3: Confirm the table and policy exist**

Run (read-only DB query tool or psql): `select policyname from pg_policies where tablename = 'tenant_features';`
Expected: one row, `tenant_features_admin_read`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260930000001_tenant_features.sql lib/database.types.ts
git commit -m "feat(backend): tenant_features table for per-site feature switches"
```

---

### Task 2: Feature registry

**Files:**
- Create: `lib/backend/features.ts`
- Test: `lib/backend/features.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { FEATURES, FEATURE_KEYS, resolveFeatures, loadSiteFeatures, hasFeature, type FeatureKey } from './features';

function fakeDb(result: { data: unknown; error: { message: string } | null }): SupabaseClient<Database> {
  const b = {
    select: () => b,
    eq: () => b,
    then: (res: (v: unknown) => unknown) => Promise.resolve(result).then(res),
  };
  return { from: () => b } as unknown as SupabaseClient<Database>;
}

describe('resolveFeatures', () => {
  it('uses each key default when the site has no rows', () => {
    const on = resolveFeatures([]);
    for (const key of FEATURE_KEYS) expect(on.has(key)).toBe(FEATURES[key].default);
  });

  it('a row overrides the default either way', () => {
    const on = resolveFeatures([
      { feature_key: 'catalog', enabled: false },
      { feature_key: 'digital_products', enabled: true },
    ]);
    expect(on.has('catalog')).toBe(false);
    expect(on.has('digital_products')).toBe(true);
  });

  it('ignores rows for keys the code does not know', () => {
    const on = resolveFeatures([{ feature_key: 'retired_thing', enabled: true }]);
    expect([...on].every((k) => (FEATURE_KEYS as readonly string[]).includes(k))).toBe(true);
  });
});

describe('loadSiteFeatures', () => {
  it('reads the site rows and resolves them', async () => {
    const db = fakeDb({ data: [{ feature_key: 'video', enabled: true }], error: null });
    const on = await loadSiteFeatures(db, 't1');
    expect(on.has('video')).toBe(true);
  });

  it('throws with a clear message when the read fails', async () => {
    const db = fakeDb({ data: null, error: { message: 'boom' } });
    await expect(loadSiteFeatures(db, 't1')).rejects.toThrow('Could not load site features: boom');
  });
});

describe('hasFeature', () => {
  it('answers from the resolved set', () => {
    const on = new Set<FeatureKey>(['catalog']);
    expect(hasFeature(on, 'catalog')).toBe(true);
    expect(hasFeature(on, 'video')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/backend/features.test.ts`
Expected: FAIL — cannot find module `./features`.

- [ ] **Step 3: Implement**

```ts
/**
 * Per-site feature switches (Maker Backend piece 1, spec §2). Alex decides which
 * features a site has; the client never sees a switch. A site with no row for a
 * key gets the key's default here. Later pieces add their keys to FEATURES.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const FEATURES = {
  catalog: { default: true, description: 'Products and collections' },
  video: { default: false, description: 'One short video per product (Cloudflare Stream)' },
  digital_products: { default: false, description: 'Products or choices sold as downloadable files' },
  custom_domain_panel: { default: true, description: 'Domain status on the home screen and in settings' },
} as const satisfies Record<string, { default: boolean; description: string }>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export type FeatureRow = { feature_key: string; enabled: boolean };

/** The set of features on for a site, from its rows plus the code defaults. */
export function resolveFeatures(rows: readonly FeatureRow[]): Set<FeatureKey> {
  const overrides = new Map<FeatureKey, boolean>();
  for (const row of rows) if (isFeatureKey(row.feature_key)) overrides.set(row.feature_key, row.enabled);
  return new Set(FEATURE_KEYS.filter((key) => overrides.get(key) ?? FEATURES[key].default));
}

export async function loadSiteFeatures(db: SupabaseClient<Database>, tenantId: string): Promise<Set<FeatureKey>> {
  const { data, error } = await db.from('tenant_features').select('feature_key, enabled').eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not load site features: ${error.message}`);
  return resolveFeatures((data ?? []) as FeatureRow[]);
}

export function hasFeature(on: ReadonlySet<FeatureKey>, key: FeatureKey): boolean {
  return on.has(key);
}
```

- [ ] **Step 4: Run it to see it pass**

Run: `npx vitest run lib/backend/features.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/backend/features.ts lib/backend/features.test.ts
git commit -m "feat(backend): feature registry with code defaults"
```

---

### Task 3: `set-feature` script

**Files:**
- Create: `scripts/set-feature.ts`

- [ ] **Step 1: Write the script**

```ts
/**
 * Claude's tool for Alex's feature switches until his admin exists.
 *   npx tsx --env-file=.env.local scripts/set-feature.ts <subdomain> <feature> on|off
 *   npx tsx --env-file=.env.local scripts/set-feature.ts <subdomain>            (list)
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { FEATURES, FEATURE_KEYS, isFeatureKey, loadSiteFeatures } from '../lib/backend/features';

async function main(): Promise<void> {
  const [subdomain, feature, state] = process.argv.slice(2);
  if (subdomain === undefined) throw new Error('usage: set-feature.ts <subdomain> [<feature> on|off]');
  const db = createClient<Database>(process.env['SUPABASE_URL']!, process.env['SUPABASE_SERVICE_ROLE_KEY']!);

  const { data: tenant, error } = await db.from('tenants').select('id').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (tenant === null) throw new Error(`No site "${subdomain}"`);

  if (feature !== undefined) {
    if (!isFeatureKey(feature)) throw new Error(`Unknown feature "${feature}". Known: ${FEATURE_KEYS.join(', ')}`);
    if (state !== 'on' && state !== 'off') throw new Error('state must be on or off');
    const { error: upErr } = await db
      .from('tenant_features')
      .upsert({ tenant_id: tenant.id, feature_key: feature, enabled: state === 'on' });
    if (upErr !== null) throw new Error(upErr.message);
  }

  const on = await loadSiteFeatures(db, tenant.id);
  for (const key of FEATURE_KEYS) console.log(`${on.has(key) ? 'ON ' : 'off'}  ${key} — ${FEATURES[key].description}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 2: Try it read-only**

Run: `npx tsx --env-file=.env.local scripts/set-feature.ts classic-loafs`
Expected: four lines — `catalog` and `custom_domain_panel` ON, `video` and `digital_products` off.

- [ ] **Step 3: Commit**

```bash
git add scripts/set-feature.ts
git commit -m "feat(scripts): set-feature — flip a site's feature switches"
```

---

### Task 4: App-host URL and backend paths

**Files:**
- Create: `lib/backend/app-url.ts`, `lib/backend/backend-paths.ts`
- Test: `lib/backend/app-url.test.ts`, `lib/backend/backend-paths.test.ts`

- [ ] **Step 1: Write the failing tests**

`lib/backend/app-url.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { appOrigin } from './app-url';

describe('appOrigin', () => {
  it('puts app. in front of the site host', () => {
    expect(appOrigin('https://bohdiai.com')).toBe('https://app.bohdiai.com');
    expect(appOrigin('https://bohdiai.com/')).toBe('https://app.bohdiai.com');
  });
  it('keeps the port and scheme for local dev', () => {
    expect(appOrigin('http://localhost:3000')).toBe('http://app.localhost:3000');
  });
  it('does not double the prefix', () => {
    expect(appOrigin('https://app.bohdiai.com')).toBe('https://app.bohdiai.com');
  });
});
```

`lib/backend/backend-paths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isBackendPath, backendRedirect } from './backend-paths';

describe('isBackendPath', () => {
  it.each(['/signin', '/forgot-password', '/auth/confirm', '/auth/error', '/manage', '/manage/set-password'])('%s is a backend path', (p) => {
    expect(isBackendPath(p)).toBe(true);
  });
  it.each(['/', '/shop', '/manager', '/signing', '/authors', '/dashboard'])('%s is not', (p) => {
    expect(isBackendPath(p)).toBe(false);
  });
});

describe('backendRedirect', () => {
  const url = (s: string) => new URL(s);
  it('sends a backend path on a shop host to the app host, keeping path and query', () => {
    expect(backendRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/signin?next=%2Fmanage'))).toBe(
      'https://app.bohdiai.com/signin?next=%2Fmanage',
    );
  });
  it('does the same from the marketing apex', () => {
    expect(backendRedirect('bohdiai.com', url('https://bohdiai.com/manage'))).toBe('https://app.bohdiai.com/manage');
  });
  it('works for local dev hosts', () => {
    expect(backendRedirect('classic-loafs.localhost:3000', url('http://classic-loafs.localhost:3000/signin'))).toBe(
      'http://app.localhost:3000/signin',
    );
  });
  it('leaves the app host alone', () => {
    expect(backendRedirect('app.bohdiai.com', url('https://app.bohdiai.com/signin'))).toBeNull();
  });
  it('leaves non-backend paths alone', () => {
    expect(backendRedirect('classic-loafs.bohdiai.com', url('https://classic-loafs.bohdiai.com/shop'))).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/backend/app-url.test.ts lib/backend/backend-paths.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`lib/backend/app-url.ts`:

```ts
/** The backend's origin (app.<site host>) from the site's own origin. */
export function appOrigin(siteUrl: string): string {
  const u = new URL(siteUrl);
  if (!u.hostname.startsWith('app.')) u.hostname = `app.${u.hostname}`;
  return u.origin;
}
```

`lib/backend/backend-paths.ts`:

```ts
/**
 * Sign-in, password setup and the backend are served only on the app host
 * (app.bohdiai.com / app.localhost). From any other host — a shop, a custom
 * domain later, the marketing apex — those paths redirect there, so the session
 * cookie only ever lives on the app host (spec §1).
 */
import { isAppHost } from '@/lib/proxy-security';

const EXACT = ['/signin', '/forgot-password', '/manage'] as const;
const PREFIXES = ['/auth/', '/manage/'] as const;

export function isBackendPath(pathname: string): boolean {
  return (EXACT as readonly string[]).includes(pathname) || PREFIXES.some((p) => pathname.startsWith(p));
}

/** Where to send a backend path requested on the wrong host, or null to let it through. */
export function backendRedirect(hostname: string, url: URL): string | null {
  if (!isBackendPath(url.pathname) || isAppHost(hostname)) return null;
  const [host = '', port] = hostname.split(':');
  const local = host === 'localhost' || host.endsWith('.localhost');
  const apex = local ? 'localhost' : host.split('.').slice(-2).join('.');
  const origin = local ? `http://app.${apex}${port !== undefined ? `:${port}` : ''}` : `https://app.${apex}`;
  return `${origin}${url.pathname}${url.search}`;
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run lib/backend/app-url.test.ts lib/backend/backend-paths.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/app-url.ts lib/backend/app-url.test.ts lib/backend/backend-paths.ts lib/backend/backend-paths.test.ts
git commit -m "feat(backend): app-host origin and backend path routing rules"
```

---

### Task 5: Middleware — backend on the app host only; sign-in back on

**Files:**
- Modify: `lib/proxy-security.ts` (dormant list; `isAppSurfacePath` retired)
- Modify: `lib/proxy-security.test.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Update the dormant-list tests first**

In `lib/proxy-security.test.ts`, change the `isDormantPath` cases so `/signin` and `/auth/...` are no longer dormant and `/dashboard`, `/make-it-yours`, `/onboarding` still are:

```ts
describe('isDormantPath', () => {
  it.each(['/onboarding', '/api/onboarding/build', '/make-it-yours', '/dashboard', '/dashboard/website', '/api/library/ingest', '/archetype-test'])(
    '%s stays switched off',
    (p) => expect(isDormantPath(p)).toBe(true),
  );
  it.each(['/signin', '/auth/confirm', '/auth/callback', '/manage', '/forgot-password'])('%s is live again', (p) => {
    expect(isDormantPath(p)).toBe(false);
  });
});
```

Delete every `isAppSurfacePath` test (the function is removed in Step 3).

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/proxy-security.test.ts`
Expected: FAIL — `/signin` and `/auth/confirm` still report dormant.

- [ ] **Step 3: Change `lib/proxy-security.ts`**

Remove `'/signin'` and `'/auth'` from `DORMANT_PREFIXES`, delete `isAppSurfacePath` and its comment, and update the `DORMANT_PREFIXES` comment's list of surfaces to "onboarding, the Make It Yours walk, the old maker dashboard/editor, Cowork's library upload, and the archetype test pages". Update `isAppHost`'s comment: "The backend lives under `/manage/*`".

- [ ] **Step 4: Change `middleware.ts`**

Replace the import of `isAppSurfacePath` with `backendRedirect` and `isBackendPath` from `@/lib/backend/backend-paths`. Directly after the dormant-path check, add:

```ts
  // Sign-in, password setup and the backend live only on the app host; every
  // other host sends those paths there (spec §1 — the session cookie stays on
  // app.bohdiai.com).
  const toApp = backendRedirect(hostname, request.nextUrl);
  if (toApp !== null) return NextResponse.redirect(toApp, 307);
```

Change the bare-app-root redirect's destination from `'/dashboard'` to `'/manage'` and its comment to "The backend lives on app.bohdiai.com under /manage/*". Replace the rewrite skip line with:

```ts
  const skipRewrite = originalPath.startsWith('/api/') || isBackendPath(originalPath);
```

and delete the comment paragraph about a maker signing in "on their own site".

- [ ] **Step 5: Run the proxy tests and typecheck**

Run: `npx vitest run lib/proxy-security.test.ts lib/backend && npm run typecheck`
Expected: PASS; no type errors (any other importer of `isAppSurfacePath` shows up here — there should be none outside the files above).

- [ ] **Step 6: Commit**

```bash
git add lib/proxy-security.ts lib/proxy-security.test.ts middleware.ts
git commit -m "feat(backend): sign-in back on, served only on the app host"
```

---

### Task 6: Rate limit for sign-in and reset

**Files:**
- Modify: `lib/forms/rate-limit.ts` (add form names)
- Create: `lib/backend/action-limit.ts`
- Test: `lib/backend/action-limit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'cf-connecting-ip': '203.0.113.9' }) }));

import { allowAction } from './action-limit';

function limiter(success: boolean): RateLimit {
  return { limit: vi.fn(async () => ({ success })) } as unknown as RateLimit;
}

describe('allowAction', () => {
  it('keys the limiter by action and visitor', async () => {
    const l = limiter(true);
    expect(await allowAction('signin', l)).toBe('allowed');
    expect(l.limit).toHaveBeenCalledWith({ key: 'signin:203.0.113.9' });
  });
  it('reports limited', async () => {
    expect(await allowAction('reset', limiter(false))).toBe('limited');
  });
  it('fails closed when the limiter throws', async () => {
    const broken = { limit: vi.fn(async () => { throw new Error('down'); }) } as unknown as RateLimit;
    expect(await allowAction('signin', broken)).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/action-limit.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

In `lib/forms/rate-limit.ts` change the type to:

```ts
export type FormName = 'estimate' | 'contact' | 'inquiry' | 'notify-interest' | 'signin' | 'reset';
```

`lib/backend/action-limit.ts`:

```ts
/**
 * FORM_LIMITER for server actions, which have no Request object. Same key shape
 * and same fail-closed rule as lib/forms/rate-limit.ts.
 */
import { headers } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { logger } from '@/lib/logger';
import type { FormAllowance, FormName } from '@/lib/forms/rate-limit';

export async function allowAction(action: Extract<FormName, 'signin' | 'reset'>, limiter?: RateLimit): Promise<FormAllowance> {
  try {
    const binding = limiter ?? (await getCloudflareContext({ async: true })).env.FORM_LIMITER;
    if (binding === undefined) throw new Error('FORM_LIMITER binding missing — see "ratelimits" in wrangler.jsonc');
    const ip = (await headers()).get('cf-connecting-ip')?.trim() || 'unknown';
    const { success } = await binding.limit({ key: `${action}:${ip}` });
    return success ? 'allowed' : 'limited';
  } catch (err) {
    logger.error('action rate limiter unavailable', { action, error: err instanceof Error ? err.message : String(err) });
    return 'unavailable';
  }
}

export const ACTION_LIMITED = 'Too many tries. Please wait a minute and try again.';
export const ACTION_UNAVAILABLE = 'Sign-in is unavailable for a moment. Please try again in a few minutes.';
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/action-limit.test.ts lib/forms`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/forms/rate-limit.ts lib/backend/action-limit.ts lib/backend/action-limit.test.ts
git commit -m "feat(backend): rate limit for sign-in and reset actions (fails closed)"
```

---

### Task 7: Invite and reset links + emails

**Files:**
- Create: `lib/backend/auth-links.ts`
- Test: `lib/backend/auth-links.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { confirmUrl, composeAuthEmail, sendAuthLink, type AuthLinkKind } from './auth-links';

describe('confirmUrl', () => {
  it('points at /auth/confirm on the app host with the token and kind', () => {
    const u = new URL(confirmUrl('https://app.bohdiai.com', 'abc123', 'invite'));
    expect(u.origin + u.pathname).toBe('https://app.bohdiai.com/auth/confirm');
    expect(u.searchParams.get('token_hash')).toBe('abc123');
    expect(u.searchParams.get('type')).toBe('invite');
  });
});

describe('composeAuthEmail', () => {
  it.each<[AuthLinkKind, RegExp]>([
    ['invite', /set your password/i],
    ['recovery', /reset your password/i],
  ])('%s email names the site and carries the link', (kind, words) => {
    const e = composeAuthEmail({ kind, siteName: 'Classic Loafs', link: 'https://app.bohdiai.com/auth/confirm?x=1' });
    expect(e.subject).toContain('Classic Loafs');
    expect(e.text).toMatch(words);
    expect(e.text).toContain('https://app.bohdiai.com/auth/confirm?x=1');
    expect(e.html).toContain('href="https://app.bohdiai.com/auth/confirm?x=1"');
  });

  it('escapes the site name in html', () => {
    const e = composeAuthEmail({ kind: 'invite', siteName: '<b>X</b>', link: 'https://a/b' });
    expect(e.html).not.toContain('<b>X</b>');
  });
});

describe('sendAuthLink', () => {
  it('generates the link, then sends it to the email', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 'tok' } }, error: null }));
    const send = vi.fn(async () => ({ error: null }));
    await sendAuthLink({
      kind: 'invite',
      email: 'maker@example.com',
      siteName: 'Classic Loafs',
      appOrigin: 'https://app.bohdiai.com',
      generateLink,
      send,
    });
    expect(generateLink).toHaveBeenCalledWith({ type: 'invite', email: 'maker@example.com' });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'maker@example.com' }));
  });

  it('throws when the link cannot be made', async () => {
    const generateLink = vi.fn(async () => ({ data: null, error: { message: 'nope' } }));
    await expect(
      sendAuthLink({ kind: 'recovery', email: 'a@b.co', siteName: 'S', appOrigin: 'https://app.x', generateLink, send: vi.fn() }),
    ).rejects.toThrow('Could not create the sign-in link: nope');
  });

  it('throws when the email does not send', async () => {
    const generateLink = vi.fn(async () => ({ data: { properties: { hashed_token: 't' } }, error: null }));
    const send = vi.fn(async () => ({ error: { message: 'resend down' } }));
    await expect(
      sendAuthLink({ kind: 'invite', email: 'a@b.co', siteName: 'S', appOrigin: 'https://app.x', generateLink, send }),
    ).rejects.toThrow('Could not send the email: resend down');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/auth-links.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/**
 * Invite and password-reset emails for site owners (spec §1). The link carries a
 * Supabase hashed token to /auth/confirm on the app host, which verifies it and
 * starts the session. Setting a password only ever happens through such a link.
 * Dependencies are injected so this is testable without Supabase or Resend.
 */
export type AuthLinkKind = 'invite' | 'recovery';

export function confirmUrl(appOrigin: string, hashedToken: string, kind: AuthLinkKind): string {
  const u = new URL('/auth/confirm', appOrigin);
  u.searchParams.set('token_hash', hashedToken);
  u.searchParams.set('type', kind);
  return u.toString();
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function composeAuthEmail(input: { kind: AuthLinkKind; siteName: string; link: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const invite = input.kind === 'invite';
  const subject = invite ? `Your ${input.siteName} backend is ready` : `Reset your ${input.siteName} password`;
  const lead = invite
    ? `Your backend for ${input.siteName} is ready. Use the link below to set your password and sign in.`
    : `Someone asked to reset the password for ${input.siteName}. If it was you, use the link below to reset your password. If not, you can ignore this email.`;
  const action = invite ? 'Set your password' : 'Reset your password';
  const text = `${lead}\n\n${action}: ${input.link}\n\nThe link works once and expires in 24 hours.\n\n— BohdiAI`;
  const html = `<p>${escapeHtml(lead)}</p><p><a href="${escapeHtml(input.link)}">${action}</a></p><p>The link works once and expires in 24 hours.</p><p>— BohdiAI</p>`;
  return { subject, text, html };
}

type GenerateLink = (args: { type: AuthLinkKind; email: string }) => Promise<{
  data: { properties: { hashed_token: string } } | null;
  error: { message: string } | null;
}>;
type Send = (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;

export async function sendAuthLink(input: {
  kind: AuthLinkKind;
  email: string;
  siteName: string;
  appOrigin: string;
  generateLink: GenerateLink;
  send: Send;
}): Promise<void> {
  const { data, error } = await input.generateLink({ type: input.kind, email: input.email });
  if (error !== null || data === null) throw new Error(`Could not create the sign-in link: ${error?.message ?? 'no link'}`);
  const link = confirmUrl(input.appOrigin, data.properties.hashed_token, input.kind);
  const mail = composeAuthEmail({ kind: input.kind, siteName: input.siteName, link });
  const sent = await input.send({ to: input.email, ...mail });
  if (sent.error !== null) throw new Error(`Could not send the email: ${sent.error.message}`);
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/auth-links.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/auth-links.ts lib/backend/auth-links.test.ts
git commit -m "feat(backend): invite and reset links + emails"
```

---

### Task 8: `/auth/confirm` route

**Files:**
- Create: `app/auth/confirm/route.ts`
- Test: `app/auth/confirm/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyOtp = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from './route';

const req = (qs: string) => new Request(`https://app.bohdiai.com/auth/confirm${qs}`);

describe('GET /auth/confirm', () => {
  beforeEach(() => verifyOtp.mockReset());

  it('verifies an invite and goes to set-password', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req('?token_hash=t&type=invite'));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 't', type: 'invite' });
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });

  it('verifies a recovery and goes to set-password', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req('?token_hash=t&type=recovery'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });

  it('sends a bad or used token to the error page', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'expired' } });
    const res = await GET(req('?token_hash=t&type=invite'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/error?reason=link');
  });

  it('refuses unknown types without calling Supabase', async () => {
    const res = await GET(req('?token_hash=t&type=signup'));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/error?reason=link');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run app/auth/confirm/route.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const KINDS = new Set(['invite', 'recovery']);

/** Verifies an emailed invite/reset token, starts the session, then asks for a password. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const fail = NextResponse.redirect(new URL('/auth/error?reason=link', url.origin));

  if (tokenHash === null || type === null || !KINDS.has(type)) return fail;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'invite' | 'recovery' });
  if (error !== null) return fail;
  return NextResponse.redirect(new URL('/manage/set-password', url.origin));
}
```

Update `app/auth/error/page.tsx` so `?reason=link` shows: "That link has expired or was already used. Ask Alex for a new invite, or use Forgot password on the sign-in page." (read the file first; keep its existing default message for other cases, and style it with the backend classes from Task 11 once they exist — until then leave styling as is).

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run app/auth/confirm/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/auth/confirm app/auth/error/page.tsx
git commit -m "feat(backend): /auth/confirm verifies invite and reset links"
```

---

### Task 9: The acting site (access rule + picker)

**Files:**
- Create: `lib/backend/current-site.ts`, `app/manage/switch-site/route.ts`
- Test: `lib/backend/current-site.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { pickSite, SITE_COOKIE } from './current-site';

const shops = [
  { tenantId: 'a', subdomain: 'alpha', businessName: 'Alpha' },
  { tenantId: 'b', subdomain: 'beta', businessName: 'Beta' },
];

describe('pickSite', () => {
  it('uses the cookie when it names a site the person administers', () => {
    expect(pickSite(shops, 'b')?.tenantId).toBe('b');
  });
  it('ignores a cookie naming someone else’s site and falls back to the first', () => {
    expect(pickSite(shops, 'zzz')?.tenantId).toBe('a');
  });
  it('falls back to the first site with no cookie', () => {
    expect(pickSite(shops, null)?.tenantId).toBe('a');
  });
  it('is null for someone who administers no site', () => {
    expect(pickSite([], 'a')).toBeNull();
  });
  it('names its cookie', () => {
    expect(SITE_COOKIE).toBe('bohdi_site');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/current-site.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`lib/backend/current-site.ts`:

```ts
/**
 * Who is signed in and which site they are acting on (spec §1). A person sees a
 * site's backend only through an active admin membership; the acting site comes
 * from a cookie set by the picker and is re-checked against their memberships on
 * every request — the browser never chooses a tenant id on its own authority.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth/session';
import { getUserShops, type ShopSummary } from '@/lib/auth/membership';

export const SITE_COOKIE = 'bohdi_site';

export function pickSite(shops: readonly ShopSummary[], cookieValue: string | null): ShopSummary | null {
  return shops.find((s) => s.tenantId === cookieValue) ?? shops[0] ?? null;
}

export type ActingSite = { user: User; site: ShopSummary; sites: ShopSummary[] };

/** The signed-in admin and their acting site; redirects to /signin, or to the
 *  no-site notice when they administer nothing. Call at the top of every
 *  backend page and every backend server action. */
export async function requireActingSite(): Promise<ActingSite> {
  const user = await requireUser();
  const sites = await getUserShops(user.id);
  const site = pickSite(sites, (await cookies()).get(SITE_COOKIE)?.value ?? null);
  if (site === null) redirect('/auth/error?reason=nosite');
  return { user, site, sites };
}
```

`app/manage/switch-site/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { getUserShops } from '@/lib/auth/membership';
import { SITE_COOKIE } from '@/lib/backend/current-site';

/** Picker: POST tenantId → set the acting site if the person administers it. */
export async function POST(request: Request): Promise<Response> {
  const user = await requireUser();
  const form = await request.formData();
  const tenantId = String(form.get('tenantId') ?? '');
  const sites = await getUserShops(user.id);
  const home = NextResponse.redirect(new URL('/manage', request.url), 303);
  if (sites.some((s) => s.tenantId === tenantId)) {
    home.cookies.set(SITE_COOKIE, tenantId, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  }
  return home;
}
```

Add `?reason=nosite` to `app/auth/error/page.tsx`: "This account isn't linked to a site yet. Ask Alex to finish setting it up."

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/current-site.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/current-site.ts lib/backend/current-site.test.ts app/manage/switch-site app/auth/error/page.tsx
git commit -m "feat(backend): acting site from memberships, picker cookie re-checked every request"
```

---

### Task 10: Auth server actions

**Files:**
- Create: `lib/backend/auth-actions.ts`
- Test: `lib/backend/auth-actions.test.ts`
- Modify: `lib/auth/actions.ts` (remove `signUpMaker`; keep `signInMaker` export only if still imported elsewhere — grep first; the new actions supersede it)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signInWithPassword = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const allowAction = vi.fn();
const sendAuthLink = vi.fn();
const getUserShops = vi.fn();
const findUserByEmail = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithPassword, updateUser, signOut, getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) } }),
}));
vi.mock('./action-limit', async (orig) => ({ ...(await orig<typeof import('./action-limit')>()), allowAction }));
vi.mock('./auth-links', () => ({ sendAuthLink }));
vi.mock('@/lib/auth/membership', () => ({ getUserShops }));
vi.mock('./user-lookup', () => ({ findUserByEmail }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((p: string) => { throw new Error(`REDIRECT ${p}`); }) }));

import { signIn, requestPasswordReset, setPassword, RESET_SENT } from './auth-actions';

beforeEach(() => {
  vi.clearAllMocks();
  allowAction.mockResolvedValue('allowed');
});

describe('signIn', () => {
  it('signs in and goes to the backend', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn({ email: ' Maker@Example.com ', password: 'longenough' })).rejects.toThrow('REDIRECT /manage');
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'maker@example.com', password: 'longenough' });
  });
  it('gives one message for any wrong email or password', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    expect(await signIn({ email: 'a@b.co', password: 'longenough' })).toEqual({ ok: false, error: 'That email and password don’t match.' });
  });
  it('is turned away when rate limited', async () => {
    allowAction.mockResolvedValue('limited');
    expect(await signIn({ email: 'a@b.co', password: 'x' })).toEqual({ ok: false, error: 'Too many tries. Please wait a minute and try again.' });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it('asks for an email', async () => {
    expect(await signIn({ email: ' ', password: 'longenough' })).toEqual({ ok: false, error: 'Enter your email address.' });
  });
});

describe('requestPasswordReset', () => {
  it('sends a reset only to someone who administers a site, and always answers the same', async () => {
    findUserByEmail.mockResolvedValue({ id: 'u1' });
    getUserShops.mockResolvedValue([{ tenantId: 't', subdomain: 's', businessName: 'Classic Loafs' }]);
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({ ok: true, message: RESET_SENT });
    expect(sendAuthLink).toHaveBeenCalledWith(expect.objectContaining({ kind: 'recovery', email: 'maker@example.com', siteName: 'Classic Loafs' }));
  });
  it('sends nothing for an unknown email but answers the same', async () => {
    findUserByEmail.mockResolvedValue(null);
    expect(await requestPasswordReset({ email: 'nobody@example.com' })).toEqual({ ok: true, message: RESET_SENT });
    expect(sendAuthLink).not.toHaveBeenCalled();
  });
  it('shows a real error when sending fails', async () => {
    findUserByEmail.mockResolvedValue({ id: 'u1' });
    getUserShops.mockResolvedValue([{ tenantId: 't', subdomain: 's', businessName: 'S' }]);
    sendAuthLink.mockRejectedValue(new Error('Could not send the email: down'));
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({
      ok: false,
      error: 'The reset email didn’t send. Please try again in a few minutes.',
    });
  });
});

describe('setPassword', () => {
  it('refuses short passwords', async () => {
    expect(await setPassword({ password: 'short', confirm: 'short' })).toEqual({ ok: false, error: 'Use at least 10 characters.' });
  });
  it('refuses a mismatch', async () => {
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough2' })).toEqual({ ok: false, error: 'The two passwords don’t match.' });
  });
  it('saves and goes to the backend', async () => {
    updateUser.mockResolvedValue({ error: null });
    await expect(setPassword({ password: 'longenough1', confirm: 'longenough1' })).rejects.toThrow('REDIRECT /manage');
    expect(updateUser).toHaveBeenCalledWith({ password: 'longenough1' });
  });
  it('shows the error when saving fails', async () => {
    updateUser.mockResolvedValue({ error: { message: 'weak' } });
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: 'Your password wasn’t saved: weak' });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/auth-actions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/backend/user-lookup.ts`:

```ts
import { supabaseAdmin } from '@/lib/supabase';

/** The auth user with this email, or null. Service role; server only. */
export async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin().rpc('auth_user_id_by_email', { p_email: email });
  if (error !== null) throw new Error(`Could not look up the account: ${error.message}`);
  return typeof data === 'string' ? { id: data } : null;
}
```

Add to the Task 1 migration file a new migration `supabase/migrations/20260930000002_auth_user_id_by_email.sql` (apply with `node scripts/db-migrate.mjs`, then `npm run gen:types`):

```sql
-- Service-role helper: the auth user id for an email (password reset needs it without
-- listing every user). Not callable by anon/authenticated.
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = auth, public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
```

`lib/backend/auth-actions.ts`:

```ts
'use server';

/**
 * Site-owner auth actions (spec §1). No public sign-up. Sign-in and reset are
 * rate-limited and fail closed; reset never reveals whether an email has an
 * account; a password is only set by someone holding a session from an emailed link.
 */
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getUserShops } from '@/lib/auth/membership';
import { allowAction, ACTION_LIMITED, ACTION_UNAVAILABLE } from './action-limit';
import { sendAuthLink } from './auth-links';
import { findUserByEmail } from './user-lookup';
import { appOrigin } from './app-url';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export const RESET_SENT = 'If that email belongs to a site owner, a reset link is on its way. Check your inbox.';
const MIN_PASSWORD = 10;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

async function gate(action: 'signin' | 'reset'): Promise<ActionResult | null> {
  const allowance = await allowAction(action);
  if (allowance === 'allowed') return null;
  return { ok: false, error: allowance === 'limited' ? ACTION_LIMITED : ACTION_UNAVAILABLE };
}

export async function signIn(input: { email: string; password: string }): Promise<ActionResult> {
  const email = normalizeEmail(input.email);
  if (email === '') return { ok: false, error: 'Enter your email address.' };
  const turned = await gate('signin');
  if (turned !== null) return turned;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error !== null) return { ok: false, error: 'That email and password don’t match.' };
  redirect('/manage');
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/signin');
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const email = normalizeEmail(input.email);
  if (email === '') return { ok: false, error: 'Enter your email address.' };
  const turned = await gate('reset');
  if (turned !== null) return turned;

  try {
    const user = await findUserByEmail(email);
    const sites = user === null ? [] : await getUserShops(user.id);
    const first = sites[0];
    if (first !== undefined) {
      await sendAuthLink({
        kind: 'recovery',
        email,
        siteName: first.businessName,
        appOrigin: appOrigin(serverEnv().SITE_URL),
        generateLink: async ({ type, email: e }) => {
          const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type, email: e });
          return { data: data?.properties ? { properties: { hashed_token: data.properties.hashed_token } } : null, error };
        },
        send: async (msg) => {
          const { error } = await resend().emails.send({ from: fromEmail(), ...msg });
          return { error: error === null ? null : { message: error.message } };
        },
      });
    }
    return { ok: true, message: RESET_SENT };
  } catch (err) {
    logger.error('password reset failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The reset email didn’t send. Please try again in a few minutes.' };
  }
}

export async function setPassword(input: { password: string; confirm: string }): Promise<ActionResult> {
  if (input.password.length < MIN_PASSWORD) return { ok: false, error: `Use at least ${MIN_PASSWORD} characters.` };
  if (input.password !== input.confirm) return { ok: false, error: 'The two passwords don’t match.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error !== null) return { ok: false, error: `Your password wasn’t saved: ${error.message}` };
  redirect('/manage');
}
```

Note for `generateLink` with `type: 'recovery'`/`'invite'`: check the installed `@supabase/supabase-js` types (`node_modules/@supabase/auth-js/dist/module/lib/types.d.ts`, `GenerateLinkParams`) and match them exactly; `properties.hashed_token` is the field this plan relies on.

Remove `signUpMaker` from `lib/auth/actions.ts` and its tests (`grep -rn "signUpMaker" app lib components` must return nothing after). Leave the rest of that file for the dormant onboarding code.

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/auth-actions.test.ts lib/auth && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/auth-actions.ts lib/backend/auth-actions.test.ts lib/backend/user-lookup.ts supabase/migrations/20260930000002_auth_user_id_by_email.sql lib/database.types.ts lib/auth
git commit -m "feat(backend): sign-in, reset and set-password actions; public sign-up removed"
```

---

### Task 11: The Penny-style look (CSS + fonts)

**Files:**
- Create: `app/manage/backend.css`, `app/manage/fonts.ts`

- [ ] **Step 1: Write the fonts module**

```ts
import { IBM_Plex_Sans } from 'next/font/google';

/** Penny's body face. Cormorant Garamond (display) is already loaded in app/layout.tsx as --font-serif. */
export const plex = IBM_Plex_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-plex', weight: ['400', '500', '600'] });
```

- [ ] **Step 2: Write the stylesheet**

Every rule is scoped under `.bk` so nothing leaks to shops or bohdiai.com. Colours are Penny's (`src/styles.css` in her project), converted to the same oklch values.

```css
/* Maker backend — Penny's admin look (spec §2a). Scoped to .bk. */
.bk {
  --bk-paper: oklch(0.928 0.022 67);
  --bk-paper-2: oklch(0.953 0.017 65);
  --bk-ink: oklch(0.205 0.019 52);
  --bk-ink-60: oklch(0.205 0.019 52 / 60%);
  --bk-ink-15: oklch(0.205 0.019 52 / 15%);
  --bk-oxblood: oklch(0.356 0.066 40);
  --bk-walnut-deep: oklch(0.22 0.03 50);
  --bk-brass: oklch(0.72 0.08 75);
  --bk-danger: oklch(0.51 0.18 27);
  --bk-display: var(--font-serif), 'Cormorant Garamond', Georgia, serif;
  --bk-sans: var(--font-plex), 'IBM Plex Sans', system-ui, sans-serif;
  min-height: 100vh;
  background: var(--bk-paper);
  color: var(--bk-ink);
  font-family: var(--bk-sans);
  -webkit-font-smoothing: antialiased;
}
.bk-frame { display: flex; min-height: 100vh; }
.bk-side {
  position: fixed; inset: 0 auto 0 0; z-index: 40; width: 16rem;
  background: var(--bk-walnut-deep); color: var(--bk-paper);
  transform: translateX(-100%); transition: transform 200ms;
  display: flex; flex-direction: column;
}
.bk-side[data-open='true'] { transform: translateX(0); }
@media (min-width: 1024px) {
  .bk-side { position: sticky; top: 0; height: 100vh; transform: none; flex-shrink: 0; }
  .bk-menu-btn, .bk-side-close, .bk-backdrop { display: none; }
}
.bk-backdrop { position: fixed; inset: 0; z-index: 30; background: oklch(0.205 0.019 52 / 50%); border: 0; }
.bk-brand { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid oklch(0.928 0.022 67 / 10%); }
.bk-brand-name { font-family: var(--bk-display); font-size: 1.125rem; font-weight: 600; font-style: italic; line-height: 1.2; color: var(--bk-paper); text-decoration: none; }
.bk-brand-sub { color: var(--bk-brass); }
.bk-nav { flex: 1; overflow-y: auto; padding: 1rem 0.75rem; }
.bk-nav-section { margin-bottom: 1.5rem; }
.bk-nav-label { margin: 0 0 0.25rem; padding: 0 0.75rem; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25em; color: oklch(0.72 0.08 75 / 70%); }
.bk-nav-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.bk-nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 2px; font-size: 0.875rem; color: oklch(0.928 0.022 67 / 80%); text-decoration: none; }
.bk-nav-link:hover { background: oklch(0.928 0.022 67 / 5%); color: var(--bk-paper); }
.bk-nav-link[aria-current='page'] { background: oklch(0.356 0.066 40 / 90%); color: var(--bk-paper); }
.bk-user { border-top: 1px solid oklch(0.928 0.022 67 / 10%); padding: 1rem 0.75rem; }
.bk-user-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
.bk-avatar { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; background: oklch(0.72 0.08 75 / 20%); color: var(--bk-brass); font-family: var(--bk-display); font-style: italic; }
.bk-user-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 500; margin: 0; }
.bk-user-role { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: oklch(0.928 0.022 67 / 50%); margin: 0; }
.bk-user-btn { width: 100%; margin-top: 0.5rem; padding: 0.375rem 0.75rem; background: none; border: 0; border-radius: 2px; font: inherit; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: oklch(0.928 0.022 67 / 70%); cursor: pointer; }
.bk-user-btn:hover { background: oklch(0.928 0.022 67 / 5%); color: var(--bk-paper); }
.bk-main { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.bk-top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 0.75rem; height: 3.5rem; padding: 0 1.5rem; background: var(--bk-paper-2); border-bottom: 1px solid var(--bk-ink-15); }
.bk-menu-btn, .bk-side-close { background: none; border: 0; padding: 0.375rem; color: var(--bk-ink-60); cursor: pointer; font: inherit; }
.bk-side-close { color: oklch(0.928 0.022 67 / 60%); }
.bk-kicker { margin: 0; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.25em; color: oklch(0.205 0.019 52 / 50%); }
.bk-top-link { margin-left: auto; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: var(--bk-ink-60); text-decoration: none; }
.bk-top-link:hover { color: var(--bk-oxblood); }
.bk-head { padding: 1.5rem 2rem; background: var(--bk-paper-2); border-bottom: 1px solid oklch(0.205 0.019 52 / 10%); display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 1rem; }
.bk-title { margin: 0; font-family: var(--bk-display); font-size: 1.875rem; font-weight: 600; }
.bk-content { flex: 1; padding: 2rem; }
.bk-tiles { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); }
.bk-tile { border: 1px solid var(--bk-ink-15); background: var(--bk-paper-2); padding: 1rem; }
.bk-tile-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: var(--bk-ink-60); }
.bk-tile-value { margin: 0.25rem 0 0; font-family: var(--bk-display); font-size: 1.875rem; font-weight: 600; }
.bk-tile-note { margin: 0.25rem 0 0; font-size: 11px; line-height: 1.35; color: oklch(0.205 0.019 52 / 50%); }
.bk-attention { margin-bottom: 1.5rem; border: 1px solid var(--bk-oxblood); background: var(--bk-paper-2); padding: 1rem; }
.bk-attention-list { margin: 0.5rem 0 0; padding-left: 1.1rem; }
.bk-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.1rem; border: 0; border-radius: 2px; background: var(--bk-oxblood); color: var(--bk-paper-2); font: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-decoration: none; }
.bk-btn:disabled { opacity: 0.5; cursor: wait; }
/* Auth pages */
.bk-auth { display: grid; place-items: center; min-height: 100vh; padding: 1rem; }
.bk-card { width: 100%; max-width: 26rem; background: var(--bk-paper-2); border: 1px solid var(--bk-ink-15); padding: 2rem; }
.bk-field { display: grid; gap: 0.35rem; margin-bottom: 1rem; }
.bk-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: var(--bk-ink-60); }
.bk-input { width: 100%; padding: 0.65rem 0.8rem; border: 1px solid oklch(0.176 0.011 70 / 40%); border-radius: 2px; background: var(--bk-paper); color: var(--bk-ink); font: inherit; }
.bk-input:focus { outline: 2px solid var(--bk-oxblood); outline-offset: 1px; }
.bk-error { color: var(--bk-danger); font-size: 0.875rem; }
.bk-note { color: var(--bk-ink-60); font-size: 0.875rem; }
.bk-link { color: var(--bk-oxblood); }
```

- [ ] **Step 3: Commit**

```bash
git add app/manage/backend.css app/manage/fonts.ts
git commit -m "feat(backend): Penny's admin look as scoped CSS"
```

---

### Task 12: Shell modules — what features add to the shell

**Files:**
- Create: `lib/backend/modules.ts`
- Test: `lib/backend/modules.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { navFor, type BackendModule } from './modules';
import type { FeatureKey } from './features';

const modules: BackendModule[] = [
  { feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
  { feature: 'catalog', section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
  { feature: 'video', section: 'Catalog', items: [{ label: 'Videos', href: '/manage/videos' }] },
];

describe('navFor', () => {
  it('always includes modules with no feature, and only switched-on features otherwise', () => {
    const on = new Set<FeatureKey>(['catalog']);
    expect(navFor(modules, on)).toEqual([
      { section: 'Site', items: [{ label: 'Home', href: '/manage' }] },
      { section: 'Catalog', items: [{ label: 'Products', href: '/manage/products' }] },
    ]);
  });
  it('merges items of the same section in module order', () => {
    const on = new Set<FeatureKey>(['catalog', 'video']);
    expect(navFor(modules, on)[1]?.items.map((i) => i.label)).toEqual(['Products', 'Videos']);
  });
  it('drops empty sections', () => {
    expect(navFor(modules, new Set()).map((s) => s.section)).toEqual(['Site']);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run lib/backend/modules.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
/**
 * What each feature contributes to the backend shell (spec §2: nothing assumes a
 * shop). The menu is assembled from the modules whose feature is on; modules with
 * feature null are always present. Later plans append their modules to
 * BACKEND_MODULES (1b adds catalog's Products and Collections; 1d the domain page).
 */
import type { FeatureKey } from './features';

export type NavItem = { label: string; href: string };
export type BackendModule = { feature: FeatureKey | null; section: string; items: NavItem[] };
export type NavSection = { section: string; items: NavItem[] };

export const BACKEND_MODULES: BackendModule[] = [{ feature: null, section: 'Site', items: [{ label: 'Home', href: '/manage' }] }];

export function navFor(modules: readonly BackendModule[], on: ReadonlySet<FeatureKey>): NavSection[] {
  const sections = new Map<string, NavItem[]>();
  for (const m of modules) {
    if (m.feature !== null && !on.has(m.feature)) continue;
    sections.set(m.section, [...(sections.get(m.section) ?? []), ...m.items]);
  }
  return [...sections].filter(([, items]) => items.length > 0).map(([section, items]) => ({ section, items }));
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run lib/backend/modules.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/modules.ts lib/backend/modules.test.ts
git commit -m "feat(backend): shell menu assembled from switched-on features"
```

---

### Task 13: The shell layout

**Files:**
- Create: `app/manage/layout.tsx`, `app/manage/_components/Sidebar.tsx`, `app/manage/_components/Shell.tsx`
- Test: `app/manage/_components/Sidebar.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/manage' }));
vi.mock('@/lib/backend/auth-actions', () => ({ signOut: vi.fn() }));

import { Sidebar } from './Sidebar';

const base = {
  siteName: 'Classic Loafs',
  email: 'maker@example.com',
  nav: [{ section: 'Site', items: [{ label: 'Home', href: '/manage' }] }],
  sites: [{ tenantId: 'a', subdomain: 'alpha', businessName: 'Classic Loafs' }],
  currentTenantId: 'a',
  onNavigate: () => {},
};

describe('Sidebar', () => {
  it('shows the client’s own site name, not Penny’s', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByText('Classic Loafs')).toBeInTheDocument();
    expect(screen.queryByText(/Decoupage/)).toBeNull();
  });
  it('marks the current page', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });
  it('shows a site picker only for people with more than one site', () => {
    const { rerender } = render(<Sidebar {...base} />);
    expect(screen.queryByLabelText('Switch site')).toBeNull();
    rerender(<Sidebar {...base} sites={[...base.sites, { tenantId: 'b', subdomain: 'beta', businessName: 'Beta' }]} />);
    expect(screen.getByLabelText('Switch site')).toBeInTheDocument();
  });
  it('has a sign-out button', () => {
    render(<Sidebar {...base} />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run app/manage/_components/Sidebar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`app/manage/_components/Sidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';
import { signOut } from '@/lib/backend/auth-actions';

export function Sidebar(props: {
  siteName: string;
  email: string;
  nav: NavSection[];
  sites: ShopSummary[];
  currentTenantId: string;
  onNavigate: () => void;
}): React.ReactElement {
  const pathname = usePathname();
  return (
    <>
      <div className="bk-brand">
        <Link href="/manage" className="bk-brand-name" onClick={props.onNavigate}>
          {props.siteName}
          <br />
          <span className="bk-brand-sub">Backend</span>
        </Link>
        <button type="button" className="bk-side-close" aria-label="Close menu" onClick={props.onNavigate}>
          ✕
        </button>
      </div>

      {props.sites.length > 1 && (
        <form action="/manage/switch-site" method="post" className="bk-nav-section bk-nav">
          <label className="bk-nav-label" htmlFor="bk-site">
            Switch site
          </label>
          <select id="bk-site" name="tenantId" defaultValue={props.currentTenantId} className="bk-input">
            {props.sites.map((s) => (
              <option key={s.tenantId} value={s.tenantId}>
                {s.businessName}
              </option>
            ))}
          </select>
          <button type="submit" className="bk-user-btn">
            Go
          </button>
        </form>
      )}

      <nav className="bk-nav" aria-label="Backend">
        {props.nav.map((section) => (
          <div key={section.section} className="bk-nav-section">
            <p className="bk-nav-label">{section.section}</p>
            <ul className="bk-nav-list">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="bk-nav-link"
                    aria-current={pathname === item.href ? 'page' : undefined}
                    onClick={props.onNavigate}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="bk-user">
        <div className="bk-user-row">
          <span className="bk-avatar" aria-hidden="true">
            {props.email.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="bk-user-email">{props.email}</p>
            <p className="bk-user-role">Owner</p>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="bk-user-btn">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
```

`app/manage/_components/Shell.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';

export function Shell(props: {
  siteName: string;
  siteUrl: string;
  email: string;
  nav: NavSection[];
  sites: ShopSummary[];
  currentTenantId: string;
  children: React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <div className="bk-frame">
      <aside className="bk-side" data-open={open}>
        <Sidebar
          siteName={props.siteName}
          email={props.email}
          nav={props.nav}
          sites={props.sites}
          currentTenantId={props.currentTenantId}
          onNavigate={() => setOpen(false)}
        />
      </aside>
      {open && <button type="button" aria-label="Close menu" className="bk-backdrop" onClick={() => setOpen(false)} />}
      <div className="bk-main">
        <header className="bk-top">
          <button type="button" className="bk-menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
            ☰
          </button>
          <a className="bk-top-link" href={props.siteUrl} target="_blank" rel="noopener noreferrer">
            View my site ↗
          </a>
        </header>
        {props.children}
      </div>
    </div>
  );
}
```

`app/manage/layout.tsx` (set-password renders inside it too — it needs a signed-in session, which the confirm link provides):

```tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { requireActingSite } from '@/lib/backend/current-site';
import { loadSiteFeatures } from '@/lib/backend/features';
import { BACKEND_MODULES, navFor } from '@/lib/backend/modules';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { supabaseAdmin } from '@/lib/supabase';
import { Shell } from './_components/Shell';
import { plex } from './fonts';
import './backend.css';

export const metadata: Metadata = { title: 'Backend', robots: { index: false, follow: false } };

export default async function ManageLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const { user, site, sites } = await requireActingSite();
  const on = await loadSiteFeatures(supabaseAdmin(), site.tenantId);
  const siteUrl = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  return (
    <div className={`bk ${plex.variable}`}>
      <Shell
        siteName={site.businessName}
        siteUrl={siteUrl}
        email={user.email ?? ''}
        nav={navFor(BACKEND_MODULES, on)}
        sites={sites}
        currentTenantId={site.tenantId}
      >
        {children}
      </Shell>
    </div>
  );
}
```

- [ ] **Step 4: Run to see it pass**

Run: `npx vitest run app/manage/_components/Sidebar.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add app/manage/layout.tsx app/manage/_components
git commit -m "feat(backend): Penny-style shell with feature-built menu and site picker"
```

---

### Task 14: Home screen

**Files:**
- Create: `app/manage/page.tsx`, `app/manage/_components/StatTile.tsx`, `lib/backend/home.ts`
- Test: `lib/backend/home.test.ts`, `app/manage/_components/StatTile.test.tsx`

- [ ] **Step 1: Write the failing tests**

`lib/backend/home.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { collectHome, type HomeContributor } from './home';
import type { FeatureKey } from './features';

const contributors: HomeContributor[] = [
  { feature: 'catalog', load: async () => ({ tiles: [{ label: 'Products', value: '5' }], attention: ['2 products have no photo'] }) },
  { feature: 'video', load: async () => ({ tiles: [{ label: 'Videos', value: '1' }], attention: [] }) },
  { feature: null, load: async () => ({ tiles: [], attention: ['Your domain isn’t reaching your site'] }) },
];

describe('collectHome', () => {
  it('gathers tiles and attention from switched-on and always-on contributors', async () => {
    const home = await collectHome(contributors, new Set<FeatureKey>(['catalog']), 't1');
    expect(home.tiles.map((t) => t.label)).toEqual(['Products']);
    expect(home.attention).toEqual(['2 products have no photo', 'Your domain isn’t reaching your site']);
  });
  it('turns a failing contributor into a visible notice instead of breaking the page', async () => {
    const broken: HomeContributor[] = [{ feature: null, load: async () => { throw new Error('db down'); } }];
    const home = await collectHome(broken, new Set(), 't1');
    expect(home.attention).toEqual(['Part of this page couldn’t load. Refresh to try again.']);
  });
});
```

`app/manage/_components/StatTile.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatTile } from './StatTile';

describe('StatTile', () => {
  it('shows label, value and note', () => {
    render(<StatTile label="Products" value="12" note="3 in draft" />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 in draft')).toBeInTheDocument();
  });
  it('omits the note when there is none', () => {
    const { container } = render(<StatTile label="Products" value="12" />);
    expect(container.querySelector('.bk-tile-note')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/backend/home.test.ts app/manage/_components/StatTile.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`lib/backend/home.ts`:

```ts
/**
 * The home screen is built from the site's features (spec §3): each contributor
 * adds tiles and Needs-attention lines. Later plans append to HOME_CONTRIBUTORS
 * (1b catalog counts + products needing attention; 1d the domain problem line).
 */
import { logger } from '@/lib/logger';
import type { FeatureKey } from './features';

export type Tile = { label: string; value: string; note?: string };
export type HomeData = { tiles: Tile[]; attention: string[] };
export type HomeContributor = { feature: FeatureKey | null; load: (tenantId: string) => Promise<HomeData> };

export const HOME_CONTRIBUTORS: HomeContributor[] = [];

const LOAD_FAILED = 'Part of this page couldn’t load. Refresh to try again.';

export async function collectHome(contributors: readonly HomeContributor[], on: ReadonlySet<FeatureKey>, tenantId: string): Promise<HomeData> {
  const active = contributors.filter((c) => c.feature === null || on.has(c.feature));
  const results = await Promise.all(
    active.map(async (c) => {
      try {
        return await c.load(tenantId);
      } catch (err) {
        logger.error('backend home contributor failed', { feature: c.feature, error: err instanceof Error ? err.message : String(err) });
        return { tiles: [], attention: [LOAD_FAILED] };
      }
    }),
  );
  return { tiles: results.flatMap((r) => r.tiles), attention: [...new Set(results.flatMap((r) => r.attention))] };
}
```

`app/manage/_components/StatTile.tsx`:

```tsx
/** Penny's labelled figure (admin-stat-tile.tsx), one copy for every backend page. */
export function StatTile({ label, value, note }: { label: string; value: string; note?: string }): React.ReactElement {
  return (
    <div className="bk-tile">
      <p className="bk-tile-label">{label}</p>
      <p className="bk-tile-value">{value}</p>
      {note !== undefined && <p className="bk-tile-note">{note}</p>}
    </div>
  );
}
```

`app/manage/page.tsx`:

```tsx
import { requireActingSite } from '@/lib/backend/current-site';
import { loadSiteFeatures } from '@/lib/backend/features';
import { HOME_CONTRIBUTORS, collectHome } from '@/lib/backend/home';
import { supabaseAdmin } from '@/lib/supabase';
import { StatTile } from './_components/StatTile';

export const dynamic = 'force-dynamic';

export default async function ManageHome(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await loadSiteFeatures(supabaseAdmin(), site.tenantId);
  const home = await collectHome(HOME_CONTRIBUTORS, on, site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">{site.businessName}</h1>
      </div>
      <main id="main" className="bk-content">
        {home.attention.length > 0 && (
          <section className="bk-attention" aria-labelledby="bk-attn">
            <p id="bk-attn" className="bk-kicker">Needs attention</p>
            <ul className="bk-attention-list">
              {home.attention.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}
        {home.tiles.length > 0 ? (
          <div className="bk-tiles">
            {home.tiles.map((t) => (
              <StatTile key={t.label} label={t.label} value={t.value} {...(t.note !== undefined ? { note: t.note } : {})} />
            ))}
          </div>
        ) : (
          <p className="bk-note">Your backend is ready. More tools appear here as they’re added to your site.</p>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run lib/backend/home.test.ts app/manage/_components/StatTile.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/home.ts lib/backend/home.test.ts app/manage/page.tsx app/manage/_components/StatTile.tsx app/manage/_components/StatTile.test.tsx
git commit -m "feat(backend): home screen built from feature contributors"
```

---

### Task 15: Auth pages in the backend look

**Files:**
- Modify: `app/signin/page.tsx`, `app/signin/SignInForm.tsx`
- Create: `app/forgot-password/page.tsx`, `app/forgot-password/ForgotForm.tsx`, `app/manage/set-password/page.tsx`, `app/manage/set-password/SetPasswordForm.tsx`, `app/auth-pages.css`
- Test: `app/signin/SignInForm.test.tsx`, `app/forgot-password/ForgotForm.test.tsx`, `app/manage/set-password/SetPasswordForm.test.tsx`

- [ ] **Step 1: Write the failing tests**

`app/signin/SignInForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const signIn = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ signIn }));

import SignInForm from './SignInForm';

describe('SignInForm', () => {
  it('has no Google button and no sign-up link', () => {
    render(<SignInForm />);
    expect(screen.queryByText(/google/i)).toBeNull();
    expect(screen.queryByText(/sign up|create an account/i)).toBeNull();
  });
  it('shows the error the action returns', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'That email and password don’t match.' });
    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('That email and password don’t match.'));
  });
  it('shows a message when the action itself throws', async () => {
    signIn.mockRejectedValue(new Error('network'));
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.'));
  });
  it('links to forgot password', () => {
    render(<SignInForm />);
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });
});
```

`app/forgot-password/ForgotForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const requestPasswordReset = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ requestPasswordReset }));

import ForgotForm from './ForgotForm';

describe('ForgotForm', () => {
  it('shows the same confirmation whatever the email', async () => {
    requestPasswordReset.mockResolvedValue({ ok: true, message: 'If that email belongs to a site owner, a reset link is on its way. Check your inbox.' });
    render(<ForgotForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('reset link is on its way'));
  });
  it('shows an error when sending fails', async () => {
    requestPasswordReset.mockResolvedValue({ ok: false, error: 'The reset email didn’t send. Please try again in a few minutes.' });
    render(<ForgotForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('didn’t send'));
  });
});
```

`app/manage/set-password/SetPasswordForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const setPassword = vi.fn();
vi.mock('@/lib/backend/auth-actions', () => ({ setPassword }));

import SetPasswordForm from './SetPasswordForm';

describe('SetPasswordForm', () => {
  it('sends both fields and shows a returned error', async () => {
    setPassword.mockResolvedValue({ ok: false, error: 'The two passwords don’t match.' });
    render(<SetPasswordForm />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'aaaaaaaaaa' } });
    fireEvent.change(screen.getByLabelText('Type it again'), { target: { value: 'bbbbbbbbbb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('don’t match'));
    expect(setPassword).toHaveBeenCalledWith({ password: 'aaaaaaaaaa', confirm: 'bbbbbbbbbb' });
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run app/signin app/forgot-password app/manage/set-password`
Expected: FAIL (new modules missing; SignInForm still has Google).

- [ ] **Step 3: Implement**

Sign-in and forgot-password live outside `/manage` (no session yet), so they import the backend stylesheet and font themselves. `app/signin/page.tsx`:

```tsx
import type { Metadata } from 'next';
import SignInForm from './SignInForm';
import { plex } from '../manage/fonts';
import '../manage/backend.css';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function SignInPage(): React.ReactElement {
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">Sign in</h1>
          <SignInForm />
        </div>
      </main>
    </div>
  );
}
```

`app/signin/SignInForm.tsx` (replace the file):

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/backend/auth-actions';

export default function SignInForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await signIn({ email, password });
      if (!result.ok) setError(result.error);
    } catch (err) {
      // A successful sign-in redirects by throwing Next's redirect signal; let it through.
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="email" className="bk-label">Email</label>
        <input id="email" type="email" autoComplete="email" className="bk-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="bk-field">
        <label htmlFor="password" className="bk-label">Password</label>
        <input id="password" type="password" autoComplete="current-password" className="bk-input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error !== '' && <p role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="bk-note"><Link href="/forgot-password" className="bk-link">Forgot password?</Link></p>
    </form>
  );
}
```

Before relying on the `NEXT_REDIRECT` check, read `node_modules/next/dist/docs/` for how this Next version surfaces `redirect()` from a server action called in a client component, and use its documented helper (e.g. `isRedirectError` / `unstable_rethrow`) if one exists instead of the message check.

`app/forgot-password/page.tsx`:

```tsx
import type { Metadata } from 'next';
import ForgotForm from './ForgotForm';
import { plex } from '../manage/fonts';
import '../manage/backend.css';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false, follow: false } };

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <div className={`bk ${plex.variable}`}>
      <main id="main" className="bk-auth">
        <div className="bk-card">
          <p className="bk-kicker">Site owner</p>
          <h1 className="bk-title">Forgot password</h1>
          <ForgotForm />
        </div>
      </main>
    </div>
  );
}
```

`app/forgot-password/ForgotForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/backend/auth-actions';

export default function ForgotForm(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await requestPasswordReset({ email });
      if (result.ok) setDone(result.message ?? '');
      else setError(result.error);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done !== '') return <p role="status" className="bk-note">{done}</p>;
  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="email" className="bk-label">Email</label>
        <input id="email" type="email" autoComplete="email" className="bk-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error !== '' && <p role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <p className="bk-note"><Link href="/signin" className="bk-link">Back to sign in</Link></p>
    </form>
  );
}
```

`app/manage/set-password/page.tsx` (inside the shell — the confirm link gave them a session):

```tsx
import SetPasswordForm from './SetPasswordForm';

export default function SetPasswordPage(): React.ReactElement {
  return (
    <>
      <div className="bk-head"><h1 className="bk-title">Set your password</h1></div>
      <main id="main" className="bk-content"><div className="bk-card"><SetPasswordForm /></div></main>
    </>
  );
}
```

`app/manage/set-password/SetPasswordForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { setPassword } from '@/lib/backend/auth-actions';

export default function SetPasswordForm(): React.ReactElement {
  const [password, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await setPassword({ password, confirm });
      if (!result.ok) setError(result.error);
    } catch (err) {
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="bk-field">
        <label htmlFor="pw" className="bk-label">New password</label>
        <input id="pw" type="password" autoComplete="new-password" className="bk-input" value={password} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div className="bk-field">
        <label htmlFor="pw2" className="bk-label">Type it again</label>
        <input id="pw2" type="password" autoComplete="new-password" className="bk-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <p className="bk-note">At least 10 characters.</p>
      {error !== '' && <p role="alert" className="bk-error">{error}</p>}
      <button type="submit" className="bk-btn" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
    </form>
  );
}
```

Delete `components/auth/GoogleButton.tsx` only if nothing else imports it (`grep -rn GoogleButton app components lib`); otherwise leave it.

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run app/signin app/forgot-password app/manage/set-password && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add app/signin app/forgot-password app/manage/set-password components/auth
git commit -m "feat(backend): sign-in, forgot and set-password pages in the backend look"
```

---

### Task 16: `invite-maker` script

**Files:**
- Create: `scripts/invite-maker.ts`

- [ ] **Step 1: Write the script**

```ts
/**
 * Create a site owner's account and email their invite (spec §1). Claude runs this
 * until Alex's admin exists.
 *   npx tsx --env-file=.env.local scripts/invite-maker.ts <subdomain> <email>
 * An email that already has an account gets a reset link instead, and is added as
 * an admin of the site if it isn't already.
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '../lib/database.types';
import { sendAuthLink, type AuthLinkKind } from '../lib/backend/auth-links';
import { appOrigin } from '../lib/backend/app-url';

async function main(): Promise<void> {
  const [subdomain, rawEmail] = process.argv.slice(2);
  if (subdomain === undefined || rawEmail === undefined) throw new Error('usage: invite-maker.ts <subdomain> <email>');
  const email = rawEmail.trim().toLowerCase();
  const db = createClient<Database>(process.env['SUPABASE_URL']!, process.env['SUPABASE_SERVICE_ROLE_KEY']!);
  const resend = new Resend(process.env['RESEND_API_KEY']!);

  const { data: tenant, error } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (tenant === null) throw new Error(`No site "${subdomain}"`);

  const { data: existingId } = await db.rpc('auth_user_id_by_email', { p_email: email });
  const kind: AuthLinkKind = typeof existingId === 'string' ? 'recovery' : 'invite';

  let userId: string | null = typeof existingId === 'string' ? existingId : null;
  await sendAuthLink({
    kind,
    email,
    siteName: tenant.business_name,
    appOrigin: appOrigin(process.env['SITE_URL']!),
    generateLink: async ({ type, email: e }) => {
      const { data, error: linkErr } = await db.auth.admin.generateLink({ type, email: e });
      if (data?.user?.id !== undefined) userId = data.user.id;
      return { data: data?.properties ? { properties: { hashed_token: data.properties.hashed_token } } : null, error: linkErr };
    },
    send: async (msg) => {
      const { error: sendErr } = await resend.emails.send({ from: process.env['RESEND_FROM_EMAIL']!, ...msg });
      return { error: sendErr === null ? null : { message: sendErr.message } };
    },
  });

  if (userId === null) throw new Error('Link sent but no user id came back — check the account in Supabase');
  const { data: member } = await db.from('tenant_members').select('id').eq('user_id', userId).eq('tenant_id', tenant.id).eq('status', 'active').maybeSingle();
  if (member === null) {
    const { error: insErr } = await db.from('tenant_members').insert({ user_id: userId, tenant_id: tenant.id, role: 'admin', status: 'active' });
    if (insErr !== null) throw new Error(`Invite sent, but adding them to the site failed: ${insErr.message}`);
  }
  console.log(`${kind === 'invite' ? 'Invite' : 'Reset link'} sent to ${email} for ${tenant.business_name}.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

(`RESEND_FROM_EMAIL` in `.env.local` includes the display name; strip surrounding quotes if the loader keeps them.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean. (It is run live in Task 19 with Alex's say-so, not here.)

- [ ] **Step 3: Commit**

```bash
git add scripts/invite-maker.ts
git commit -m "feat(scripts): invite-maker — create a site owner and email their invite"
```

---

### Task 17: "Shop owner sign-in" footer link

**Files:**
- Modify: `lib/archetypes/main-street/defaults.ts` (add `footerOwnerSignIn: 'Shop owner sign-in'` beside `footerTerms`)
- Modify: `lib/archetypes/main-street/chrome.tsx` (`MainStreetFooter`)
- Modify: `lib/archetypes/contractor/strings.ts` (`footer.ownerSignIn: 'Owner sign-in'`)
- Modify: `lib/archetypes/contractor/ContractorLanding.tsx` (footer row)
- Create: `lib/backend/owner-sign-in-url.ts` + test
- Test: extend the existing footer tests (`grep -rln "MainStreetFooter\|cp-foot" lib --include=*.test.tsx`)

- [ ] **Step 1: Write the failing tests**

`lib/backend/owner-sign-in-url.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ownerSignInUrl } from './owner-sign-in-url';

describe('ownerSignInUrl', () => {
  it('is the app host sign-in page for the site origin', () => {
    expect(ownerSignInUrl('https://bohdiai.com')).toBe('https://app.bohdiai.com/signin');
    expect(ownerSignInUrl('http://localhost:3000')).toBe('http://app.localhost:3000/signin');
  });
});
```

In the Main Street footer test, add:

```tsx
it('links shop owners to the backend sign-in', () => {
  render(<MainStreetFooter shopName="Classic Loafs" ownerSignInHref="https://app.bohdiai.com/signin" />);
  expect(screen.getByRole('link', { name: 'Shop owner sign-in' })).toHaveAttribute('href', 'https://app.bohdiai.com/signin');
});
```

and the equivalent for the contractor footer (`name: 'Owner sign-in'`).

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run lib/backend/owner-sign-in-url.test.ts lib/archetypes`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { appOrigin } from './app-url';

/** The backend sign-in page every site's footer links to (spec §1, §7). */
export function ownerSignInUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/signin`;
}
```

`MainStreetFooter` takes a new required prop `ownerSignInHref: string` and renders, after the Terms link:

```tsx
        <Type as="a" role="legal" href={ownerSignInHref} className="ms-footer-link" rel="nofollow">
          {DEFAULT_STRINGS.footerOwnerSignIn}
        </Type>
```

Every caller of `MainStreetFooter` passes `ownerSignInUrl(serverEnv().SITE_URL)` (callers are server components; `grep -rn "MainStreetFooter" lib app`). The contractor footer adds `<a href={ownerSignInHref} rel="nofollow">{S.footer.ownerSignIn}</a>` after the privacy link, with the href passed down the same way.

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run lib/backend lib/archetypes && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/backend/owner-sign-in-url.ts lib/backend/owner-sign-in-url.test.ts lib/archetypes app
git commit -m "feat(storefront): footer link to the owner backend sign-in"
```

---

### Task 18: End-to-end tests

**Files:**
- Create: `e2e/backend.spec.ts`

- [ ] **Step 1: Write the tests**

Playwright's dev server answers on `localhost:3100`; `app.localhost` resolves to it too.

```ts
import { test, expect } from '@playwright/test';

const APP = 'http://app.localhost:3100';

test.describe('Backend sign-in', () => {
  test('the sign-in page renders in the backend look with no Google or sign-up', async ({ page }) => {
    await page.goto(`${APP}/signin`);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText(/google/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('the backend sends a signed-out visitor to sign-in', async ({ page }) => {
    await page.goto(`${APP}/manage`);
    await expect(page).toHaveURL(`${APP}/signin`);
  });

  test('sign-in on the marketing host redirects to the app host', async ({ page }) => {
    const res = await page.request.get('http://localhost:3100/signin', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toBe(`${APP}/signin`);
  });

  test('the old dashboard stays switched off', async ({ page }) => {
    const res = await page.request.get(`${APP}/dashboard`, { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test('forgot password always answers the same way', async ({ page }) => {
    await page.goto(`${APP}/forgot-password`);
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByRole('status').or(page.getByRole('alert'))).toBeVisible();
  });
});
```

(In CI there is no real Supabase or limiter, so the last test accepts either the confirmation or the fail-closed message; both prove the page answers visibly.)

- [ ] **Step 2: Run them**

Run: `CI=true npx playwright test e2e/backend.spec.ts --reporter=line`
Expected: 10 passed (5 × desktop + mobile).

- [ ] **Step 3: Commit**

```bash
git add e2e/backend.spec.ts
git commit -m "test(e2e): backend sign-in, host routing, old dashboard off"
```

---

### Task 19: Full verification, live check with Alex, merge

- [ ] **Step 1: Full suite + coverage gate**

Run: `npm run test:coverage` (no dev server running)
Expected: all pass; coverage thresholds met. If a gate fails, add real tests for the new `lib/backend/*` code until it passes — never lower thresholds.

- [ ] **Step 2: Lint, typecheck, e2e**

Run: `npm run typecheck && npx eslint app lib e2e scripts && CI=true npx playwright test --reporter=line`
Expected: clean; all e2e pass.

- [ ] **Step 3: Visual gate (Alex)**

Ask Alex before starting the dev server. Start it, give him `http://app.localhost:3000/signin`, and let him look at the sign-in page and (after Step 4) the shell and home. Do not commit visual changes he hasn't seen; do not merge until he says it looks right.

- [ ] **Step 4: Live invite (only with Alex's yes, on a site he names)**

Run: `npx tsx --env-file=.env.local scripts/invite-maker.ts <subdomain> <email Alex gives>`
Expected: the invite email arrives; its link opens set-password on `app.bohdiai.com` (after deploy) or `app.localhost:3000` (local, with `SITE_URL` pointing there); setting a password lands on `/manage` showing the site's name.

- [ ] **Step 5: Merge and deploy**

Merge the branch to `main` (fast-forward), push (Cloudflare Workers Builds deploys), delete the branch. Then check live: `https://app.bohdiai.com/signin` renders; `https://classic-loafs.bohdiai.com/signin` redirects to it; `https://app.bohdiai.com/dashboard` is 404; a shop footer shows the owner link.

- [ ] **Step 6: Update the plan docs**

Tick what landed in `Full-Plan.md` if it has matching boxes, add the session line to `Project-Docs/SESSION-BRIEF.md`, and note in the spec that 1a is done. Commit: `docs: maker backend 1a (foundation) live`.
