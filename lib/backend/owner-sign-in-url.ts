import { appOrigin } from './app-url';

/** The backend sign-in page every site's footer links to (spec §1, §7). */
export function ownerSignInUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/signin`;
}
