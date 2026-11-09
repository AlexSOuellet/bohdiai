import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const currentSubscription = vi.fn();
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription: (...a: unknown[]) => currentSubscription(...a) }));
const { planHow } = await import('./how');

const db = {} as SupabaseClient<Database>;

describe('planHow', () => {
  it('the demo works its billing out itself, whatever else is true', async () => {
    expect(await planHow(db, 't1', true, { comp: 'free' })).toEqual({ how: 'demo' });
    expect(currentSubscription).not.toHaveBeenCalled();
  });
  it('a site free for this maker has nothing to charge', async () => {
    expect(await planHow(db, 't1', false, { comp: 'free' })).toEqual({ how: 'comp' });
  });
  it('a site Stripe bills changes through Stripe; one it doesn’t (a sample) goes through Alex', async () => {
    currentSubscription.mockResolvedValueOnce({ stripeId: 'sub_1' });
    expect(await planHow(db, 't1', false, { comp: null })).toEqual({ how: 'stripe', stripeId: 'sub_1' });
    currentSubscription.mockResolvedValueOnce(null);
    expect(await planHow(db, 't1', false, { comp: 'showcase' })).toEqual({ how: 'alex' });
    expect(currentSubscription).toHaveBeenCalledWith(db, 't1');
  });
});
