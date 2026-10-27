import { describe, it, expect } from 'vitest';
import { SHOWCASE_GALLERY_ITEM, buildMySite, homeSectionRows, type SiteData } from './my-site';

const items = [
  { label: 'Headline', href: '/manage/headline' },
  { label: 'Background', href: '/manage/background' },
  { label: 'About you', href: '/manage/profile' },
  { label: 'Scrolling line', href: '/manage/marquee' },
  { label: 'Contact information', href: '/manage/contact' },
  { label: 'Socials', href: '/manage/socials' },
  { label: 'Testimonials', href: '/manage/testimonials' },
  { label: 'QR code', href: '/manage/qr' },
];

const data: SiteData = {
  moment: { headline: 'Rustic pieces for real homes', sub: 'Made by hand', photo: 'https://img/opening.jpg' },
  profile: { aboutTitle: 'Hi, I’m Renée', bio: 'I build things from old barn wood.', marquee: ['Barn wood', 'Hand painted'], phone: '', socials: ['Facebook'], portrait: null },
  gallery: null,
  testimonials: [],
  background: 'https://img/wood.jpg',
  showcaseGallery: null,
  customerAccounts: null,
};

describe('My site', () => {
  it('shows Customer accounts last among the parts, on or off (Full, Alex 2026-10-27)', () => {
    const full = [...items, { label: 'Customer accounts', href: '/manage/customer-accounts' }];
    const last = (on: boolean | null) => buildMySite(full, { ...data, customerAccounts: on }).parts.at(-1);
    expect(last(true)).toEqual({ label: 'Customer accounts', href: '/manage/customer-accounts', show: { kind: 'line', text: 'On. Customers can sign in on your site' } });
    expect(last(false)?.show).toEqual({ kind: 'empty', text: 'Off. Customers check out without an account' });
    expect(last(null)?.show).toEqual({ kind: 'failed' });
  });

  it('lists the parts of her page in the order a visitor meets them, and the whole-site tools apart', () => {
    const { parts, tools } = buildMySite(items, data);
    expect(parts.map((p) => p.label)).toEqual(['Headline', 'Scrolling line', 'About you', 'Testimonials', 'Contact information', 'Socials']);
    expect(tools.map((t) => t.label)).toEqual(['Background', 'QR code']);
  });

  it('shows what each part says now, and says plainly what is missing', () => {
    const show = (label: string) => buildMySite(items, data).parts.find((p) => p.label === label)?.show;
    expect(show('Headline')).toEqual({ kind: 'headline', headline: 'Rustic pieces for real homes', sub: 'Made by hand', photo: 'https://img/opening.jpg' });
    expect(show('Scrolling line')).toMatchObject({ kind: 'strip' });
    expect(show('Contact information')).toEqual({ kind: 'empty', text: 'No phone number yet' });
    expect(show('Testimonials')).toEqual({ kind: 'empty', text: 'No kind words added yet' });
    expect(show('Socials')).toEqual({ kind: 'line', text: 'Facebook' });
  });

  it('shows her background photo on its tool', () => {
    expect(buildMySite(items, data).tools[0]).toMatchObject({ label: 'Background', photo: 'https://img/wood.jpg' });
  });

  it('says a part couldn’t load instead of showing it empty', () => {
    const { parts } = buildMySite(items, { ...data, profile: null });
    expect(parts.find((p) => p.label === 'About you')?.show).toEqual({ kind: 'failed' });
  });

  it('on Showcase, shows her gallery picks after About you, opening Products', () => {
    const withGallery = [...items, SHOWCASE_GALLERY_ITEM];
    const { parts } = buildMySite(withGallery, { ...data, showcaseGallery: { urls: ['https://img/a.jpg'], picked: 1 } });
    expect(parts.map((p) => p.label).slice(0, 4)).toEqual(['Headline', 'Scrolling line', 'About you', 'Gallery']);
    expect(parts.find((p) => p.label === 'Gallery')).toMatchObject({ href: '/manage/products', show: { kind: 'photos', note: '1 of 12 picked' } });
    expect(buildMySite(withGallery, { ...data, showcaseGallery: { urls: ['https://img/a.jpg'], picked: 0 } }).parts.find((p) => p.label === 'Gallery')?.show).toMatchObject({
      note: 'Your newest 12 show until you pick',
    });
  });

  it('leaves out parts her site doesn’t have', () => {
    expect(buildMySite([{ label: 'Headline', href: '/manage/headline' }], data).parts.map((p) => p.label)).toEqual(['Headline']);
  });
});

describe('On your home page (Alex, 2026-10-27)', () => {
  it('gives each section its plain name, her heading, and whether it shows', () => {
    const rows = homeSectionRows(['about', 'gallery', 'reviews'], new Map([['reviews', false]]), new Map([['about', 'Hi, I’m Renée']]));
    expect(rows).toEqual([
      { section: 'about', label: 'About you', heading: 'Hi, I’m Renée', on: true },
      { section: 'gallery', label: 'Gallery', heading: '', on: false },
      { section: 'reviews', label: 'Testimonials', heading: '', on: false },
    ]);
  });
});
