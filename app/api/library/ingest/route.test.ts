import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── env mock ────────────────────────────────────────────────────────────────
const envToken = { value: 'test-token' as string | undefined };
vi.mock('@/lib/env', () => ({
  serverEnv: () => ({ COWORK_INGEST_TOKEN: envToken.value }),
}));

// ── logger mock (silent) ────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── supabaseAdmin mock ──────────────────────────────────────────────────────
// The route uses BOTH storage.from() and from() (the DB), so we mock a shape
// that supports both surfaces.

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const removeMock = vi.fn();
const storageFromMock = vi.fn(() => ({
  upload: uploadMock,
  getPublicUrl: getPublicUrlMock,
  remove: removeMock,
}));

// The DB from() call has two shapes we need to cover:
//   1. count read (select with head:true) — used to compute the next index
//   2. insert + select single — used to write the row
// The mock returns different chains based on the call sequence set per test.

const countResult = { count: 0, error: null as null | { message: string } };
const insertSingleResult = {
  data: { id: 'lib-1' } as null | { id: string },
  error: null as null | { message: string },
};

const dbFromMock = vi.fn((_table: string) => ({
  // Path A: counting existing rows for the next index.
  select: vi.fn(() => ({
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (r: typeof countResult) => unknown) => resolve(countResult),
    // For the insert().select('id').single() chain:
    single: () => Promise.resolve(insertSingleResult),
  })),
  // Path B: insert().select('id').single()
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: () => Promise.resolve(insertSingleResult),
    })),
  })),
}));

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: storageFromMock },
    from: dbFromMock,
  }),
}));

// ── fetch mock ──────────────────────────────────────────────────────────────
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// ── import under test AFTER mocks ──────────────────────────────────────────
import { POST } from './route';

function mkRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/library/ingest', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-token',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  nicheSlug: 'candles',
  kind: 'hero_image',
  scene: 'windowsill',
  sourceUrl: 'https://higgsfield.example/img.png',
  prompt: 'A single unlit candle on a windowsill, morning light',
  generator: 'nano_banana_pro',
  width: 2048,
  height: 1152,
};

beforeEach(() => {
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  removeMock.mockReset();
  storageFromMock.mockClear();
  dbFromMock.mockClear();
  fetchMock.mockReset();

  uploadMock.mockResolvedValue({ error: null });
  getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'https://cdn.example/public.png' } });
  removeMock.mockResolvedValue({ data: null, error: null });
  countResult.count = 0;
  countResult.error = null;
  insertSingleResult.data = { id: 'lib-1' };
  insertSingleResult.error = null;

  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });
  envToken.value = 'test-token';
});

describe('POST /api/library/ingest — auth', () => {
  it('returns 503 when COWORK_INGEST_TOKEN is not configured', async () => {
    envToken.value = undefined;
    const res = await POST(mkRequest(validBody));
    expect(res.status).toBe(503);
  });

  it('rejects a missing Authorization header', async () => {
    const req = new Request('http://localhost/api/library/ingest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects the wrong bearer token', async () => {
    const req = mkRequest(validBody, { authorization: 'Bearer wrong-token' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/library/ingest — validation', () => {
  it('rejects invalid JSON', async () => {
    const req = new Request('http://localhost/api/library/ingest', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer test-token',
      },
      body: 'not-json{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects a bad nicheSlug', async () => {
    const res = await POST(mkRequest({ ...validBody, nicheSlug: 'Bad Slug' }));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown kind', async () => {
    const res = await POST(mkRequest({ ...validBody, kind: 'banner_image' }));
    expect(res.status).toBe(400);
  });

  it('rejects a bad sourceUrl', async () => {
    const res = await POST(mkRequest({ ...validBody, sourceUrl: 'not-a-url' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/library/ingest — happy path', () => {
  it('downloads, uploads, inserts, and returns the public URL', async () => {
    const res = await POST(mkRequest(validBody));
    const body = (await res.json()) as { id: string; storagePath: string; publicUrl: string; approved: boolean };

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith('https://higgsfield.example/img.png');
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(body.storagePath).toBe('candles/candles-hero-windowsill-01.png');
    expect(body.publicUrl).toBe('https://cdn.example/public.png');
    expect(body.approved).toBe(false);
  });

  it('uses .mp4 for hero_video kind', async () => {
    const res = await POST(mkRequest({ ...validBody, kind: 'hero_video', durationMs: 3000 }));
    const body = (await res.json()) as { storagePath: string };
    expect(res.status).toBe(200);
    expect(body.storagePath).toMatch(/\.mp4$/);
  });
});

describe('POST /api/library/ingest — failure modes', () => {
  it('returns 502 when the source fetch fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
    const res = await POST(mkRequest(validBody));
    expect(res.status).toBe(502);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('returns 500 when Storage upload fails', async () => {
    uploadMock.mockResolvedValueOnce({ error: { message: 'bucket full' } });
    const res = await POST(mkRequest(validBody));
    expect(res.status).toBe(500);
  });

  it('rolls back the upload if the DB insert fails', async () => {
    insertSingleResult.data = null;
    insertSingleResult.error = { message: 'unique_violation' };
    const res = await POST(mkRequest(validBody));
    expect(res.status).toBe(500);
    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
