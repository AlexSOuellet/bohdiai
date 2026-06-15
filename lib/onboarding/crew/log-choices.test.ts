import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.fn().mockResolvedValue({ error: null });
const from = vi.fn(() => ({ insert }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ from }) }));

import { logDesignChoice, logCrewChoices } from './log-choices';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  from.mockClear();
});

describe('logDesignChoice', () => {
  it('writes a row keyed by the real tenant id, niche slug, and mood — never null', async () => {
    await logDesignChoice({
      tenantId: 'tn_123',
      nicheSlug: 'candles',
      moodKey: 'sunset',
      decisionType: 'moment-kind',
      candidates: ['video', 'image'],
      picked: { kind: 'video' },
      reasoning: 'cinematographer chose the Moment kind for this build',
    });

    expect(from).toHaveBeenCalledWith('design_choices');
    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(row['tenant_id']).toBe('tn_123');
    expect(row['niche_slug']).toBe('candles');
    expect(row['mood_key']).toBe('sunset');
    expect(row['decision_type']).toBe('moment-kind');
    expect(row['picked']).toEqual({ kind: 'video' });
  });

  it('swallows a DB error and never throws (fire-and-forget)', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'down' } });
    await expect(
      logDesignChoice({ tenantId: 't', nicheSlug: 'n', moodKey: 'm', decisionType: 'goods-treatment', candidates: [], picked: {}, reasoning: 'x' }),
    ).resolves.toBeUndefined();
  });

  it('swallows a thrown insert and never throws', async () => {
    insert.mockRejectedValueOnce(new Error('boom'));
    await expect(
      logDesignChoice({ tenantId: 't', nicheSlug: 'n', moodKey: 'm', decisionType: 'goods-treatment', candidates: [], picked: {}, reasoning: 'x' }),
    ).resolves.toBeUndefined();
  });
});

describe('logCrewChoices', () => {
  const trajectory = {
    feeling: 'the quiet hum of a workshop after hours',
    customerWhy: 'they want a piece with story, not a stock object',
    visualWorld: 'warm oak and aged brass, low light, hands at the bench',
    heroConcept: 'a chisel meeting walnut in soft side-light',
    register: 'restrained' as const,
    heroKind: 'video' as const,
  };

  it('logs the trajectory PLUS the three look-driving picks, recording what was rolled vs played', async () => {
    logCrewChoices({
      tenantId: 'tn_9',
      nicheSlug: 'woodworking',
      moodKey: 'rustic',
      trajectory,
      heroKind: 'video',
      goodsTreatment: 'procession',
      founderTreatment: 'quote',
      // goods overrode the dice ('marquee' → 'procession'); founder played its roll.
      goodsRoll: 'marquee',
      founderRoll: 'quote',
    });
    await flush();

    expect(insert).toHaveBeenCalledTimes(4);
    const rows = insert.mock.calls.map((c) => c[0] as Record<string, unknown>);
    for (const row of rows) {
      expect(row['tenant_id']).toBe('tn_9');
      expect(row['niche_slug']).toBe('woodworking');
      expect(row['mood_key']).toBe('rustic');
    }
    const byType = (t: string) => rows.find((r) => r['decision_type'] === t)!;
    // Trajectory: the Director's whole call, picklable for review later. Without
    // this, we can't tell a wrong-vision miss apart from a wrong-execution miss.
    expect(byType('trajectory')['picked']).toEqual(trajectory);
    expect(byType('moment-kind')['picked']).toEqual({ kind: 'video' });
    // the treatment rows carry the dealt roll and whether Bohdi overrode it, so
    // reconvergence (overriding back to one body) is visible in the data.
    expect(byType('goods-treatment')['picked']).toEqual({ treatment: 'procession', rolled: 'marquee', overrode: true });
    expect(byType('founder-treatment')['picked']).toEqual({ treatment: 'quote', rolled: 'quote', overrode: false });
  });
});
