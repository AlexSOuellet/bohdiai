import { describe, it, expect } from 'vitest';
import { EMPTY_MOMENT, buildMomentRow, momentFormFromRow, type MomentForm } from './moment-form';
import { momentMedia } from './queries';

const form = (over: Partial<MomentForm> = {}): MomentForm => ({ ...EMPTY_MOMENT, ...over });

describe('buildMomentRow', () => {
  it('turns empty fields into nulls and keeps the play setting', () => {
    expect(buildMomentRow(form())).toEqual({
      ok: true,
      row: { story: null, cta_label: null, cta_target: null, second_cta_label: null, second_cta_target: null, play_mode: 'once' },
    });
  });
  it('trims every field and drops blank story lines', () => {
    const r = buildMomentRow(form({ story: [' The wick ', '', ' the wax  '], ctaLabel: ' Shop ', ctaTarget: 'shop', playMode: 'always' }));
    expect(r).toMatchObject({ ok: true, row: { story: ['The wick', 'the wax'], cta_label: 'Shop', cta_target: 'shop', play_mode: 'always' } });
  });
  it('names the field that is too long', () => {
    expect(buildMomentRow(form({ ctaLabel: 'c'.repeat(41), ctaTarget: 'shop' }))).toEqual({ ok: false, error: 'The main button is 41 characters. Keep it to 40.' });
  });
  it('refuses too many story lines, or one that is too long', () => {
    expect(buildMomentRow(form({ story: Array.from({ length: 9 }, (_, i) => `line ${i}`) }))).toEqual({ ok: false, error: 'The story holds up to 8 lines.' });
    expect(buildMomentRow(form({ story: ['x'.repeat(121)] }))).toEqual({ ok: false, error: `“${'x'.repeat(121)}” is 121 characters. Keep each story line to 120.` });
  });
  it('needs a button’s words and its page together', () => {
    expect(buildMomentRow(form({ ctaLabel: 'Shop' }))).toEqual({ ok: false, error: 'Pick a page for the main button to go to.' });
    expect(buildMomentRow(form({ ctaTarget: 'shop' }))).toEqual({ ok: false, error: 'Add the words on the main button, or clear where it goes.' });
    expect(buildMomentRow(form({ ctaLabel: 'Shop', ctaTarget: 'nowhere' as MomentForm['ctaTarget'] }))).toEqual({ ok: false, error: 'Pick a page for the main button to go to.' });
    expect(buildMomentRow(form({ ctaLabel: 'Shop', ctaTarget: 'shop', secondCtaLabel: 'Story' }))).toEqual({ ok: false, error: 'Pick a page for the second button to go to.' });
  });
  it('wants the main button before a second one', () => {
    expect(buildMomentRow(form({ secondCtaLabel: 'Our story', secondCtaTarget: 'about' }))).toEqual({ ok: false, error: 'Add the main button before a second one.' });
    expect(buildMomentRow(form({ ctaLabel: 'Shop', ctaTarget: 'shop', secondCtaLabel: 'Our story', secondCtaTarget: 'about' }))).toMatchObject({
      ok: true,
      row: { second_cta_label: 'Our story', second_cta_target: 'about' },
    });
  });
  it('refuses a play setting it doesn’t know', () => {
    expect(buildMomentRow(form({ playMode: 'sometimes' as MomentForm['playMode'] }))).toEqual({ ok: false, error: 'Pick how often the story plays.' });
  });
});

describe('momentFormFromRow', () => {
  it('fills an empty form when there is no row', () => {
    expect(momentFormFromRow(null)).toEqual(EMPTY_MOMENT);
  });
  it('round-trips a saved row', () => {
    const filled = form({ story: ['The wick', 'The wax'], ctaLabel: 'Shop', ctaTarget: 'shop', secondCtaLabel: 'Our story', secondCtaTarget: 'about', playMode: 'off' });
    const r = buildMomentRow(filled);
    if (!r.ok) throw new Error('expected ok');
    expect(momentFormFromRow(r.row)).toEqual(filled);
  });
  it('drops stored places and play settings it no longer knows', () => {
    const r = buildMomentRow(form());
    if (!r.ok) throw new Error('expected ok');
    const f = momentFormFromRow({ ...r.row, cta_target: 'gone', second_cta_target: 'gone', play_mode: 'weird' });
    expect(f.ctaTarget).toBe('');
    expect(f.secondCtaTarget).toBe('');
    expect(f.playMode).toBe('once');
  });
});

describe('momentMedia', () => {
  it('is nothing without an upload or its address', () => {
    expect(momentMedia(null, null)).toBeNull();
    expect(momentMedia({ public_url: null }, null)).toBeNull();
  });
  it('reads a photo, and a video with its poster', () => {
    expect(momentMedia({ public_url: 'https://cdn/a.webp', mime_type: 'image/webp', alt_text: 'Candles on a sill' }, null)).toEqual({
      kind: 'image', url: 'https://cdn/a.webp', alt: 'Candles on a sill', posterUrl: '',
    });
    expect(momentMedia({ public_url: 'https://cdn/a.mp4', mime_type: 'video/mp4', alt_text: null }, { public_url: 'https://cdn/p.webp' })).toEqual({
      kind: 'video', url: 'https://cdn/a.mp4', alt: '', posterUrl: 'https://cdn/p.webp',
    });
    expect(momentMedia({ public_url: 'https://cdn/a' }, { public_url: null })).toMatchObject({ kind: 'image', posterUrl: '' });
  });
});
