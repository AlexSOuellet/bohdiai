/**
 * My site (the redesign, 2026-10-27): every part of her site on one page, top to
 * bottom the way a visitor meets it, each showing what it says now and opening
 * its own screen. The tools that work on the whole site sit beside it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import type { NavItem } from './modules';
import { getMoment } from './moment/queries';
import { getPortraitUrl, getProfileForm } from './profile/queries';
import { listGallery } from './gallery/queries';
import { listTestimonials } from './testimonials/queries';
import { getBackgroundView } from './scene/background';
import { listProducts } from './catalog/queries';
import { GALLERY_MAX } from '@/lib/catalog/home';

/** What a part shows of itself on My site. */
export type PartShow =
  | { kind: 'headline'; headline: string; sub: string; photo: string | null }
  | { kind: 'strip'; text: string }
  | { kind: 'about'; title: string; bio: string; portrait: string | null }
  | { kind: 'photos'; urls: string[]; note: string }
  | { kind: 'quote'; quote: string; name: string; total: number }
  | { kind: 'line'; text: string }
  | { kind: 'empty'; text: string }
  | { kind: 'failed' };

export type SitePart = { label: string; href: string; show: PartShow };
export type SiteTool = { label: string; href: string; line: string; photo: string | null };

/** Showcase's gallery: the pieces she ticks on Products (Plan-Backends, Showcase). */
export const SHOWCASE_GALLERY = '/manage/products';
export const SHOWCASE_GALLERY_ITEM: NavItem = { label: 'Gallery', href: SHOWCASE_GALLERY };

/** The parts of the page, in the order a visitor meets them. */
const PAGE_ORDER = ['/manage/headline', '/manage/marquee', '/manage/profile', SHOWCASE_GALLERY, '/manage/gallery', '/manage/testimonials', '/manage/contact', '/manage/socials'];
/** The tools that work on the whole site. */
const TOOL_LINES: Readonly<Record<string, string>> = {
  '/manage/background': 'The photo behind your pages',
  '/manage/looks': 'See your site in every mood and keep the one you like',
  '/manage/qr': 'A printable code that opens your site',
};

export type SiteData = {
  moment: { headline: string; sub: string; photo: string | null } | null;
  profile: { aboutTitle: string; bio: string; marquee: string[]; phone: string; socials: string[]; portrait: string | null } | null;
  gallery: string[] | null;
  /** Showcase: the ticked pieces' photos (or her newest until she ticks any). */
  showcaseGallery: { urls: string[]; picked: number } | null;
  testimonials: { quote: string; name: string }[] | null;
  background: string | null;
};

const failed: PartShow = { kind: 'failed' };

function showFor(href: string, d: SiteData): PartShow {
  switch (href) {
    case '/manage/headline':
      if (d.moment === null) return failed;
      return d.moment.headline === '' ? { kind: 'empty', text: 'No headline yet' } : { kind: 'headline', ...d.moment };
    case '/manage/marquee':
      if (d.profile === null) return failed;
      return d.profile.marquee.length === 0 ? { kind: 'empty', text: 'Nothing scrolling yet' } : { kind: 'strip', text: d.profile.marquee.join('  ·  ') };
    case '/manage/profile':
      if (d.profile === null) return failed;
      return d.profile.bio === '' ? { kind: 'empty', text: 'Your story isn’t written yet' } : { kind: 'about', title: d.profile.aboutTitle, bio: d.profile.bio, portrait: d.profile.portrait };
    case '/manage/gallery':
      if (d.gallery === null) return failed;
      return d.gallery.length === 0 ? { kind: 'empty', text: 'No photos yet' } : { kind: 'photos', urls: d.gallery.slice(0, 6), note: d.gallery.length === 1 ? 'One photo' : `${d.gallery.length} photos` };
    case SHOWCASE_GALLERY:
      if (d.showcaseGallery === null) return failed;
      if (d.showcaseGallery.urls.length === 0) return { kind: 'empty', text: 'No pieces with photos yet' };
      return {
        kind: 'photos',
        urls: d.showcaseGallery.urls.slice(0, 6),
        note: d.showcaseGallery.picked === 0 ? `Your newest ${GALLERY_MAX} show until you pick` : `${d.showcaseGallery.picked} of ${GALLERY_MAX} picked`,
      };
    case '/manage/testimonials': {
      if (d.testimonials === null) return failed;
      const first = d.testimonials[0];
      return first === undefined ? { kind: 'empty', text: 'No kind words added yet' } : { kind: 'quote', quote: first.quote, name: first.name, total: d.testimonials.length };
    }
    case '/manage/contact':
      if (d.profile === null) return failed;
      return d.profile.phone === '' ? { kind: 'empty', text: 'No phone number yet' } : { kind: 'line', text: d.profile.phone };
    case '/manage/socials':
      if (d.profile === null) return failed;
      return d.profile.socials.length === 0 ? { kind: 'empty', text: 'No social pages linked yet' } : { kind: 'line', text: d.profile.socials.join(', ') };
    default:
      return { kind: 'empty', text: '' };
  }
}

