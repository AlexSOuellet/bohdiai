import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getIntakeWords } from './queries';

const warn = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { warn: (...a: unknown[]) => warn(...a), error: vi.fn(), info: vi.fn() } }));

function db(result: { data: { key: string; text: string }[] | null; error: { message: string } | null }) {
  const like = vi.fn(() => Promise.resolve(result));
  return { client: { from: () => ({ select: () => ({ like }) }) } as unknown as SupabaseClient<Database>, like };
}

describe('getIntakeWords', () => {
  it('lays the form’s words into its spots and logs the empty ones', async () => {
    const { client, like } = db({ data: [{ key: 'intake.send.button', text: 'Send it to me' }], error: null });
    const words = await getIntakeWords(client);
    expect(like).toHaveBeenCalledWith('key', 'intake.%');
    expect(words.send.button).toBe('Send it to me');
    expect(words.send.sending).toBe('');
    expect(warn).toHaveBeenCalledWith('intake words: spots with no word', expect.objectContaining({ missing: expect.arrayContaining(['intake.send.sending']) }));
  });

  it('a full set logs nothing', async () => {
    warn.mockClear();
    const { wordKeys } = await import('@/lib/site-words/words');
    const { INTAKE_WORD_SPOTS } = await import('./words');
    const { client } = db({ data: wordKeys(INTAKE_WORD_SPOTS, 'intake').map((key) => ({ key, text: 'x' })), error: null });
    await getIntakeWords(client);
    expect(warn).not.toHaveBeenCalled();
  });

  it('a failed read throws, so the page shows its error', async () => {
    const { client } = db({ data: null, error: { message: 'down' } });
    await expect(getIntakeWords(client)).rejects.toThrow('down');
    const empty = db({ data: null, error: null });
    expect((await getIntakeWords(empty.client)).page.title).toBe('');
  });
});
