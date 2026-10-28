import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { SHOWCASE_GALLERY, buildMySite, type SiteData } from './my-site';
import { CUSTOMER_ACCOUNTS_PATH } from './modules';
import { customerAccountsOn } from './buyers/switch';

const every = [
  { label: 'Headline', href: '/manage/headline' },
  { label: 'Scrolling line', href: '/manage/marquee' },
  { label: 'About you', href: '/manage/profile' },
  { label: 'Gallery', href: SHOWCASE_GALLERY },
  { label: 'Photos', href: '/manage/gallery' },
  { label: 'Testimonials', href: '/manage/testimonials' },
  { label: 'Contact information', href: '/manage/contact' },
  { label: 'Socials', href: '/manage/socials' },
  { label: 'Customer accounts', href: CUSTOMER_ACCOUNTS_PATH },
];

const nothing: SiteData = { moment: null, profile: null, gallery: null, testimonials: null, background: null, showcaseGallery: null, customerAccounts: null };
const blank: SiteData = {
  moment: { headline: '', sub: '', photo: null },
  profile: { aboutTitle: '', bio: '', marquee: [], phone: '', socials: [], portrait: null },
  gallery: [],
  testimonials: [],
  background: null,
  showcaseGallery: { urls: [], picked: 0 },
  customerAccounts: false,
};
const full: SiteData = {
  moment: { headline: 'Barn wood', sub: 'By hand', photo: null },
  profile: { aboutTitle: 'Hi', bio: 'I build things.', marquee: ['Barn wood', 'Paint'], phone: '705 555 0101', socials: ['Facebook', 'Instagram'], portrait: 'https://img/me.jpg' },
  gallery: ['https://img/1.jpg'],
  testimonials: [{ quote: 'Lovely', name: 'Ann' }],
  background: null,
  showcaseGallery: { urls: ['https://img/1.jpg', 'https://img/2.jpg'], picked: 2 },
  customerAccounts: true,
};

const kinds = (d: SiteData): string[] => buildMySite(every, d).parts.map((p) => p.show.kind);

describe('My site parts, every state', () => {
  it('says each part couldn’t load when its words didn’t come', () => {
    expect(new Set(kinds(nothing))).toEqual(new Set(['failed']));
  });

  it('says plainly what each part is missing', () => {
    const parts = buildMySite(every, blank).parts;
    expect(parts.every((p) => p.show.kind === 'empty')).toBe(true);
    expect(parts.find((p) => p.href === CUSTOMER_ACCOUNTS_PATH)?.show).toEqual({ kind: 'empty', text: 'Off. Customers check out without an account' });
    expect(parts.find((p) => p.href === SHOWCASE_GALLERY)?.show).toEqual({ kind: 'empty', text: 'No pieces with photos yet' });
  });

  it('shows what each part says now', () => {
    const parts = buildMySite(every, full).parts;
    expect(kinds(full)).toEqual(['headline', 'strip', 'about', 'photos', 'photos', 'quote', 'line', 'line', 'line']);
    expect(parts.find((p) => p.href === '/manage/gallery')?.show).toMatchObject({ note: 'One photo' });
    expect(parts.find((p) => p.href === SHOWCASE_GALLERY)?.show).toMatchObject({ note: '2 of 12 picked' });
    expect(parts.find((p) => p.href === '/manage/socials')?.show).toEqual({ kind: 'line', text: 'Facebook, Instagram' });
  });

  it('counts photos, and says the newest show until she picks', () => {
    const parts = buildMySite(every, { ...full, gallery: ['a', 'b', 'c'], showcaseGallery: { urls: ['a'], picked: 0 } }).parts;
    expect(parts.find((p) => p.href === '/manage/gallery')?.show).toMatchObject({ note: '3 photos' });
    expect(parts.find((p) => p.href === SHOWCASE_GALLERY)?.show).toMatchObject({ note: 'Your newest 12 show until you pick' });
  });
});

describe('the Customer accounts switch', () => {
  const db = (result: unknown) =>
    ({ from: () => ({ select: () => ({ eq: () => ({ single: async () => result }) }) }) }) as unknown as SupabaseClient<Database>;

  it('reads whether customers can make an account', async () => {
    expect(await customerAccountsOn(db({ data: { buyer_accounts_on: true }, error: null }), 't1')).toBe(true);
  });

  it('says it couldn’t read the switch', async () => {
    await expect(customerAccountsOn(db({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('Could not read the customer accounts switch: down');
  });
});
