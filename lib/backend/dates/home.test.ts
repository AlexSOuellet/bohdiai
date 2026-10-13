import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({}) }));

import { datesHomeData } from './home';

describe('datesHomeData', () => {
  it('counts the dates on the site and never nags', () => {
    expect(datesHomeData([{ id: 'a', date: '2026-10-11', endDate: '', hours: '', address: '', booth: '', url: '', canceled: false, name: 'Fair', town: '' }])).toEqual({
      tiles: [{ label: 'Markets', value: '1', note: 'on your site' }],
      attention: [],
    });
    expect(datesHomeData([]).attention).toEqual([]);
  });
});
