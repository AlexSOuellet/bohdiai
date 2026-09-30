import { appOrigin } from './app-url';

const DEFAULT_SITE_URL = 'https://bohdiai.com';

/** The backend sign-in page every site's footer links to (spec §1, §7). */
export function ownerSignInUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/signin`;
}

/**
 * The footer link for the current environment. Reads only SITE_URL (falling back
 * to bohdiai.com) rather than the full server env: static pages prerender at
 * build time, where the runtime secrets serverEnv() demands don't exist.
 */
export function ownerSignInHref(siteUrl: string | undefined = process.env['SITE_URL']): string {
  const candidate = siteUrl?.trim();
  try {
    return ownerSignInUrl(candidate !== undefined && candidate !== '' ? candidate : DEFAULT_SITE_URL);
  } catch {
    return ownerSignInUrl(DEFAULT_SITE_URL);
  }
}
