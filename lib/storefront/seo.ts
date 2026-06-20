import type { Metadata } from 'next';

/**
 * Per-tenant storefront SEO. Pure builders here (fully unit-tested); the DB load
 * lives in `seo-data.ts`. Every storefront route calls `buildTenantMetadata` from
 * its `generateMetadata`, and the storefront layout injects `tenantBusinessJsonLd`
 * so a shop identifies as ITSELF to search engines — not as BohdiAI.
 */

export const BASE_DOMAIN = 'bohdiai.com';

/** Facts about the shop, loaded once and shared across a page's metadata + JSON-LD. */
export interface TenantSeoFacts {
  shopName: string;
  subdomain: string;
  /** The hero eyebrow — the maker's tagline. Leads the description + share card. */
  tagline?: string | undefined;
  /** Human niche label (e.g. "Candles"), used to compose a keyword title. */
  nicheLabel?: string | undefined;
  /** Geographic areas served — drives the title keywords, description, areaServed. */
  serviceAreas?: string[] | undefined;
  /** Authored SEO title/description (from the content envelope). Preferred when present. */
  seoTitle?: string | undefined;
  seoDescription?: string | undefined;
  /** A representative share image (logo, hero still, or generated OG route). */
  imageUrl?: string | undefined;
  contactEmail?: string | undefined;
  phone?: string | undefined;
}

/** Per-page SEO inputs layered on top of the shop-wide facts. */
export interface PageSeo {
  /** The storefront path, e.g. '/', '/about', '/listings/festival-package'. */
  path: string;
  /** Human page name for sub-page titles ('About', 'Shop', a product name). */
  pageName?: string | undefined;
  /** Page-specific description (e.g. a product's short description). */
  description?: string | undefined;
  /** Page-specific share image (e.g. a product photo). */
  imageUrl?: string | undefined;
  /** Keep search engines off this page (cart, checkout). */
  noindex?: boolean | undefined;
}

const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC',
};

/** The canonical origin for a tenant storefront. */
export function storefrontOrigin(subdomain: string): string {
  return `https://${subdomain.toLowerCase()}.${BASE_DOMAIN}`;
}

/** Short, title-friendly area list: "RI, CT & MA". Unknown areas pass through. */
export function abbreviateAreas(areas: readonly string[]): string {
  const parts = areas.map((a) => US_STATE_ABBR[a.trim().toLowerCase()] ?? a.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`;
}

/** Full-name area list for prose: "Rhode Island, Connecticut, and Massachusetts". */
export function joinAreas(areas: readonly string[]): string {
  const parts = areas.map((a) => a.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function composeTitle(facts: TenantSeoFacts): string {
  if (facts.seoTitle && facts.seoTitle.trim() !== '') return facts.seoTitle.trim();
  const areas = facts.serviceAreas ?? [];
  const abbr = abbreviateAreas(areas);
  if (facts.nicheLabel && abbr !== '') return `${facts.shopName} — ${facts.nicheLabel} in ${abbr}`;
  if (facts.nicheLabel) return `${facts.shopName} — ${facts.nicheLabel}`;
  if (abbr !== '') return `${facts.shopName} — ${abbr}`;
  return facts.shopName;
}

function composeDescription(facts: TenantSeoFacts): string | undefined {
  if (facts.seoDescription && facts.seoDescription.trim() !== '') return facts.seoDescription.trim();
  const areas = facts.serviceAreas ?? [];
  const where = joinAreas(areas);
  const lead = facts.tagline?.trim();
  const what = facts.nicheLabel ? facts.nicheLabel.toLowerCase() : undefined;
  // Compose from whatever we honestly have — never invent business specifics.
  const tail = [what, where !== '' ? `serving ${where}` : undefined].filter(Boolean).join(' ');
  const parts = [lead, tail !== '' ? `${tail.charAt(0).toUpperCase()}${tail.slice(1)}.` : undefined].filter(Boolean);
  const out = parts.join(' — ').trim();
  return out === '' ? undefined : out;
}

/** Build the Next.js Metadata for one storefront page. */
export function buildTenantMetadata(facts: TenantSeoFacts, page: PageSeo): Metadata {
  const origin = storefrontOrigin(facts.subdomain);
  const url = `${origin}${page.path}`;
  const isHome = page.path === '/';

  const homeTitle = composeTitle(facts);
  const title = isHome
    ? homeTitle
    : page.pageName
      ? `${page.pageName} — ${facts.shopName}`
      : facts.shopName;

  const description = page.description?.trim() || composeDescription(facts);
  const imageUrl = page.imageUrl ?? facts.imageUrl;
  const images = imageUrl ? [{ url: imageUrl }] : undefined;

  const md: Metadata = {
    // Resolve any relative URLs against the SHOP's own origin, not bohdiai.com
    // (the root layout's metadataBase), so canonicals/OG never point at the apex.
    metadataBase: new URL(origin),
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: facts.shopName,
      title,
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
    },
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
  return md;
}

/** JSON-LD shape for a storefront business (loose — schema.org is open). */
export interface BusinessJsonLd {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness' | 'Store';
  name: string;
  url: string;
  description?: string;
  image?: string;
  telephone?: string;
  email?: string;
  areaServed?: string[];
}

/** Structured data identifying the shop. LocalBusiness (with areaServed) for a
 *  maker who serves a region; Store otherwise. This is the local-SEO signal. */
export function tenantBusinessJsonLd(facts: TenantSeoFacts): BusinessJsonLd {
  const areas = facts.serviceAreas ?? [];
  const description = composeDescription(facts);
  const ld: BusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': areas.length > 0 ? 'LocalBusiness' : 'Store',
    name: facts.shopName,
    url: storefrontOrigin(facts.subdomain),
  };
  if (description) ld.description = description;
  if (facts.imageUrl) ld.image = facts.imageUrl;
  if (facts.phone) ld.telephone = facts.phone;
  if (facts.contactEmail) ld.email = facts.contactEmail;
  if (areas.length > 0) ld.areaServed = [...areas];
  return ld;
}

export interface ProductJsonLdInput {
  name: string;
  slug: string;
  description?: string | undefined;
  priceCents: number;
  imageUrl?: string | undefined;
  currency?: string | undefined;
  inStock?: boolean | undefined;
}

export interface ProductJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
    seller: { '@type': 'Organization'; name: string };
  };
}

/** Product structured data for a listing detail page. */
export function tenantProductJsonLd(facts: TenantSeoFacts, p: ProductJsonLdInput): ProductJsonLd {
  const url = `${storefrontOrigin(facts.subdomain)}/listings/${p.slug}`;
  const ld: ProductJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    offers: {
      '@type': 'Offer',
      price: (p.priceCents / 100).toFixed(2),
      priceCurrency: p.currency ?? 'USD',
      availability: `https://schema.org/${p.inStock === false ? 'OutOfStock' : 'InStock'}`,
      url,
      seller: { '@type': 'Organization', name: facts.shopName },
    },
  };
  if (p.description && p.description.trim() !== '') ld.description = p.description.trim();
  if (p.imageUrl) ld.image = p.imageUrl;
  return ld;
}
