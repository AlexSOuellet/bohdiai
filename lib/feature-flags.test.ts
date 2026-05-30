import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const single = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single }),
      }),
    }),
  }),
}));

const loggerWarn = vi.fn();
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const originalNodeEnv = process.env['NODE_ENV'];

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (originalNodeEnv === undefined) {
    (process.env as Record<string, string | undefined>)['NODE_ENV'] = undefined;
  } else {
    vi.stubEnv('NODE_ENV', originalNodeEnv);
  }
  vi.unstubAllEnvs();
});

describe('isFeatureEnabled', () => {
  it('always returns true in development without hitting the DB', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('any')).resolves.toBe(true);
    expect(single).not.toHaveBeenCalled();
  });

  it('returns true when the flag is globally enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    single.mockResolvedValue({ data: { enabled: true, allowlist: [] }, error: null });
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('beta')).resolves.toBe(true);
  });

  it('returns true when the tenant is in the allowlist', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    single.mockResolvedValue({
      data: { enabled: false, allowlist: ['tenant-1', 'tenant-2'] },
      error: null,
    });
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('beta', 'tenant-1')).resolves.toBe(true);
  });

  it('returns false when the tenant is not in the allowlist', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    single.mockResolvedValue({
      data: { enabled: false, allowlist: ['tenant-1'] },
      error: null,
    });
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('beta', 'tenant-other')).resolves.toBe(false);
  });

  it('returns false when no tenantId is given and global flag is off', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    single.mockResolvedValue({
      data: { enabled: false, allowlist: ['t1'] },
      error: null,
    });
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('beta')).resolves.toBe(false);
  });

  it('returns false and warns when the DB read errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    single.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { isFeatureEnabled } = await import('./feature-flags');
    await expect(isFeatureEnabled('beta', 'tenant-1')).resolves.toBe(false);
    expect(loggerWarn).toHaveBeenCalled();
  });
});
