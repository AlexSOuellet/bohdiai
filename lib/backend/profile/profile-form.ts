/**
 * About you (card site spec): the words and contact details the owner edits.
 * The form holds plain strings; an empty field means "not set". Validation turns
 * the form into the `site_profiles` row and names the field that needs fixing.
 */

export type ProfileForm = {
  kicker: string;
  headline: string;
  aboutTitle: string;
  bio: string;
  signature: string;
  phone: string;
  facebookUrl: string;
  instagramUrl: string;
};

export type ProfileRow = {
  kicker: string | null;
  headline: string | null;
  about_title: string | null;
  bio: string | null;
  signature: string | null;
  phone: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

export const PROFILE_LIMITS = { kicker: 60, headline: 160, aboutTitle: 80, bio: 1500, signature: 40 } as const;

export const EMPTY_PROFILE: ProfileForm = {
  kicker: '',
  headline: '',
  aboutTitle: '',
  bio: '',
  signature: '',
  phone: '',
  facebookUrl: '',
  instagramUrl: '',
};

const LABELS: Record<keyof typeof PROFILE_LIMITS, string> = {
  kicker: 'The short line above your name',
  headline: 'Your headline',
  aboutTitle: 'The About heading',
  bio: 'Your story',
  signature: 'Your sign-off name',
};

const orNull = (s: string): string | null => (s === '' ? null : s);

/** Bio paragraphs: blank lines split them; runs of blank lines collapse to one. */
export function normalizeBio(bio: string): string {
  return bio
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p !== '')
    .join('\n\n');
}

/** "facebook.com/x", "www.facebook.com/x" and full links all become https links. */
function socialUrl(raw: string, host: 'facebook' | 'instagram'): string | null | false {
  const v = raw.trim();
  if (v === '') return null;
  if (host === 'instagram' && /^@?[A-Za-z0-9._]{1,30}$/.test(v)) return `https://www.instagram.com/${v.replace(/^@/, '')}`;
  const withScheme = /^https?:\/\//i.test(v) ? v.replace(/^http:/i, 'https:') : `https://${v}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return false;
  }
  const h = url.hostname.toLowerCase();
  if (h !== `${host}.com` && !h.endsWith(`.${host}.com`)) return false;
  if (url.pathname === '/' || url.pathname === '') return false;
  return `https://${h}${url.pathname}${url.search}`;
}

export function buildProfileRow(form: ProfileForm): { ok: true; row: ProfileRow } | { ok: false; error: string } {
  const t = {
    kicker: form.kicker.trim().replace(/\s+/g, ' '),
    headline: form.headline.trim().replace(/\s+/g, ' '),
    aboutTitle: form.aboutTitle.trim().replace(/\s+/g, ' '),
    bio: normalizeBio(form.bio),
    signature: form.signature.trim().replace(/\s+/g, ' '),
  };
  for (const key of Object.keys(PROFILE_LIMITS) as (keyof typeof PROFILE_LIMITS)[]) {
    if (t[key].length > PROFILE_LIMITS[key]) {
      return { ok: false, error: `${LABELS[key]} is ${t[key].length} characters. Keep it to ${PROFILE_LIMITS[key]}.` };
    }
  }

  const phone = form.phone.trim().replace(/\s+/g, ' ');
  const digits = phone.replace(/\D/g, '');
  if (phone !== '' && (digits.length < 7 || digits.length > 15 || !/^[0-9+()\-. ]+$/.test(phone))) {
    return { ok: false, error: 'That phone number doesn’t look right. Use digits, like (401) 555-0100.' };
  }

  const facebook = socialUrl(form.facebookUrl, 'facebook');
  if (facebook === false) return { ok: false, error: 'The Facebook link should be your page’s address, like facebook.com/yourpage.' };
  const instagram = socialUrl(form.instagramUrl, 'instagram');
  if (instagram === false) return { ok: false, error: 'The Instagram link should be your profile’s address, like instagram.com/yourname.' };

  return {
    ok: true,
    row: {
      kicker: orNull(t.kicker),
      headline: orNull(t.headline),
      about_title: orNull(t.aboutTitle),
      bio: orNull(t.bio),
      signature: orNull(t.signature),
      phone: orNull(phone),
      facebook_url: facebook,
      instagram_url: instagram,
    },
  };
}

export function profileFormFromRow(row: ProfileRow | null): ProfileForm {
  if (row === null) return EMPTY_PROFILE;
  return {
    kicker: row.kicker ?? '',
    headline: row.headline ?? '',
    aboutTitle: row.about_title ?? '',
    bio: row.bio ?? '',
    signature: row.signature ?? '',
    phone: row.phone ?? '',
    facebookUrl: row.facebook_url ?? '',
    instagramUrl: row.instagram_url ?? '',
  };
}

/** A dialable form of a display phone number, for tel: links. */
export function dialable(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return `+${digits}`;
  return digits.length === 10 ? `+1${digits}` : digits;
}