/** Her group's screens, split into the page's parts (in visitor order) and the tools. */
export function buildMySite(items: readonly NavItem[], data: SiteData): { parts: SitePart[]; tools: SiteTool[] } {
  const parts = PAGE_ORDER.flatMap((href) => {
    const item = items.find((i) => i.href === href);
    return item === undefined ? [] : [{ label: item.label, href, show: showFor(href, data) }];
  });
  const tools = items.flatMap((item) => {
    const line = TOOL_LINES[item.href];
    return line === undefined ? [] : [{ label: item.label, href: item.href, line, photo: item.href === '/manage/background' ? data.background : null }];
  });
  return { parts, tools };
}

async function attempt<T>(what: string, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    logger.error(`my site: ${what} failed`, { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/** Loads only what her parts need; a part whose words couldn't load says so. */
export async function loadSiteData(db: SupabaseClient<Database>, tenantId: string, items: readonly NavItem[]): Promise<SiteData> {
  const has = (href: string): boolean => items.some((i) => i.href === href);
  const needsProfile = ['/manage/profile', '/manage/marquee', '/manage/contact', '/manage/socials'].some(has);
  const [moment, profile, gallery, testimonials, background, showcaseGallery] = await Promise.all([
    has('/manage/headline')
      ? attempt('headline', async () => {
          const m = await getMoment(db, tenantId);
          return { headline: m.headline, sub: m.sub, photo: m.media?.kind === 'image' ? m.media.url : m.media?.posterUrl || null };
        })
      : null,
    needsProfile
      ? attempt('about you', async () => {
          const [p, portrait] = await Promise.all([getProfileForm(db, tenantId), getPortraitUrl(db, tenantId)]);
          const socials = [p.facebookUrl === '' ? null : 'Facebook', p.instagramUrl === '' ? null : 'Instagram'].filter((s): s is string => s !== null);
          return { aboutTitle: p.aboutTitle, bio: p.bio, marquee: p.marqueePhrases, phone: p.phone, socials, portrait };
        })
      : null,
    has('/manage/gallery') ? attempt('gallery', async () => (await listGallery(db, tenantId)).map((g) => g.url)) : null,
    has('/manage/testimonials') ? attempt('testimonials', async () => (await listTestimonials(db, tenantId)).map((t) => ({ quote: t.quote, name: t.name }))) : null,
    has('/manage/background')
      ? attempt('background', async () => {
          const b = await getBackgroundView(db, tenantId);
          return b.own ?? b.scenic?.url ?? null;
        })
      : null,
    has(SHOWCASE_GALLERY)
      ? attempt('gallery picks', async () => {
          const live = (await listProducts(db, tenantId)).filter((p) => p.status === 'active');
          const picked = live.filter((p) => p.inGallery);
          const shown = (picked.length === 0 ? live : picked).slice(0, GALLERY_MAX);
          return { urls: shown.flatMap((p) => (p.photoUrl === null ? [] : [p.photoUrl])), picked: picked.length };
        })
      : null,
  ]);
  return { moment, profile, gallery, testimonials, background, showcaseGallery };
}
