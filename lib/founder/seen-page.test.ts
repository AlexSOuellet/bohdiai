import { describe, it, expect, vi } from 'vitest';

const markSeen = vi.fn();
const logError = vi.fn();
vi.mock('./seen', () => ({ markSeen: (...a: unknown[]) => markSeen(...a) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a) } }));
const { markSeenQuietly } = await import('./seen-page');

describe('markSeenQuietly', () => {
  it('marks the tab seen, and if that fails the tab still opens (logged)', async () => {
    markSeen.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('down'));
    await markSeenQuietly('reports');
    await expect(markSeenQuietly('messages')).resolves.toBeUndefined();
    expect(markSeen).toHaveBeenCalledTimes(2);
    expect(logError).toHaveBeenCalledWith('admin: mark seen failed', {
      tab: 'messages',
      error: 'down',
    });
  });
});
