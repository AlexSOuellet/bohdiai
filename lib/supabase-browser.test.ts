import { describe, it, expect, vi, beforeEach } from 'vitest';

const createBrowserClientSpy = vi.fn(() => ({ __mocked: 'browser-client' }));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientSpy(...(args as [])),
}));

describe('createSupabaseBrowserClient', () => {
  beforeEach(() => {
    createBrowserClientSpy.mockClear();
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'anon-test-key';
  });

  it('calls createBrowserClient with the public Supabase URL and anon key', async () => {
    const { createSupabaseBrowserClient } = await import('./supabase-browser');
    const client = createSupabaseBrowserClient();
    expect(client).toEqual({ __mocked: 'browser-client' });
    expect(createBrowserClientSpy).toHaveBeenCalledTimes(1);
    expect(createBrowserClientSpy).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'anon-test-key',
    );
  });
});
