// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';

const writeSite = vi.fn();
const draftIntake = vi.fn();
const referenceWords = vi.fn();
const planSite = vi.fn();
const finishSceneWith = vi.fn();
const addScenes = vi.fn();
vi.mock('./write-site', () => ({ writeSite: (...a: unknown[]) => writeSite(...a) }));
vi.mock('./intake-drafts', () => ({ DRAFT_MODEL: 'm', draftIntake: (...a: unknown[]) => draftIntake(...a) }));
vi.mock('./reference-words', () => ({ referenceWords: (...a: unknown[]) => referenceWords(...a) }));
vi.mock('./site-plan', () => ({ planSite: (...a: unknown[]) => planSite(...a) }));
vi.mock('./from-intake', () => ({ siteFromIntake: (_i: unknown, _d: unknown, settings: unknown) => ({ settings }) }));
vi.mock('./scene-finish', () => ({ finishSceneWith: (...a: unknown[]) => finishSceneWith(...a) }));
vi.mock('@/lib/backend/scene/library', () => ({ addScenes: (...a: unknown[]) => addScenes(...a) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: async () => keyWords(INTAKE_WORD_SPOTS, 'intake') }));

import { attachBackground, draft, finish, makeBackground, prepare, write, type BuildDeps, type BuildState } from './site-build';

type Row = Record<string, unknown>;

