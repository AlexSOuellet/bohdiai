/**
 * Each plan's first steps on Home (the ladder, Alex 2026-10-24; built in the
 * redesign, 2026-10-27). Showcase gets her site ready; Market gets her ready to
 * sell at her events; Full starts her selling online. A plan's steps start where
 * the plan below ended: any step from a lower plan still undone comes first. A
 * step is done when the thing it asks for exists, so nothing is stored; a plan's
 * steps go once they're all done and Home settles into its everyday view.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { SitePlan } from './plan/plan';
import type { FeatureKey } from './features';
import { squareLink } from '@/lib/square/connection';
import { paypalLink } from '@/lib/paypal/connection';

export type Step = { key: string; label: string; href: string; done: boolean };
export type Steps = { title: string; steps: Step[] };

/** What the steps are worked out from. */
export type StepFacts = {
  draft: boolean;
  headline: string;
  bio: string;
  phone: string;
  socials: number;
  galleryPicks: number;
  unpriced: number;
  squareConnected: boolean;
  onlinePayments: boolean;
  nextEvent: { id: string; name: string; bringing: number } | null;
  collections: number;
  morePhotos: boolean;
  promotions: number;
};

const n = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

function siteSteps(f: StepFacts, on: ReadonlySet<FeatureKey>): Step[] {
  return [
    { key: 'headline', label: 'Write the headline at the top of your site', href: '/manage/headline', done: f.headline.trim() !== '' },
    { key: 'story', label: 'Tell your story', href: '/manage/profile', done: f.bio.trim() !== '' },
    ...(on.has('gallery_pieces') ? [{ key: 'gallery', label: 'Pick up to 12 pieces for your gallery', href: '/manage/products', done: f.galleryPicks > 0 }] : []),
    { key: 'reach', label: 'Add how people can reach you', href: f.phone === '' && f.socials === 0 ? '/manage/contact' : '/manage/socials', done: f.phone !== '' || f.socials > 0 },
    { key: 'publish', label: 'Publish your site', href: '#bk-publish', done: !f.draft },
  ];
}

function marketSteps(f: StepFacts): Step[] {
  const next = f.nextEvent;
  return [
    { key: 'prices', label: f.unpriced === 0 ? 'Put a price on every piece' : `Put a price on every piece (${n(f.unpriced, 'has', 'have')} none)`, href: '/manage/products', done: f.unpriced === 0 },
    { key: 'square', label: 'Connect Square to take cards at your table', href: '/manage/payments', done: f.squareConnected },
    next === null
      ? { key: 'event', label: 'Add your next event', href: '/manage/markets/new', done: false }
      : { key: 'bring', label: `Pick what you’re bringing to ${next.name}`, href: `/manage/markets/${next.id}?tab=bringing`, done: next.bringing > 0 },
  ];
}

function fullSteps(f: StepFacts): Step[] {
  return [
    { key: 'online', label: 'Connect a way to take payments online', href: '/manage/payments', done: f.onlinePayments },
    { key: 'collection', label: 'Group your pieces into a collection', href: '/manage/collections', done: f.collections > 0 },
    { key: 'photos', label: 'Add more photos to your pieces', href: '/manage/products', done: f.morePhotos },
    { key: 'promotion', label: 'Try a sale or a discount code', href: '/manage/promotions', done: f.promotions > 0 },
  ];
}

const TITLES: Record<SitePlan, string> = {
  showcase: 'Get your site ready',
  lite: 'Get ready to sell at your events',
  full: 'Start selling online',
};

/** Her plan's steps, with any undone step from the plans below first; null once all done. */
export function firstSteps(plan: SitePlan, f: StepFacts, on: ReadonlySet<FeatureKey>): Steps | null {
  const own = plan === 'showcase' ? siteSteps(f, on) : plan === 'lite' ? marketSteps(f) : fullSteps(f);
  // On Full, connecting any way to get paid covers Market's Square step (any one is enough, Alex 2026-10-25).
  const below = plan === 'showcase' ? [] : plan === 'lite' ? siteSteps(f, on) : [...siteSteps(f, on), ...marketSteps(f).filter((s) => s.key !== 'square')];
  const steps = [...below.filter((s) => !s.done), ...own];
  return steps.every((s) => s.done) ? null : { title: TITLES[plan], steps };
}

type Db = SupabaseClient<Database>;

function must<T>(r: { data: T; error: { message: string } | null }, what: string): T {
  if (r.error !== null) throw new Error(`Could not load ${what}: ${r.error.message}`);
  return r.data;
}

/** Reads what the steps need. `next` is the soonest event that isn't over. `admin`
 *  (the server's own key) reads only whether Square and PayPal are connected: their
 *  homes are locked to everyone else, and no key ever leaves them. */
export async function loadStepFacts(db: Db, admin: Db, tenantId: string, input: { draft: boolean; next: { id: string; name: string } | null }): Promise<StepFacts> {
  const [moment, profile, contact, socials, listings, square, paypal, tenant, collections, promotions, bringing] = await Promise.all([
    db.from('site_moments').select('headline').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_profiles').select('bio').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_contacts').select('phone').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_socials').select('network', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('listings').select('base_price_cents, media_ids, in_gallery, listing_variants(price_cents, status)').eq('tenant_id', tenantId).eq('status', 'active').in('listing_type', ['product', 'digital_product']).is('deleted_at', null),
    squareLink(admin, tenantId),
    paypalLink(admin, tenantId),
    db.from('tenants').select('stripe_account_id').eq('id', tenantId).maybeSingle(),
    db.from('collections').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('deleted_at', null),
    db.from('promotions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    input.next === null
      ? Promise.resolve({ count: 0, error: null })
      : db.from('market_listings').select('listing_id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('event_id', input.next.id),
  ]);
  const rows = must(listings, 'your products') ?? [];
  const priced = (r: (typeof rows)[number]): boolean =>
    (r.base_price_cents ?? 0) > 0 || r.listing_variants.some((v) => v.status === 'active' && (v.price_cents ?? 0) > 0);
  for (const [r, what] of [[socials, 'your socials'], [collections, 'your collections'], [promotions, 'your promotions'], [bringing, 'what you’re bringing']] as const) {
    if (r.error !== null) throw new Error(`Could not load ${what}: ${r.error.message}`);
  }
  return {
    draft: input.draft,
    headline: must(moment, 'your headline')?.headline ?? '',
    bio: must(profile, 'your story')?.bio ?? '',
    phone: must(contact, 'your contact information')?.phone ?? '',
    socials: socials.count ?? 0,
    galleryPicks: rows.filter((r) => r.in_gallery).length,
    unpriced: rows.filter((r) => !priced(r)).length,
    squareConnected: square !== null,
    onlinePayments: square !== null || paypal !== null || (must(tenant, 'your site')?.stripe_account_id ?? null) !== null,
    nextEvent: input.next === null ? null : { ...input.next, bringing: bringing.count ?? 0 },
    collections: collections.count ?? 0,
    morePhotos: rows.some((r) => r.media_ids.length > 1),
    promotions: promotions.count ?? 0,
  };
}
