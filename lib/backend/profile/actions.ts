'use server';

/**
 * About you — save (card site spec). Re-checks the acting site and its `profile`
 * switch on the server, re-validates, and writes through the person's own client
 * so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storeSitePhoto } from '@/lib/backend/site-photo';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { buildProfileHomes, EMPTY_PROFILE, type ProfileForm } from './profile-form';

/** Each screen saves only its own pieces; the rest of the form is ignored. */
export type AboutForm = Pick<ProfileForm, 'aboutTitle' | 'bio' | 'quote' | 'quoteAttribution'>;
export type ContactForm = { phone: string; email: string };
export type SocialsForm = Pick<ProfileForm, 'facebookUrl' | 'instagramUrl'>;

const OFF = 'About you isn’t switched on for this site.';
const NOT_SAVED = 'Your changes couldn’t be saved. Try again in a moment.';

async function profileSite(): Promise<{ tenantId: string } | null> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('profile') ? { tenantId: site.tenantId } : null;
}

function failed(what: string, tenantId: string, error: { code?: string; message: string }): DoneResult {
  if (error.code === '42501') return { ok: false, error: 'You don’t have access to change this site.' };
  logger.error(`profile: ${what} save failed`, { tenantId, code: error.code, error: error.message });
  return { ok: false, error: NOT_SAVED };
}

function saved(path: string): DoneResult {
  revalidatePath(path);
  revalidatePath('/manage');
  return { ok: true };
}

/** About you: the about heading, the story, the quote and who it's from. */
export async function saveAbout(form: AboutForm): Promise<DoneResult> {
  const site = await profileSite();
  if (site === null) return { ok: false, error: OFF };
  const built = buildProfileHomes({ ...EMPTY_PROFILE, aboutTitle: form.aboutTitle, bio: form.bio, quote: form.quote, quoteAttribution: form.quoteAttribution });
  if (!built.ok) return built;
  const { bio, quote, quote_attribution } = built.homes.profile;
  const db = await createSupabaseServerClient();
  const p = await db.from('site_profiles').upsert({ tenant_id: site.tenantId, bio, quote, quote_attribution });
  if (p.error !== null) return failed('about', site.tenantId, p.error);
  const a = await db.from('site_sections').upsert({ tenant_id: site.tenantId, section: 'about', title: built.homes.aboutTitle });
  if (a.error !== null) return failed('about heading', site.tenantId, a.error);
  return saved('/manage/profile');
}

/** The scrolling line's phrases, in the owner's order. None clears it. */
export async function saveMarquee(phrases: string[]): Promise<DoneResult> {
  const site = await profileSite();
  if (site === null) return { ok: false, error: OFF };
  if (!Array.isArray(phrases) || phrases.some((x) => typeof x !== 'string')) return { ok: false, error: NOT_SAVED };
  const built = buildProfileHomes({ ...EMPTY_PROFILE, marqueePhrases: phrases });
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const r = built.homes.marquee === null
    ? await db.from('site_marquees').delete().eq('tenant_id', site.tenantId)
    : await db.from('site_marquees').upsert({ tenant_id: site.tenantId, phrases: built.homes.marquee });
  if (r.error !== null) return failed('scrolling line', site.tenantId, r.error);
  return saved('/manage/marquee');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Contact information: the phone shown on the site, and the email address its contact messages go to. */
export async function saveContact(form: ContactForm): Promise<DoneResult> {
  const site = await profileSite();
  if (site === null) return { ok: false, error: OFF };
  const built = buildProfileHomes({ ...EMPTY_PROFILE, phone: String(form.phone ?? '') });
  if (!built.ok) return built;
  const email = String(form.email ?? '').trim();
  if (email !== '' && !EMAIL.test(email)) return { ok: false, error: 'That email address doesn’t look right. Use one like you@example.com.' };
  const db = await createSupabaseServerClient();
  const c = built.homes.phone === null
    ? await db.from('site_contacts').delete().eq('tenant_id', site.tenantId)
    : await db.from('site_contacts').upsert({ tenant_id: site.tenantId, phone: built.homes.phone });
  if (c.error !== null) return failed('contact', site.tenantId, c.error);
  const t = await db.from('tenants').update({ contact_email: email === '' ? null : email }).eq('id', site.tenantId);
  if (t.error !== null) return failed('contact email', site.tenantId, t.error);
  return saved('/manage/contact');
}

/** Socials: the accounts linked from the site's footer. A blank one is removed. */
export async function saveSocials(form: SocialsForm): Promise<DoneResult> {
  const site = await profileSite();
  if (site === null) return { ok: false, error: OFF };
  const built = buildProfileHomes({ ...EMPTY_PROFILE, facebookUrl: String(form.facebookUrl ?? ''), instagramUrl: String(form.instagramUrl ?? '') });
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const d = await db.from('site_socials').delete().eq('tenant_id', site.tenantId);
  if (d.error !== null) return failed('socials', site.tenantId, d.error);
  if (built.homes.socials.length > 0) {
    const i = await db.from('site_socials').insert(built.homes.socials.map((x) => ({ tenant_id: site.tenantId, ...x })));
    if (i.error !== null) return failed('socials', site.tenantId, i.error);
  }
  return saved('/manage/socials');
}

export type PortraitResult = { ok: true; url: string } | { ok: false; error: string };

/** The maker's portrait: stored as an upload and linked from About you. The old
 *  upload is kept (old photos stay reusable); only the link moves. */
export async function uploadPortrait(formData: FormData): Promise<PortraitResult> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) return { ok: false, error: 'About you isn’t switched on for this site.' };
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: user.id, folder: 'portrait', file: formData.get('file') });
  if (!stored.ok) return stored;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_profiles').upsert({ tenant_id: site.tenantId, portrait_upload_id: stored.uploadId });
  if (error !== null) {
    logger.error('profile: portrait link failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be set as your portrait. Try again.' };
  }
  revalidatePath('/manage/profile');
  return { ok: true, url: stored.url };
}

export async function removePortrait(): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) return { ok: false, error: 'About you isn’t switched on for this site.' };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_profiles').update({ portrait_upload_id: null }).eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('profile: portrait remove failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The portrait couldn’t be removed. Try again in a moment.' };
  }
  revalidatePath('/manage/profile');
  return { ok: true };
}
