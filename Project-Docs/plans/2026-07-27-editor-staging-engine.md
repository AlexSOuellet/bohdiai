# Editor Staging Engine + Draft-Backed Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every store a persistent, owner-only draft that all editing writes to, a preview that reliably renders that draft, and one Publish / one Reset — and move the shipped feeling-swap onto it.

**Architecture:** A new `store_drafts` table holds one staged copy of a tenant's home envelope (the `layout_tree.root` archetype object). Editing actions upsert the draft; Publish promotes it to the live `content_pages` row and deletes it; Reset deletes it. The storefront renders the draft (instead of the published envelope) only when the request carries a valid, short-lived, HMAC-signed preview token minted by the owner's authenticated dashboard — so staged words show in the preview without ever leaking to the public. Undo is a client-side snapshot stack in the editor.

**Tech Stack:** Next.js 16 (App Router, RSC + server actions), Supabase (Postgres + RLS), TypeScript (strict), Vitest, Node `crypto` for HMAC. Migrations via `node scripts/db-migrate.mjs`; types via `npm run gen:types`.

**This plan is Phase 1 of the "Make It Yours" spec** (`Project-Docs/Editor-Make-It-Yours-Design.md`). It builds no content editing, no section on/off, and no walkthrough — those are later plans on top of this engine. It DOES rework the existing feeling-swap (`commitLook`) to stage into the draft.

---

## File structure

**Create:**
- `supabase/migrations/20260727000001_store_drafts.sql` — the draft table + RLS.
- `lib/editor/draft.ts` — draft data access: read / stage / publish / reset the home envelope. Server-only.
- `lib/editor/draft.test.ts` — tests for the above.
- `lib/editor/preview-token.ts` — mint/verify a signed, short-lived preview token.
- `lib/editor/preview-token.test.ts` — tests for the above.

**Modify:**
- `lib/storefront/load-envelope.ts` — add `loadDraftEnvelope(tenantId)` alongside `loadHomeEnvelope`.
- `lib/storefront/load-envelope.test.ts` — add draft-load tests (create the file if it doesn't exist).
- `app/storefront/page.tsx` — accept a `previewToken` search param and thread it through.
- `app/storefront/_components/StorefrontPage.tsx` — when a valid token matches the tenant, render the draft envelope instead of the published one.
- `app/dashboard/website/actions.ts` — replace `commitLook` (writes live) with `stageLook` (writes draft); add `publishStore` and `resetStore`.
- `app/dashboard/website/page.tsx` — load any existing draft, mint a preview token, pass both to the editor.
- `app/dashboard/website/_components/Editor.tsx` — stage on change, Preview via token URL, Publish/Reset buttons, dirty-vs-live, Undo stack.

**Env:**
- `PREVIEW_TOKEN_SECRET` — new secret for signing preview tokens. Add to `.env.local` and the deployment env.

---

## Task 1: The `store_drafts` table

**Files:**
- Create: `supabase/migrations/20260727000001_store_drafts.sql`
- Modify: `lib/database.types.ts` (regenerated, not hand-edited)

- [ ] **Step 1: Write the migration**

```sql
-- One staged, not-yet-published copy of a tenant's home envelope. The editor
-- writes here; Publish promotes to content_pages; Reset deletes the row. Owner
-- only — never publicly readable, so an unpublished draft can't be scraped.
-- Spec: Project-Docs/Editor-Make-It-Yours-Design.md (Part 1).
create table store_drafts (
  tenant_id   uuid primary key references tenants(id) on delete cascade,
  layout_tree jsonb not null,
  updated_at  timestamptz not null default now()
);

create trigger store_drafts_set_updated_at
  before update on store_drafts
  for each row execute function set_updated_at();

alter table store_drafts enable row level security;

-- Tenant admins (the store's owner/staff) can do everything with their draft.
-- No anon/public policy at all: drafts are never publicly selectable.
create policy store_drafts_admin_all on store_drafts
  for all to authenticated
  using (is_tenant_admin(tenant_id))
  with check (is_tenant_admin(tenant_id));

comment on table store_drafts is
  'Staged home envelope per tenant (editor draft). Promoted to content_pages on Publish, deleted on Reset. Owner-only. Spec: Editor-Make-It-Yours-Design.md.';
```

- [ ] **Step 2: Apply the migration**

Run: `node scripts/db-migrate.mjs`
Expected: applies `20260727000001_store_drafts.sql` with no error; the table exists.

- [ ] **Step 3: Regenerate types**

Run: `npm run gen:types`
Expected: `lib/database.types.ts` now contains a `store_drafts` row/insert/update type. Do not hand-edit it.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260727000001_store_drafts.sql lib/database.types.ts
git commit -m "feat(editor): store_drafts table for staged edits"
```

---

## Task 2: Draft data access (`lib/editor/draft.ts`)

The store's home envelope lives at `content_pages` (`slug='/'`, `status='published'`) in `layout_tree`, whose `root` object is the archetype envelope (`kind:'archetype'`, with `lookKey`, `mood`, `content`, etc. — see `lib/storefront/load-envelope.ts`). The draft mirrors that whole `layout_tree` value (the full tree, not just `root`, so promotion is a straight copy).

**Files:**
- Create: `lib/editor/draft.ts`
- Test: `lib/editor/draft.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/editor/draft.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the admin client so tests never touch a real DB.
const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from './draft';

beforeEach(() => { from.mockReset(); });

/** Build a chainable query stub whose terminal resolves to `result`. */
function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'update', 'delete', 'upsert', 'insert']) {
    chain[m] = vi.fn(() => chain);
  }
  chain['maybeSingle'] = vi.fn(() => Promise.resolve(result));
  chain['then'] = undefined;
  return chain;
}

