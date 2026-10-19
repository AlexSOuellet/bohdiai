import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  EMPTY_SECTION,
  SECTION_KEYS,
  SECTION_NAMES,
  buildSectionRow,
  isSectionKey,
  sectionFromRow,
  sectionsFromRows,
  type SectionWords,
} from './sections-form';

const form = (over: Partial<SectionWords> = {}): SectionWords => ({ ...EMPTY_SECTION, ...over });

describe('the shared sections', () => {
  it('match the database’s list exactly', () => {
    // The newest list: the gallery's heading joined it (20261019000002_gallery_section.sql).
    const sql = fs.readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261019000002_gallery_section.sql'), 'utf8');
    const list = /check \(section in \(([\s\S]*?)\)\)/.exec(sql)?.[1] ?? '';
    const keys = [...list.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(keys).toEqual([...SECTION_KEYS]);
  });
  it('each has a name the owner sees', () => {
    for (const k of SECTION_KEYS) expect(SECTION_NAMES[k]).not.toBe('');
  });
  it('knows its own keys', () => {
    expect(isSectionKey('markets')).toBe(true);
    expect(isSectionKey('footer')).toBe(false);
  });
});

describe('buildSectionRow', () => {
  it('turns empty fields into nulls', () => {
    expect(buildSectionRow(form())).toEqual({
      ok: true,
      row: { kicker: null, title: null, lede: null, more_label: null, more_target: null, empty_text: null, nav_label: null, page_title: null },
    });
  });
  it('trims and collapses spaces', () => {
    const r = buildSectionRow(form({ title: '  Find   me at ', lede: ' Saturdays\n on the green ', moreLabel: ' All dates ', moreTarget: 'events' }));
    expect(r).toMatchObject({ ok: true, row: { title: 'Find me at', lede: 'Saturdays on the green', more_label: 'All dates', more_target: 'events' } });
  });
  it('names the field that is too long', () => {
    expect(buildSectionRow(form({ title: 'x'.repeat(161) }))).toEqual({ ok: false, error: 'The heading is 161 characters. Keep it to 160.' });
    expect(buildSectionRow(form({ navLabel: 'n'.repeat(41) }))).toEqual({ ok: false, error: 'The name in the menu is 41 characters. Keep it to 40.' });
    expect(buildSectionRow(form({ emptyText: 'e'.repeat(200) })).ok).toBe(true);
  });
  it('refuses a link with nowhere real to go, or a place with no words', () => {
    expect(buildSectionRow(form({ moreLabel: 'See all', moreTarget: 'nowhere' as SectionWords['moreTarget'] }))).toEqual({ ok: false, error: 'Pick a page for the link to go to.' });
    expect(buildSectionRow(form({ moreTarget: 'shop' }))).toEqual({ ok: false, error: 'Add the link’s words, or clear where it goes.' });
  });
  it('allows link words without a set place (the design decides where)', () => {
    expect(buildSectionRow(form({ moreLabel: 'See everything' }))).toMatchObject({ ok: true, row: { more_label: 'See everything', more_target: null } });
  });
});

describe('sectionFromRow and sectionsFromRows', () => {
  it('fills an empty section when there is no row', () => {
    expect(sectionFromRow(null)).toEqual(EMPTY_SECTION);
  });
  it('round-trips a saved row', () => {
    const filled = form({ kicker: 'Saturdays', title: 'Find me at', lede: 'Come say hello', moreLabel: 'All dates', moreTarget: 'events', emptyText: 'No dates yet', navLabel: 'Markets', pageTitle: 'Where I’ll be' });
    const r = buildSectionRow(filled);
    if (!r.ok) throw new Error('expected ok');
    expect(sectionFromRow(r.row)).toEqual(filled);
  });
  it('drops a stored link place the site no longer knows', () => {
    const r = buildSectionRow(form({ moreLabel: 'All' }));
    if (!r.ok) throw new Error('expected ok');
    expect(sectionFromRow({ ...r.row, more_target: 'gone' }).moreTarget).toBe('');
  });
  it('gives every shared section, filling the ones a site has', () => {
    const r = buildSectionRow(form({ title: 'Kind words' }));
    if (!r.ok) throw new Error('expected ok');
    const all = sectionsFromRows([{ section: 'reviews', ...r.row }, { section: 'retired', ...r.row }]);
    expect(Object.keys(all)).toEqual([...SECTION_KEYS]);
    expect(all.reviews.title).toBe('Kind words');
    expect(all.markets).toEqual(EMPTY_SECTION);
  });
});
