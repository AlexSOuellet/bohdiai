import { describe, it, expect } from 'vitest';
import { buildProfileHomes, profileFormFromHomes, normalizeBio, dialable, EMPTY_PROFILE, type ProfileForm } from './profile-form';

const form = (over: Partial<ProfileForm> = {}): ProfileForm => ({ ...EMPTY_PROFILE, ...over });

describe('buildProfileHomes', () => {
  it('turns empty fields into nulls, in each home', () => {
    expect(buildProfileHomes(form())).toEqual({
      ok: true,
      homes: {
        profile: { kicker: null, headline: null, bio: null, signature: null, makes: null, quote: null, quote_attribution: null },
        aboutTitle: null,
        marquee: null,
        phone: null,
        socials: [],
      },
    });
  });

  it('trims and collapses spaces in the one-line fields', () => {
    const r = buildProfileHomes(form({ headline: '  Burned   wood flags ', signature: ' Alex ' }));
    expect(r.ok && r.homes.profile.headline).toBe('Burned wood flags');
    expect(r.ok && r.homes.profile.signature).toBe('Alex');
  });

  it('names the field that is too long', () => {
    expect(buildProfileHomes(form({ kicker: 'x'.repeat(61) }))).toEqual({
      ok: false,
      error: 'The short line above your name is 61 characters. Keep it to 60.',
    });
    expect(buildProfileHomes(form({ bio: 'y'.repeat(5000) })).ok).toBe(true);
    expect(buildProfileHomes(form({ bio: 'y'.repeat(5001) })).ok).toBe(false);
  });

  it('keeps up to three things the maker makes, trimmed, blanks dropped', () => {
    const r = buildProfileHomes(form({ makes: ['  Burned-wood   flags ', '', 'Carved signs'] }));
    expect(r.ok && r.homes.profile.makes).toEqual(['Burned-wood flags', 'Carved signs']);
    expect(buildProfileHomes(form({ makes: ['', ' '] }))).toMatchObject({ ok: true, homes: { profile: { makes: null } } });
  });

  it('refuses more than three things, or one that is too long', () => {
    expect(buildProfileHomes(form({ makes: ['a', 'b', 'c', 'd'] }))).toEqual({ ok: false, error: 'List up to 3 things you make.' });
    expect(buildProfileHomes(form({ makes: ['x'.repeat(31)] }))).toEqual({
      ok: false,
      error: `“${'x'.repeat(31)}” is 31 characters. Keep each thing you make to 30.`,
    });
  });

  it('keeps the founder quote and who it is from, trimmed', () => {
    const r = buildProfileHomes(form({ quote: '  Every board   starts as a tree. ', quoteAttribution: ' June,  founder ' }));
    expect(r.ok && r.homes.profile.quote).toBe('Every board starts as a tree.');
    expect(r.ok && r.homes.profile.quote_attribution).toBe('June, founder');
    expect(buildProfileHomes(form({ quote: 'q'.repeat(601) }))).toEqual({ ok: false, error: 'Your quote is 601 characters. Keep it to 600.' });
  });
  it('refuses a name for the quote without the quote', () => {
    expect(buildProfileHomes(form({ quoteAttribution: 'June' }))).toEqual({ ok: false, error: 'Add the quote, or clear who it’s from.' });
  });
  it('keeps marquee phrases in order, trimmed, blanks dropped', () => {
    const r = buildProfileHomes(form({ marqueePhrases: [' Small  batch ', '', 'Poured by hand'] }));
    expect(r.ok && r.homes.marquee).toEqual(['Small batch', 'Poured by hand']);
    expect(buildProfileHomes(form({ marqueePhrases: [' '] }))).toMatchObject({ ok: true, homes: { marquee: null } });
  });
  it('refuses too many marquee phrases, or one that is too long', () => {
    expect(buildProfileHomes(form({ marqueePhrases: Array.from({ length: 13 }, (_, i) => `p${i}`) }))).toEqual({ ok: false, error: 'The marquee holds up to 12 phrases.' });
    expect(buildProfileHomes(form({ marqueePhrases: ['x'.repeat(61)] }))).toEqual({
      ok: false,
      error: `“${'x'.repeat(61)}” is 61 characters. Keep each marquee phrase to 60.`,
    });
  });
  it('accepts common phone formats and refuses non-numbers', () => {
    expect(buildProfileHomes(form({ phone: '(401) 555-0100' })).ok).toBe(true);
    expect(buildProfileHomes(form({ phone: '+1 401.555.0100' })).ok).toBe(true);
    expect(buildProfileHomes(form({ phone: 'call me' }))).toEqual({
      ok: false,
      error: 'That phone number doesn’t look right. Use digits, like (401) 555-0100.',
    });
    expect(buildProfileHomes(form({ phone: '12345' })).ok).toBe(false);
  });

  it('makes Facebook and Instagram addresses into full https links', () => {
    const r = buildProfileHomes(form({ facebookUrl: 'facebook.com/RhodyStrong', instagramUrl: '@rustic.rhody' }));
    expect(r.ok && r.homes.socials.find((x) => x.network === 'facebook')?.url).toBe('https://facebook.com/RhodyStrong');
    expect(r.ok && r.homes.socials.find((x) => x.network === 'instagram')?.url).toBe('https://www.instagram.com/rustic.rhody');
    const r2 = buildProfileHomes(form({ facebookUrl: 'http://www.facebook.com/RhodyStrong?ref=x' }));
    expect(r2.ok && r2.homes.socials.find((x) => x.network === 'facebook')?.url).toBe('https://www.facebook.com/RhodyStrong?ref=x');
  });

  it('refuses links to other sites or to the bare home page', () => {
    expect(buildProfileHomes(form({ facebookUrl: 'https://evil.com/facebook.com/x' })).ok).toBe(false);
    expect(buildProfileHomes(form({ facebookUrl: 'https://facebook.com.evil.com/x' })).ok).toBe(false);
    expect(buildProfileHomes(form({ facebookUrl: 'facebook.com' })).ok).toBe(false);
    expect(buildProfileHomes(form({ instagramUrl: 'https://facebook.com/me' })).ok).toBe(false);
  });
});

