/**
 * A new site's web address (Alex, Session 119): made from the business name,
 * with a number added when that name is taken ("rustic-charm", "rustic-charm-2").
 * Never one of BohdiAI's own hosts. The maker never types it.
 */
import { isReservedSubdomain } from '@/lib/reserved-subdomains';

/** Room for a "-99" on the end and still under a web address's 63 letters. */
const MAX_LENGTH = 40;
const MAX_TRIES = 99;
/** Used only when a business name has no letters or numbers at all. */
const FALLBACK = 'shop';

/** "Renée's Rustic Charm & More" → "renees-rustic-charm-and-more". */
export function subdomainFrom(businessName: string): string {
  const base = businessName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '');
  return base === '' ? FALLBACK : base;
}

/** The first free address for this business name. */
export async function freeSubdomain(businessName: string, isTaken: (subdomain: string) => Promise<boolean>): Promise<string> {
  const base = subdomainFrom(businessName);
  for (let n = 1; n <= MAX_TRIES; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!isReservedSubdomain(candidate) && !(await isTaken(candidate))) return candidate;
  }
  throw new Error(`No free web address for "${businessName}"`);
}
