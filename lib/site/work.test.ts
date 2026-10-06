import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { WORK, CLIENTS, SAMPLES, LISTED_SAMPLES, HERO_WORK } from './work';

describe('the work list', () => {
  it('has two clients, one listed sample per plan on the home page (Maker Showcase, Maker Lite, Contractor Full, Contractor Lead Generation), and the rest kept for the samples page', () => {
    expect(CLIENTS.map((w) => w.name)).toEqual([
      'Cut-Pro Lawncare & Construction',
      'Decoupage Digital Designs',
    ]);
    expect(SAMPLES.map((w) => [w.name, w.plan])).toEqual([
      ['Rustic Rhody', 'Showcase'],
      ['Classic Loafs', 'Lite'],
      ['Twilight to Darkness', 'Full'],
      ['True Coat Painting', 'Contractor Full'],
      ['Halfmoon Roofing', 'Contractor Lead Generation'],
      ['Heavenly Scents', 'Full'],
      ['Paper & Patina', 'Showcase'],
      ['Ember & Pine', 'Showcase'],
    ]);
    expect(LISTED_SAMPLES.map((w) => w.name)).toEqual(['Rustic Rhody', 'Classic Loafs', 'True Coat Painting', 'Halfmoon Roofing']);
    expect(WORK).toEqual([...CLIENTS, ...LISTED_SAMPLES]);
    expect(CLIENTS.every((w) => w.kind === 'client')).toBe(true);
    expect(SAMPLES.every((w) => w.kind === 'sample')).toBe(true);
  });

  it('cycles samples only in the hero, Knotty Knits among them without being a bannered sample', () => {
    expect(HERO_WORK.map((w) => w.name)).toEqual([
      'Rustic Rhody',
      'Paper & Patina',
      'Classic Loafs',
      'Knotty Knits',
      'Twilight to Darkness',
      'Heavenly Scents',
    ]);
    expect(HERO_WORK.every((w) => w.kind === 'sample')).toBe(true);
    expect(SAMPLES.some((w) => w.slug === 'knotty-knits')).toBe(false);
    for (const w of HERO_WORK) expect(existsSync(path.join(process.cwd(), 'public', w.shot))).toBe(true);
  });

  it('gives every site an https url whose host is what the address bar shows', () => {
    for (const w of WORK) {
      expect(new URL(w.url).protocol).toBe('https:');
      expect(new URL(w.url).host).toBe(w.host);
    }
  });

  it('has a screenshot on disk for every site', () => {
    for (const w of WORK) expect(existsSync(path.join(process.cwd(), 'public', w.shot))).toBe(true);
  });

  it('only shows testimonials on client work, each with its highlight in the paragraph that shows first', () => {
    expect(SAMPLES.every((w) => w.testimonials.length === 0)).toBe(true);
    for (const w of CLIENTS) {
      for (const q of w.testimonials) expect(q.paragraphs[0]).toContain(q.highlight);
    }
    expect(CLIENTS[0]?.testimonials.map((q) => q.name)).toEqual([
      'Sheri Giannattasio',
      'Chris Bullock',
    ]);
  });

  it('never mentions follower counts', () => {
    for (const w of WORK) expect(w.blurb).not.toMatch(/follower|thousand|\d+k/i);
  });
});