describe('readDraftTree', () => {
  it('returns the draft layout_tree when a draft exists', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'archetype', lookKey: 'ember' } } }, error: null }));
    const tree = await readDraftTree('t1');
    expect(tree).toEqual({ root: { kind: 'archetype', lookKey: 'ember' } });
  });

  it('returns null when no draft exists', async () => {
    from.mockReturnValue(query({ data: null, error: null }));
    expect(await readDraftTree('t1')).toBeNull();
  });
});

describe('stageDraftTree', () => {
  it('upserts the tree keyed by tenant', async () => {
    const q = query({ data: null, error: null });
    from.mockReturnValue(q);
    await stageDraftTree('t1', { root: { kind: 'archetype' } });
    expect(from).toHaveBeenCalledWith('store_drafts');
    expect(q['upsert']).toHaveBeenCalledWith(
      { tenant_id: 't1', layout_tree: { root: { kind: 'archetype' } }, updated_at: expect.any(String) },
      { onConflict: 'tenant_id' },
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/editor/draft.test.ts`
Expected: FAIL — `draft.ts` has no such exports.

- [ ] **Step 3: Implement `lib/editor/draft.ts`**

```typescript
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Json } from '@/lib/database.types';

/** Read the tenant's staged layout_tree, or null when there is no draft.
 *  Callers must have already checked ownership (server actions gate first). */
export async function readDraftTree(tenantId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin()
    .from('store_drafts')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  return tree as Record<string, unknown>;
}

/** Upsert the tenant's draft with a full layout_tree value. */
export async function stageDraftTree(tenantId: string, tree: Record<string, unknown>): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin()
    .from('store_drafts')
    .upsert(
      { tenant_id: tenantId, layout_tree: tree as Json, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' },
    );
  if (error !== null) {
    logger.error('draft: stage failed', { tenantId, err: error.message });
    return { ok: false };
  }
  return { ok: true };
}

/** Promote the draft onto the live home page and delete the draft. Returns false
 *  when there is no draft to publish or a write fails. Also keeps the tenant's
 *  fast-path mood cache in step, mirroring the prior commitLook behaviour. */
export async function publishDraft(tenantId: string): Promise<{ ok: boolean }> {
  const tree = await readDraftTree(tenantId);
  if (tree === null) return { ok: false };

  const db = supabaseAdmin();
  const { data: row, error: readErr } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();
  if (readErr !== null || row === null) {
    logger.warn('draft: publish — home page not found', { tenantId });
    return { ok: false };
  }

  const { error: writeErr } = await db
    .from('content_pages')
    .update({ layout_tree: tree as Json })
    .eq('id', row.id);
  if (writeErr !== null) {
    logger.error('draft: publish write failed', { tenantId, err: writeErr.message });
    return { ok: false };
  }

  // Keep tenants.mood_key in step with the promoted envelope (as commitLook did).
  const root = tree['root'];
  const mood = root !== null && typeof root === 'object' && !Array.isArray(root)
    ? (root as Record<string, unknown>)['mood']
    : undefined;
  if (typeof mood === 'string') {
    const { error: moodErr } = await db.from('tenants').update({ mood_key: mood }).eq('id', tenantId);
    if (moodErr !== null) logger.warn('draft: publish mood sync failed', { tenantId, err: moodErr.message });
  }

  await resetDraft(tenantId); // draft is spent once live
  return { ok: true };
}

/** Discard the draft (Reset → back to live). No-op when there is no draft. */
export async function resetDraft(tenantId: string): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin().from('store_drafts').delete().eq('tenant_id', tenantId);
  if (error !== null) {
    logger.error('draft: reset failed', { tenantId, err: error.message });
    return { ok: false };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/editor/draft.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/editor/draft.ts lib/editor/draft.test.ts
git commit -m "feat(editor): draft read/stage/publish/reset data access"
```

---

## Task 3: `loadDraftEnvelope` for rendering

Mirror `loadHomeEnvelope` (same `root` extraction and `kind:'archetype'` guard), reading from `store_drafts`. The storefront uses this to render a draft. Per-request cached like its sibling.

**Files:**
- Modify: `lib/storefront/load-envelope.ts`
- Test: `lib/storefront/load-envelope.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

```typescript
// lib/storefront/load-envelope.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));

import { loadDraftEnvelope } from './load-envelope';

function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'maybeSingle']) chain[m] = vi.fn(() => (m === 'maybeSingle' ? Promise.resolve(result) : chain));
  return chain;
}

beforeEach(() => from.mockReset());

describe('loadDraftEnvelope', () => {
  it('returns the archetype root of a draft', async () => {
    from.mockReturnValue(query({ data: { layout_tree: { root: { kind: 'archetype', lookKey: 'ember' } } } }));
    expect(await loadDraftEnvelope('t1')).toEqual({ kind: 'archetype', lookKey: 'ember' });
  });

  it('returns null when there is no draft', async () => {
    from.mockReturnValue(query({ data: null }));
    expect(await loadDraftEnvelope('t1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- lib/storefront/load-envelope.test.ts`
Expected: FAIL — `loadDraftEnvelope` not exported.

- [ ] **Step 3: Add `loadDraftEnvelope` to `lib/storefront/load-envelope.ts`**

Add after `loadHomeEnvelope`:

```typescript
/** Load the tenant's STAGED (draft) home envelope root, or null when there is no
 *  draft. Same shape and guards as loadHomeEnvelope; reads store_drafts instead of
 *  the published content_pages row. Owner-gated at the call site (preview token). */
export const loadDraftEnvelope = cache(async (tenantId: string): Promise<Record<string, unknown> | null> => {
  const { data } = await supabaseAdmin()
    .from('store_drafts')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  const root = (tree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object' || Array.isArray(root)) return null;
  const rootObj = root as Record<string, unknown>;
  return rootObj['kind'] === 'archetype' ? rootObj : null;
});
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- lib/storefront/load-envelope.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/storefront/load-envelope.ts lib/storefront/load-envelope.test.ts
git commit -m "feat(editor): loadDraftEnvelope for draft-backed rendering"
```

---

## Task 4: Preview token (mint + verify)

A short-lived HMAC token proves "the owner's dashboard authorised a draft preview for this tenant." It rides in the preview URL so the cross-subdomain iframe needs no shared cookie, and the public can never forge it. Payload: `tenantId` + expiry; signed with `PREVIEW_TOKEN_SECRET`.

**Files:**
- Create: `lib/editor/preview-token.ts`
- Test: `lib/editor/preview-token.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/editor/preview-token.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => { process.env.PREVIEW_TOKEN_SECRET = 'test-secret'; vi.useRealTimers(); });

import { mintPreviewToken, verifyPreviewToken } from './preview-token';

describe('preview token', () => {
  it('round-trips a tenant id', () => {
    const token = mintPreviewToken('tenant-123');
    expect(verifyPreviewToken(token)).toBe('tenant-123');
  });

  it('rejects a tampered token', () => {
    const token = mintPreviewToken('tenant-123');
    expect(verifyPreviewToken(token + 'x')).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = mintPreviewToken('tenant-123');
    process.env.PREVIEW_TOKEN_SECRET = 'other-secret';
    expect(verifyPreviewToken(token)).toBeNull();
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = mintPreviewToken('tenant-123');
    vi.setSystemTime(new Date('2026-01-01T00:20:00Z')); // 20 min later, past TTL
    expect(verifyPreviewToken(token)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- lib/editor/preview-token.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/editor/preview-token.ts`**

```typescript
import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_MS = 15 * 60 * 1000; // 15 minutes — long enough for an editing pass, short enough to expire.

function secret(): string {
  const s = process.env.PREVIEW_TOKEN_SECRET;
  if (!s) throw new Error('PREVIEW_TOKEN_SECRET is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Mint a token authorising a draft preview for `tenantId`, valid for TTL_MS. */
export function mintPreviewToken(tenantId: string): string {
  const payload = `${tenantId}.${Date.now() + TTL_MS}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

/** Verify a token; return the tenantId when valid and unexpired, else null. */
export function verifyPreviewToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(body, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [tenantId, expiryStr] = payload.split('.');
  const expiry = Number(expiryStr);
  if (!tenantId || !Number.isFinite(expiry) || Date.now() > expiry) return null;
  return tenantId;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- lib/editor/preview-token.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the env var**

Add `PREVIEW_TOKEN_SECRET=<a long random string>` to `.env.local` (and note it for the deploy env). Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

- [ ] **Step 6: Commit**

```bash
git add lib/editor/preview-token.ts lib/editor/preview-token.test.ts
git commit -m "feat(editor): signed short-lived preview token"
```

---

## Task 5: Render the draft when a valid token matches

When the storefront home is requested with `?previewToken=…` and the token verifies to the SAME tenant the request resolved to (`x-tenant-id`), render the draft envelope; otherwise render published as today. Public visitors have no token, so they always get published.

**Files:**
- Modify: `app/storefront/page.tsx`
- Modify: `app/storefront/_components/StorefrontPage.tsx`
- Test: `app/storefront/_components/StorefrontPage.test.tsx` (add a focused case; create if absent)

- [x] **Step 1: Thread `previewToken` through the route**

In `app/storefront/page.tsx`, add `previewToken` to the `searchParams` type and pass it to `StorefrontPage`:

```typescript
// add to the searchParams type:  previewToken?: string;
return <StorefrontPage slug="/" previewToken={sp.previewToken} previewLook={sp.previewLook} previewMood={sp.previewMood} previewTexture={sp.previewTexture} previewTextureOpacity={opacity} previewHero={sp.hero} previewGoods={sp.goods} previewFounder={sp.about} previewNav={sp.nav} previewCollections={sp.collections} previewReviews={sp.reviews} previewFindUs={sp.findus} />;
```

- [x] **Step 2: Add the draft branch in `StorefrontPage.tsx`**

Add `previewToken?: string | undefined` to `StorefrontPageProps`. Add this import:

```typescript
import { verifyPreviewToken } from '@/lib/editor/preview-token';
import { loadDraftEnvelope } from '@/lib/storefront/load-envelope';
```

Add a helper that picks the envelope source, then use it in the home branch (and, later, sub-pages). At the point where the home branch calls `loadHomeEnvelope(tenantId)`:

```typescript
// Owner draft preview: a valid token for THIS tenant renders the staged draft.
// No token (public) or a token for another tenant → the published envelope.
const useDraft = previewToken !== undefined && verifyPreviewToken(previewToken) === tenantId;
const env = useDraft ? (await loadDraftEnvelope(tenantId)) ?? (await loadHomeEnvelope(tenantId)) : await loadHomeEnvelope(tenantId);
```

(Apply the same `env` selection to the sub-page and collection branches so a draft preview is consistent across pages; the token and helper are already in scope.)

- [x] **Step 3: Write the test** — real render-and-assert (which loader supplies the envelope); four cases: token→draft, token-for-other-tenant→published, no-token→published, token-but-no-draft→published fallback.

```typescript
// app/storefront/_components/StorefrontPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

const loadHome = vi.fn();
const loadDraft = vi.fn();
const verify = vi.fn();
vi.mock('@/lib/storefront/load-envelope', () => ({
  loadHomeEnvelope: (id: string) => loadHome(id),
  loadDraftEnvelope: (id: string) => loadDraft(id),
  loadTenantChrome: () => Promise.resolve({ logoUrl: undefined, brandColors: [] }),
}));
vi.mock('@/lib/editor/preview-token', () => ({ verifyPreviewToken: (t: string) => verify(t) }));
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Map([['x-tenant-id', 't1']])) }));
// ...mock archetypeSpec / supabaseAdmin listings/collections as the existing suite does...

beforeEach(() => { loadHome.mockReset(); loadDraft.mockReset(); verify.mockReset(); });

describe('StorefrontPage draft preview', () => {
  it('renders the draft when the token matches the tenant', async () => {
    verify.mockReturnValue('t1');
    loadDraft.mockResolvedValue({ kind: 'archetype', archetypeKey: 'main-street', lookKey: 'ember', content: {} });
    // render StorefrontPage with previewToken='ok'; assert loadDraft was consulted, loadHome not used for the envelope.
    // (Follow the render/assert pattern already used in this suite.)
    expect(true).toBe(true); // replace with a real render+assert mirroring existing tests
  });

  it('renders published when the token is for another tenant', async () => {
    verify.mockReturnValue('other');
    loadHome.mockResolvedValue({ kind: 'archetype', archetypeKey: 'main-street', lookKey: 'ember', content: {} });
    // assert loadDraft NOT used as the source.
    expect(true).toBe(true);
  });
});
```

> Note for the implementer: match the existing `StorefrontPage` test setup for mocking `archetypeSpec` and `supabaseAdmin` (listings/collections). The two assertions that matter: token-matches-tenant → `loadDraftEnvelope` supplies the envelope; token-mismatch/absent → `loadHomeEnvelope` supplies it. Replace the `expect(true)` placeholders with real render-and-assert once the suite's mock scaffold is in place.

- [x] **Step 4: Run tests**

Run: `npm test -- app/storefront/_components/StorefrontPage.test.tsx`
Expected: PASS. (4 pass; typecheck + lint clean.)

- [x] **Step 5: Commit** — `3abb645`. (Also `9f53528`: fixed a pre-existing strict-tsc error in the Task 4 preview-token files — dot-access on `process.env` — that would have blocked the clean typecheck Task 9 gates.)

```bash
git add app/storefront/page.tsx app/storefront/_components/StorefrontPage.tsx app/storefront/_components/StorefrontPage.test.tsx
git commit -m "feat(editor): render staged draft under a valid owner preview token"
```

---

## Task 6: Rework the editor actions onto the draft

Replace `commitLook` (writes straight to the live page) with `stageLook` (writes the look into the draft), and add `publishStore` / `resetStore`. `stageLook` reads the current draft if present else the live envelope, applies the look change with the existing `applyLookToEnvelope`, and stages the result.

**Files:**
- Modify: `app/dashboard/website/actions.ts`
- Test: `app/dashboard/website/actions.test.ts` (create if absent)

- [ ] **Step 1: Write the failing tests**

```typescript
// app/dashboard/website/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCurrentShop = vi.fn();
const readDraftTree = vi.fn();
const stageDraftTree = vi.fn();
const publishDraft = vi.fn();
const resetDraft = vi.fn();
const loadHomeEnvelope = vi.fn();

vi.mock('@/lib/dashboard/current-shop', () => ({ getCurrentShop: () => getCurrentShop() }));
vi.mock('@/lib/editor/draft', () => ({
  readDraftTree: (id: string) => readDraftTree(id),
  stageDraftTree: (id: string, t: unknown) => stageDraftTree(id, t),
  publishDraft: (id: string) => publishDraft(id),
  resetDraft: (id: string) => resetDraft(id),
}));
vi.mock('@/lib/storefront/load-envelope', () => ({ loadHomeEnvelope: (id: string) => loadHomeEnvelope(id) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { stageLook, publishStore, resetStore } from './actions';

beforeEach(() => { [getCurrentShop, readDraftTree, stageDraftTree, publishDraft, resetDraft, loadHomeEnvelope].forEach((m) => m.mockReset()); });

describe('stageLook', () => {
  it('stages the look onto the draft, seeding from live when no draft exists', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    readDraftTree.mockResolvedValue(null);
    loadHomeEnvelope.mockResolvedValue({ kind: 'archetype', lookKey: 'old', mood: 'cozy' });
    stageDraftTree.mockResolvedValue({ ok: true });
    const res = await stageLook('ember', 'rustic', { mode: 'default', opacity: null });
    expect(res.ok).toBe(true);
    expect(stageDraftTree).toHaveBeenCalledWith('t1', expect.objectContaining({ root: expect.objectContaining({ lookKey: 'ember', mood: 'rustic' }) }));
  });

  it('rejects an unknown skin without touching the draft', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    const res = await stageLook('not-a-skin', 'rustic', { mode: 'default', opacity: null });
    expect(res.ok).toBe(false);
    expect(stageDraftTree).not.toHaveBeenCalled();
  });
});

describe('publishStore / resetStore', () => {
  it('publishStore delegates to publishDraft for the current shop', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    publishDraft.mockResolvedValue({ ok: true });
    expect((await publishStore()).ok).toBe(true);
    expect(publishDraft).toHaveBeenCalledWith('t1');
  });

  it('resetStore delegates to resetDraft for the current shop', async () => {
    getCurrentShop.mockResolvedValue({ tenantId: 't1' });
    resetDraft.mockResolvedValue({ ok: true });
    expect((await resetStore()).ok).toBe(true);
    expect(resetDraft).toHaveBeenCalledWith('t1');
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm test -- app/dashboard/website/actions.test.ts`
Expected: FAIL — new exports don't exist.

- [ ] **Step 3: Rewrite `app/dashboard/website/actions.ts`**

```typescript
'use server';

// Editor actions on the STAGED draft. Everything the maker changes writes to the
// draft (never live); Publish promotes it, Reset discards it. Ownership is enforced
// via getCurrentShop before any write. Spec: Editor-Make-It-Yours-Design.md Part 1.

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { applyLookToEnvelope } from '@/lib/editor/apply-look';
import { isKnownSkin } from '@/lib/editor/look-shelf';
import { normaliseTexture, type StoredTexture } from '@/lib/editor/texture';
import { MOODS, type MoodKey } from '@/lib/moods';
import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from '@/lib/editor/draft';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';

export type ActionResult = { ok: true } | { ok: false; error: string };

function isMoodKey(value: string): value is MoodKey {
  return Object.prototype.hasOwnProperty.call(MOODS, value);
}

/** Stage a look change (feeling/skin/texture) onto the draft. Seeds the draft from
 *  the live envelope on first edit. The look lives on the envelope root, so we
 *  stage a full layout_tree ({ root }). */
export async function stageLook(skinKey: string, moodKey: string, texture?: StoredTexture): Promise<ActionResult> {
  if (!isKnownSkin(skinKey)) return { ok: false, error: 'Unknown look.' };
  if (!isMoodKey(moodKey)) return { ok: false, error: 'Unknown feeling.' };
  const cleanTexture = texture !== undefined ? normaliseTexture(texture) : undefined;

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  // Start from the current draft if there is one, else the live envelope root.
  const draftTree = await readDraftTree(shop.tenantId);
  const baseTree = draftTree ?? { root: await loadHomeEnvelope(shop.tenantId) };
  const root = (baseTree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object') return { ok: false, error: 'Could not load your store.' };

  let next: Record<string, unknown>;
  try {
    ({ next } = applyLookToEnvelope(
      baseTree,
      cleanTexture !== undefined ? { skinKey, moodKey, texture: cleanTexture } : { skinKey, moodKey },
    ));
  } catch {
    return { ok: false, error: 'This store can’t take a new look right now.' };
  }

  const staged = await stageDraftTree(shop.tenantId, next);
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Publish the staged draft to the live store. */
export async function publishStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to publish.' };
  const res = await publishDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Nothing to publish, or the store couldn’t be updated.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Discard the staged draft — back to what's live. */
export async function resetStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to reset.' };
  const res = await resetDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Could not reset.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}
```

> Note: `applyLookToEnvelope` requires `root.kind === 'archetype'`; seeding `baseTree` from `loadHomeEnvelope` (which returns the archetype root) as `{ root }` satisfies that. If `loadHomeEnvelope` returns null (legacy store), `stageLook` fails cleanly with "Could not load your store."

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- app/dashboard/website/actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/website/actions.ts app/dashboard/website/actions.test.ts
git commit -m "feat(editor): stage look edits to the draft; publish/reset actions"
```

---

## Task 7: Page loads the draft and mints a preview token

The editor page passes the editor: the live look (for the "now / dirty" comparison), the staged look if a draft exists (so a returning maker resumes their draft), and a freshly minted preview token for the draft-preview URL.

**Files:**
- Modify: `app/dashboard/website/page.tsx`

- [ ] **Step 1: Load the draft look + mint a token, pass to Editor**

After `const look = await loadCurrentLook(shop.tenantId);` and its null-guard, add:

```typescript
import { readDraftTree } from '@/lib/editor/draft';
import { mintPreviewToken } from '@/lib/editor/preview-token';
import { readStoredTexture } from '@/lib/editor/texture';
// ...

// If a draft exists, the editor should open on the staged look, not the live one.
const draftTree = await readDraftTree(shop.tenantId);
const draftRoot = draftTree?.['root'];
const draftLook = draftRoot !== null && typeof draftRoot === 'object' && !Array.isArray(draftRoot)
  ? {
      skin: typeof (draftRoot as Record<string, unknown>)['lookKey'] === 'string' ? (draftRoot as Record<string, unknown>)['lookKey'] as string : look.lookKey,
      feeling: typeof (draftRoot as Record<string, unknown>)['mood'] === 'string' ? (draftRoot as Record<string, unknown>)['mood'] as string : look.moodKey,
      texture: readStoredTexture((draftRoot as Record<string, unknown>)['texture']) ?? undefined,
    }
  : null;

const previewToken = mintPreviewToken(shop.tenantId);
```

Pass `stagedLook={draftLook}` and `previewToken={previewToken}` to `<Editor … />` (props added in Task 8).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (after Task 8 adds the props; if running before Task 8, the new props will error — do Task 8 in the same working session and typecheck at the end).

- [ ] **Step 3: Commit** (with Task 8, since the two are interdependent — see Task 8 Step 6).

---

## Task 8: Editor — stage on change, Publish/Reset, draft preview, Undo

Rework `Editor.tsx` so choosing a feeling/skin/texture **stages** (calls `stageLook`) instead of only living in client state, the preview iframe points at the draft via the token, Publish/Reset call the new actions, "dirty" compares the staged look to the live look, and an Undo stack lets the maker step back.

**Files:**
- Modify: `app/dashboard/website/_components/Editor.tsx`

- [ ] **Step 1: New props**

Add to `EditorProps`:

```typescript
  /** The look staged in the draft, if the maker has an unpublished draft. Absent → no draft yet. */
  stagedLook?: { skin: string; feeling: string; texture?: StoredTexture } | null;
  /** Signed token authorising the draft preview for this tenant. */
  previewToken: string;
```

- [ ] **Step 2: Open on the staged look when a draft exists**

Seed `selectedFeeling`/`selectedSkin`/texture state from `stagedLook ?? live`. Keep the `live*` state seeded from the `current*` props (the published look) — "dirty" is staged-vs-live, and a returning maker with a draft opens dirty.

- [ ] **Step 3: Stage on every change**

Change `pickFeeling`, the skin `onSelect`, and the texture controls so that after updating local state they call `stageLook(selectedSkin, selectedFeeling, selectedTexture)` inside a transition. On success, push the *previous* staged envelope selection onto an undo stack (see Step 5). On failure, show the error and revert the local state. The preview refreshes when its `src` changes (Step 4).

- [ ] **Step 4: Preview reads the draft**

Change the preview `src` to point at the draft via the token instead of the look URL params. Add a `draftPreviewUrl` helper import or inline:

```typescript
// The preview now renders the staged draft (words + look + everything), gated by the token.
const src = `${previewOrigin}/?previewToken=${encodeURIComponent(previewToken)}`;
```

Keep `key={src}` on the iframe so it reloads after a stage completes (bump a nonce in state after each successful `stageLook` so `src` changes and the iframe re-fetches the freshly-staged draft). The "Preview" link (full-size tab) uses the same URL.

- [ ] **Step 5: Publish / Reset / Undo**

- Replace `commitLook` with `publishStore`. `Publish` is enabled when a draft exists (dirty vs live).
- Add a `Reset` button that calls `resetStore`, then resets local state to the live look and clears the undo stack.
- Undo: keep `const [undoStack, setUndoStack] = useState<LookSelection[]>([])`. Before each successful stage, push the prior selection. `Undo` pops the last, re-stages it (calls `stageLook` with the popped values), and updates local state. Disabled when the stack is empty.

- [ ] **Step 6: Typecheck, lint, commit page + editor together**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add app/dashboard/website/page.tsx app/dashboard/website/_components/Editor.tsx
git commit -m "feat(editor): stage-on-change, draft preview, Publish/Reset/Undo"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: all tests pass (prior count + the new draft/token/action/preview tests).

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 3: Manual check on a real store (Alex's eyes gate this)**

Do NOT claim done on tests alone — this has visible output. On a dev store with the `editor` flag on:
1. Open `/dashboard/website`, change the feeling. Confirm the **preview beside the controls updates** to the new feeling without opening the live site (the bug that motivated this).
2. Confirm the **public store is unchanged** (open the storefront in a normal tab — still the old look).
3. Reload the editor — confirm it **reopens on the staged look** (the draft persisted) and reads "unpublished changes."
4. Hit **Undo** — confirm it steps back. Hit **Reset** — confirm the editor returns to the live look and the draft is gone.
5. Change again, hit **Publish** — confirm the **public store now shows the new look** and the editor reads "everything published."
6. Confirm a logged-out visitor hitting `/?previewToken=<expired-or-forged>` sees the **published** store, never a draft.

- [ ] **Step 4: Update the plan checkboxes and the Full Plan**

Tick this plan's boxes. In `Project-Docs/Full-Plan.md`, the editor's "Undo" line and the staging groundwork are now real; note progress. Commit:

```bash
git add Project-Docs/
git commit -m "docs(session-76): staging engine landed; plan checkboxes"
```

---

## Self-review notes (for the implementer)

- **Owner-gating:** the ONLY path that renders a draft is a token that verifies to the same tenant the request resolved to. No token, wrong tenant, expired, or forged → published. Public RLS on `store_drafts` is absent, so even a direct anon Supabase query can't read a draft.
- **Single source of truth:** the draft (`store_drafts.layout_tree`) is the one staged state; the editor's controls and the preview are both views of it. No surface keeps its own copy that can drift.
- **Legacy stores:** `stageLook` fails cleanly if `loadHomeEnvelope` returns null (a store not on the envelope engine) — same guard the old `commitLook` had.
- **Not in this plan:** Bohdi content editing, section on/off, and the walkthrough. This engine is what they build on.
