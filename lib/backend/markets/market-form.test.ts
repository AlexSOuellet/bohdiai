import { describe, it, expect } from 'vitest';
import { buildMarketPayload, costsTotal, emptyMarketForm, isPastMarket, normalizeUrl, type MarketForm } from './market-form';
import { MARKET_PUBLIC_COLUMNS } from '@/lib/backend/dates/dates-form';

const form = (over: Partial<MarketForm> = {}): MarketForm => ({
  ...emptyMarketForm(),
  name: ' Scituate  Art Festival ',
  date: '2026-10-10',
  endDate: '2026-10-12',
  ...over,
});

describe('buildMarketPayload', () => {
  it('builds the whole market, tidied, with empty fields as nothing', () => {
    const r = buildMarketPayload(
      form({
        hours: '10am – 5pm',
        town: 'Scituate',
        address: '1 Main St',
        booth: 'Booth 12',
        url: 'scituateartfestival.org',
        costs: [
          { description: 'Booth fee', amount: '175' },
          { description: '', amount: '' },
          { description: 'Gas', amount: '12.50' },
        ],
        organizerEmail: 'info@example.org',
        notes: 'Bring the tent\n\n\n\nLoad in at 7',
        rating: 4,
        goBack: 'yes',
        review: 'Great crowd',
      }),
    );
    expect(r).toEqual({
      ok: true,
      payload: {
        name: 'Scituate Art Festival',
        event_date: '2026-10-10',
        end_date: '2026-10-12',
        hours: '10am – 5pm',
        location: 'Scituate',
        address: '1 Main St',
        booth: 'Booth 12',
        url: 'https://scituateartfestival.org/',
        status: 'upcoming',
        organizer_name: null,
        organizer_phone: null,
        organizer_email: 'info@example.org',
        notes: 'Bring the tent\n\nLoad in at 7',
        rating: 4,
        go_back: 'yes',
        review: 'Great crowd',
        costs: [
          { description: 'Booth fee', amount_cents: 17500 },
          { description: 'Gas', amount_cents: 1250 },
        ],
      },
    });
  });

  it('keeps a canceled market, marked canceled, and a one-day market as one day', () => {
    expect(buildMarketPayload(form({ canceled: true, endDate: '2026-10-10' }))).toMatchObject({ ok: true, payload: { status: 'canceled', end_date: null, rating: null, go_back: null } });
  });

  it('says what is wrong', () => {
    expect(buildMarketPayload(form({ name: '  ' }))).toEqual({ ok: false, error: 'Add the market’s name.' });
    expect(buildMarketPayload(form({ date: '' })).ok).toBe(false);
    expect(buildMarketPayload(form({ endDate: '2026-10-01' })).ok).toBe(false);
    expect(buildMarketPayload(form({ url: 'not a site' })).ok).toBe(false);
    expect(buildMarketPayload(form({ organizerEmail: 'nope' })).ok).toBe(false);
    expect(buildMarketPayload(form({ costs: [{ description: 'Booth fee', amount: 'forty' }] }))).toEqual({ ok: false, error: 'Booth fee: type the amount, like 40 or 12.50.' });
    expect(buildMarketPayload(form({ costs: [{ description: '', amount: '40' }] }))).toEqual({ ok: false, error: 'Cost 1 needs a name, like Booth fee.' });
    expect(buildMarketPayload(form({ booth: 'x'.repeat(31) })).ok).toBe(false);
  });
});

describe('helpers', () => {
  it('makes a typed link a web address', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('http://fair.org/x')).toBe('http://fair.org/x');
    expect(normalizeUrl('localhost')).toBeNull();
  });
  it('totals the costs it can read', () => {
    expect(costsTotal([{ description: 'a', amount: '40' }, { description: 'b', amount: '12.50' }, { description: 'c', amount: '?' }])).toBe('$52.50');
  });
  it('calls a market past once its last day is gone', () => {
    expect(isPastMarket({ date: '2026-10-10', endDate: '2026-10-12' }, '2026-10-11')).toBe(false);
    expect(isPastMarket({ date: '2026-10-10', endDate: '2026-10-12' }, '2026-10-13')).toBe(true);
    expect(isPastMarket({ date: '2026-10-10', endDate: '' }, '2026-10-10')).toBe(false);
  });
  it('never lets the site read a private column', () => {
    for (const col of ['notes', 'organizer', 'rating', 'go_back', 'review', 'expenses']) expect(MARKET_PUBLIC_COLUMNS).not.toContain(col);
  });
});