describe('normalizeBio', () => {
  it('keeps paragraphs split by blank lines and joins wrapped lines', () => {
    expect(normalizeBio('First line\nstill first.\r\n\r\n\n\nSecond.  \n\n')).toBe('First line still first.\n\nSecond.');
  });
});

describe('profileFormFromHomes', () => {
  it('fills an empty form when nothing is saved yet', () => {
    expect(profileFormFromHomes({ profile: null, aboutTitle: null, marquee: null, phone: null, socials: [] })).toEqual(EMPTY_PROFILE);
  });
  it('round-trips every piece through its home', () => {
    const filled = { kicker: 'Handmade in Rhode Island', aboutTitle: 'Meet June', phone: '(401) 555-0100', makes: ['Carved signs'], quote: 'Every board starts as a tree.', quoteAttribution: 'June', marqueePhrases: ['Small batch'], facebookUrl: 'https://facebook.com/june', instagramUrl: 'https://www.instagram.com/june' };
    const r = buildProfileHomes(form(filled));
    if (!r.ok) throw new Error('expected ok');
    const h = r.homes;
    expect(profileFormFromHomes({ profile: h.profile, aboutTitle: h.aboutTitle, marquee: h.marquee, phone: h.phone, socials: h.socials })).toEqual(form(filled));
  });
});

describe('dialable', () => {
  it('adds the US country code to a ten-digit number', () => {
    expect(dialable('(401) 555-0100')).toBe('+14015550100');
    expect(dialable('+44 20 7946 0958')).toBe('+442079460958');
  });
});
