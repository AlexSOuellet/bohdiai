import { describe, it, expect, vi, beforeEach } from 'vitest';

interface CookieRecord {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

const createServerClientSpy = vi.fn(
  (
    _url: string,
    _key: string,
    opts: { cookies: { getAll: () => CookieRecord[]; setAll: (c: CookieRecord[]) => void } },
  ) => ({
    __mocked: 'server-client',
    __opts: opts,
  }),
);

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) =>
    // @ts-expect-error spread into typed mock for convenience
    createServerClientSpy(...args),
}));

// Mock next/headers cookies — return a controllable in-memory store.
const cookieStore = {
  records: [] as CookieRecord[],
  setCalls: [] as CookieRecord[],
  getAll() {
    return this.records;
  },
  set(name: string, value: string, options: Record<string, unknown>) {
    this.setCalls.push({ name, value, options });
  },
};

let throwOnSet = false;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => cookieStore.getAll(),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      if (throwOnSet) throw new Error('read-only context');
      cookieStore.set(name, value, options);
    },
  }),
}));

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    createServerClientSpy.mockClear();
    cookieStore.records = [{ name: 'sb-session', value: 'abc' }];
    cookieStore.setCalls = [];
    throwOnSet = false;
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'anon-test-key';
  });

  it('wires the public URL and anon key into createServerClient', async () => {
    const { createSupabaseServerClient } = await import('./supabase-server');
    const client = await createSupabaseServerClient();
    expect(client).toMatchObject({ __mocked: 'server-client' });
    expect(createServerClientSpy).toHaveBeenCalledTimes(1);
    const [url, key] = createServerClientSpy.mock.calls[0]!;
    expect(url).toBe('https://test.supabase.co');
    expect(key).toBe('anon-test-key');
  });

  it('getAll() option forwards Next cookie store contents', async () => {
    const { createSupabaseServerClient } = await import('./supabase-server');
    await createSupabaseServerClient();
    const opts = createServerClientSpy.mock.calls[0]![2];
    expect(opts.cookies.getAll()).toEqual([{ name: 'sb-session', value: 'abc' }]);
  });

  it('setAll() forwards cookies into the Next cookie store with options', async () => {
    const { createSupabaseServerClient } = await import('./supabase-server');
    await createSupabaseServerClient();
    const opts = createServerClientSpy.mock.calls[0]![2];
    opts.cookies.setAll([
      { name: 'sb-access', value: 'tok', options: { httpOnly: true } },
      { name: 'sb-refresh', value: 'ref' /* no options — exercises ?? {} fallback */ },
    ]);
    expect(cookieStore.setCalls).toEqual([
      { name: 'sb-access', value: 'tok', options: { httpOnly: true } },
      { name: 'sb-refresh', value: 'ref', options: {} },
    ]);
  });

  it('setAll() swallows errors when called in a read-only Server Component context', async () => {
    const { createSupabaseServerClient } = await import('./supabase-server');
    await createSupabaseServerClient();
    const opts = createServerClientSpy.mock.calls[0]![2];
    throwOnSet = true;
    // Should not throw — caught + ignored by design.
    expect(() => opts.cookies.setAll([{ name: 'a', value: 'b' }])).not.toThrow();
    expect(cookieStore.setCalls).toEqual([]);
  });
});
