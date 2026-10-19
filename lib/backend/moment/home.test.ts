import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({}) }));

import { headlineHomeData } from './home';

describe('headlineHomeData', () => {
  it('sends a missing headline to the Headline screen, never About you', () => {
    expect(headlineHomeData('  ').attention).toEqual(['Your page has no headline yet. Add one under Headline.']);
    expect(headlineHomeData('Lena Hart Decoupage')).toEqual({ tiles: [], attention: [] });
  });
});