/** A database: rows per table, every write noted. */
function fakeDb(tables: Record<string, Row[]>) {
  const writes: { table: string; op: string; value: unknown }[] = [];
  const storage = { uploads: [] as string[] };
  const from = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    const chain = {
      select: () => chain,
      eq: (col: string, v: unknown) => ((rows = rows.filter((r) => r[col] === v)), chain),
      like: () => chain,
      order: () => chain,
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      single: async () => ({ data: rows[0] ?? null, error: rows[0] === undefined ? { message: 'none' } : null }),
      then: (ok: (v: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(ok),
      update: (value: unknown) => ({ eq: async () => (writes.push({ table, op: 'update', value }), { error: null }) }),
      insert: async (value: unknown) => (writes.push({ table, op: 'insert', value }), { error: null }),
    };
    return chain;
  };
  const db = {
    from,
    storage: {
      from: () => ({
        download: async (path: string) => ({ data: new Blob([path]), error: null }),
        upload: async (path: string) => (storage.uploads.push(path), { error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn/${path}` } }),
      }),
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, writes, storage };
}

const INTAKE = { id: 'i1', status: 'new', plan: 'lite', tenant_id: 't1', family: 'rustic', maker_name: 'Lena', business_name: 'Saltmarsh', email: 'lena@example.com', makes: 'Lace', about: 'Porch', portrait_path: null };
const PIECES = [{ intake_id: 'i1', position: 0, name: 'Tide', price_cents: 2500, description: null, photo_path: 'i1/piece-1.webp' }];

function deps(tables: Record<string, Row[]>, over: Partial<BuildDeps> = {}) {
  const fake = fakeDb(tables);
  const send = vi.fn(async () => ({ error: null }));
  const parse = vi.fn(async () => ({ parsed_output: { mood: 'cozy' } }));
  const d: BuildDeps = {
    db: fake.db,
    claude: () => ({ messages: { parse } }) as never,
    painter: () => ({ paint: async () => Buffer.from([1]), enlarge: async () => Buffer.from([2]) }),
    images: async () => ({}) as ImagesBinding,
    send,
    ...over,
  };
  return { d, ...fake, send, parse };
}

const STATE: BuildState = { intakeId: 'i1', tenantId: 't1', subdomain: 'saltmarsh', family: 'rustic', skin: 'main-street-tannery', sceneKeys: ['saltmarsh-1', 'saltmarsh-2', 'saltmarsh-3'] };

beforeEach(() => {
  for (const f of [writeSite, draftIntake, referenceWords, planSite, finishSceneWith, addScenes]) f.mockReset();
  referenceWords.mockResolvedValue({ 'family.x': 'X' });
  planSite.mockReturnValue({ ok: true, plan: { planned: true } });
  draftIntake.mockResolvedValue({ ok: true, drafts: { d: 1 } });
  finishSceneWith.mockResolvedValue({ webp: new Uint8Array([3]), tone: 'dark' });
});

describe('prepare', () => {
  it('takes the mood they picked, its own skin, the web address sign-up made, and free photo names', async () => {
    const { d, parse } = deps({ intakes: [INTAKE], intake_pieces: PIECES, tenants: [{ id: 't1', subdomain: 'saltmarsh' }], scenes: [{ key: 'saltmarsh-1' }] });
    const state = await prepare(d, 'i1');
    expect(state).toEqual({ intakeId: 'i1', tenantId: 't1', subdomain: 'saltmarsh', family: 'rustic', skin: 'main-street-tannery', sceneKeys: ['saltmarsh-2', 'saltmarsh-3', 'saltmarsh-4'] });
    expect(parse).not.toHaveBeenCalled();
  });

  it('asks Claude for the mood when they said "you pick"', async () => {
    const { d, parse } = deps({ intakes: [{ ...INTAKE, family: null }], intake_pieces: PIECES, tenants: [{ id: 't1', subdomain: 'saltmarsh' }], scenes: [] });
    expect((await prepare(d, 'i1')).family).toBe('cozy');
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('refuses a form that isn’t tied to a site, or has no site plan', async () => {
    await expect(prepare(deps({ intakes: [{ ...INTAKE, tenant_id: null }] }).d, 'i1')).rejects.toThrow(/isn't tied to a site/);
    await expect(prepare(deps({ intakes: [{ ...INTAKE, plan: 'free' }] }).d, 'i1')).rejects.toThrow(/no plan with a site/);
  });
});

describe('draft', () => {
  it('drafts from their own words and photos, checked against the whole site', async () => {
    const { d } = deps({ intakes: [INTAKE], intake_pieces: PIECES });
    expect(await draft(d, STATE)).toEqual({ d: 1 });
    const [, intake, mood, photos] = draftIntake.mock.calls[0] as [unknown, { pieces: { file: string }[] }, string, { base64: string }[]];
    expect(intake.pieces[0]?.file).toBe('piece-1.webp');
    expect(mood).toBe('intake.families.rustic.label');
    expect(photos).toHaveLength(1);
  });

  it('fails loudly when the drafts don’t come back right', async () => {
    draftIntake.mockResolvedValue({ ok: false, error: 'still wrong' });
    await expect(draft(deps({ intakes: [INTAKE], intake_pieces: PIECES }).d, STATE)).rejects.toThrow('still wrong');
  });
});

describe('write', () => {
  it('writes the site into the site record sign-up made, with the mood’s settings', async () => {
    const { d } = deps({ intakes: [INTAKE], intake_pieces: PIECES });
    await write(d, STATE, { d: 1 } as never);
    expect(writeSite).toHaveBeenCalledWith(expect.anything(), 't1', { planned: true }, expect.any(Function));
    expect(planSite).toHaveBeenCalledWith({ settings: { subdomain: 'saltmarsh', family: 'rustic', skin: 'main-street-tannery' } });
  });

  it('puts Scenic’s first background photo behind its page', async () => {
    const { d } = deps({ intakes: [INTAKE], intake_pieces: PIECES });
    await write(d, { ...STATE, family: 'scenic' }, { d: 1 } as never);
    expect(planSite).toHaveBeenCalledWith({ settings: expect.objectContaining({ family: 'scenic', scene: 'saltmarsh-1' }) });
  });

  it('never writes a built form twice, or a site that doesn’t check out', async () => {
    await write(deps({ intakes: [{ ...INTAKE, status: 'built' }], intake_pieces: PIECES }).d, STATE, {} as never);
    expect(writeSite).not.toHaveBeenCalled();
    planSite.mockReturnValue({ ok: false, errors: ['words: missing'] });
    await expect(write(deps({ intakes: [INTAKE], intake_pieces: PIECES }).d, STATE, {} as never)).rejects.toThrow(/words: missing/);
  });
});

describe('finish', () => {
  it('marks the form built and tells the maker their site is ready, once', async () => {
    const { d, writes, send } = deps({ intakes: [INTAKE], intake_pieces: PIECES });
    await finish(d, STATE);
    expect(writes).toContainEqual({ table: 'intakes', op: 'update', value: { status: 'built' } });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'lena@example.com', subject: 'intake.ready.subject' }));
    const again = deps({ intakes: [{ ...INTAKE, status: 'built' }], intake_pieces: PIECES });
    await finish(again.d, STATE);
    expect(again.send).not.toHaveBeenCalled();
  });
});

describe('makeBackground', () => {
  it('paints, finishes and stores a photo into the library, made for this site', async () => {
    const { d, storage } = deps({ scenes: [] });
    await makeBackground(d, STATE, 1, { picture: 'a calm shore', tags: ['shore'] });
    expect(storage.uploads).toEqual(['scenes/saltmarsh-2.webp']);
    expect(addScenes).toHaveBeenCalledWith(expect.anything(), [expect.objectContaining({ key: 'saltmarsh-2', tone: 'dark', tags: ['shore'], madeFor: 't1', source: 'generated' })]);
  });

  it('leaves a photo that’s already in the library (a retried step)', async () => {
    const { d, storage } = deps({ scenes: [{ key: 'saltmarsh-1' }] });
    await makeBackground(d, STATE, 0, { picture: 'x', tags: [] });
    expect(storage.uploads).toEqual([]);
    expect(addScenes).not.toHaveBeenCalled();
  });
});

describe('attachBackground', () => {
  it('puts the first photo behind a mood site, once', async () => {
    const { d, writes } = deps({ site_scenes: [] });
    await attachBackground(d, STATE);
    expect(writes).toEqual([{ table: 'site_scenes', op: 'insert', value: { tenant_id: 't1', scene_key: 'saltmarsh-1' } }]);
    const again = deps({ site_scenes: [{ tenant_id: 't1' }] });
    await attachBackground(again.d, STATE);
    expect(again.writes).toEqual([]);
  });

  it('does nothing on Scenic, whose page already has it', async () => {
    const { d, writes } = deps({ site_scenes: [] });
    await attachBackground(d, { ...STATE, family: 'scenic' });
    expect(writes).toEqual([]);
  });
});
