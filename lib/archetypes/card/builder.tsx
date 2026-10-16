/**
 * Business card — the build spec (card site spec). A one-page site whose words and
 * photos live in the owner's About you and gallery, not in the envelope. The
 * envelope says "this is a card", which design it uses (bulletin board spec;
 * pinned prints when it names none), and for pinned prints which family
 * (`mood`) and skin (`lookKey`) it paints in, or the shop's own brand palette.
 * Never on Bohdi's onboarding menu; built by scripts/build-card-site.ts.
 */
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import type { ArchetypeBuildSpec } from '../builder';
import { supabaseAdmin } from '@/lib/supabase';
import { CardLanding, CardContentPage } from './CardLanding';
import { BulletinLanding, BulletinContentPage } from './BulletinLanding';
import { ShowreelLanding, ShowreelContentPage, ShowreelProduct, ShowreelShop } from './ShowreelLanding';
import { TorchLanding, TorchContentPage } from './TorchLanding';
import { ShorelineLanding, ShorelineContentPage } from './ShorelineLanding';
import { ShorelineCart, ShorelineMarket, ShorelineProduct, ShorelineSite, type ShorelinePage } from './ShorelinePages';
import { featuredProducts, loadShorelineData } from './shoreline-data';
import type { ArchetypePage } from '../builder';
import type { CartView, ProductView, MarketShopView } from '../content';
import { CardContentSchema, cardDesign, type CardContent, type CardDesign } from './design';
import { loadCardData } from './data';
import { cardPaint, type CardPaint } from './paint';

export const CARD_LOOK = 'card';

export { CardContentSchema, type CardContent } from './design';

/** The design the envelope names; a malformed envelope is a missing page. */
function designOf(raw: unknown): CardDesign {
  const parsed = CardContentSchema.safeParse(raw);
  if (!parsed.success) notFound();
  return cardDesign(parsed.data);
}

/** The pages the shoreline design paints on Lite and Full; every other design is one page. */
const SHORELINE_PAGES: readonly ArchetypePage[] = ['shop', 'collection', 'about', 'events', 'contact', 'testimonials'];

function shorelinePage(page: ArchetypePage | undefined): ShorelinePage | null {
  if (page === undefined || page === 'home') return 'home';
  return (SHORELINE_PAGES as readonly string[]).includes(page) ? (page as ShorelinePage) : null;
}

async function CardSite({ tenantId, paint, design, page, collectionSlug }: { tenantId: string; paint: CardPaint; design: CardDesign; page: ArchetypePage | undefined; collectionSlug?: string | undefined }): Promise<ReactElement> {
  const home = page === undefined || page === 'home';
  if (design === 'shoreline') {
    const site = await loadShorelineData(supabaseAdmin(), tenantId);
    // Showcase is the one page; Lite and Full have pages (Saltmarsh & Lace demo spec).
    if (!site.pages) {
      if (!home) notFound();
      return <ShorelineLanding data={site.card} tenantId={tenantId} />;
    }
    const which = shorelinePage(page);
    if (which === null) notFound();
    // The testimonials page is Full's, and only when there is something on it.
    if (which === 'testimonials' && site.testimonials.length === 0) notFound();
    if (which === 'collection' && !site.collections.some((c) => c.slug === collectionSlug)) notFound();
    return <ShorelineSite site={site} page={which} tenantId={tenantId} collection={collectionSlug ?? null} />;
  }
  if (design === 'showreel') {
    // Showcase is the one page (the gallery is the work); with the catalog on, her
    // pieces are the work and the site has a shop (Spotlight trial, 2026-10-15).
    const site = await loadShorelineData(supabaseAdmin(), tenantId);
    if (!site.pages) {
      if (!home) notFound();
      return <ShowreelLanding data={site.card} tenantId={tenantId} />;
    }
    if (home) return <ShowreelLanding data={site.card} tenantId={tenantId} products={featuredProducts(site.products)} />;
    if (page === 'shop') return <ShowreelShop data={site.card} products={site.products} />;
    notFound();
  }
  if (!home) notFound();
  const data = await loadCardData(supabaseAdmin(), tenantId);
  if (design === 'bulletin') return <BulletinLanding data={data} tenantId={tenantId} />;
  if (design === 'torch') return <TorchLanding data={data} tenantId={tenantId} />;
  return <CardLanding data={data} paint={paint} tenantId={tenantId} />;
}

/** The cart — only the shoreline design on Full (the cart switch) has one. */
async function CardCart({ tenantId, design, cart }: { tenantId: string; design: CardDesign; cart: CartView }): Promise<ReactElement> {
  if (design !== 'shoreline') notFound();
  const site = await loadShorelineData(supabaseAdmin(), tenantId);
  if (!site.cart) notFound();
  return <ShorelineCart site={site} cart={cart} />;
}

/** A market's own page — only the shoreline design on Lite and Full has one. */
async function CardMarket({ tenantId, design, market }: { tenantId: string; design: CardDesign; market: MarketShopView }): Promise<ReactElement> {
  if (design !== 'shoreline') notFound();
  const site = await loadShorelineData(supabaseAdmin(), tenantId);
  if (!site.pages) notFound();
  return <ShorelineMarket site={site} market={market} />;
}

/** A product's page — the shoreline and show reel designs have them on Lite and Full. */
async function CardProduct({ tenantId, design, product }: { tenantId: string; design: CardDesign; product: ProductView }): Promise<ReactElement> {
  if (design !== 'shoreline' && design !== 'showreel') notFound();
  const site = await loadShorelineData(supabaseAdmin(), tenantId);
  if (!site.pages) notFound();
  // Her catalog carries the running sale's price (Full); the route's copy doesn't.
  const priced = site.products.find((p) => p.slug === product.slug) ?? product;
  if (design === 'showreel') return <ShowreelProduct data={site.card} product={priced} tenantId={tenantId} allPhotos={site.allPhotos} />;
  return <ShorelineProduct site={site} product={priced} tenantId={tenantId} />;
}

async function CardPage({
  tenantId,
  paint,
  design,
  html,
  title,
  body,
}: {
  tenantId: string;
  paint: CardPaint;
  design: CardDesign;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
}): Promise<ReactElement> {
  const { name, profile, words } = await loadCardData(supabaseAdmin(), tenantId);
  if (design === 'bulletin') return <BulletinContentPage name={name} words={words} html={html} title={title} body={body} />;
  if (design === 'showreel') return <ShowreelContentPage name={name} words={words} html={html} title={title} body={body} />;
  if (design === 'torch') return <TorchContentPage name={name} words={words} html={html} title={title} body={body} />;
  if (design === 'shoreline') return <ShorelineContentPage name={name} social={profile} words={words} html={html} title={title} body={body} />;
  return <CardContentPage name={name} paint={paint} words={words} html={html} title={title} body={body} />;
}

export const CARD_SPEC: ArchetypeBuildSpec<CardContent> = {
  key: 'card',
  label: 'Business card',
  menuDescription: 'A one-page online business card for a maker: who they are, a gallery of their work, and how to get in touch.',
  handBuilt: true,
  // Showcase card sites read no catalog; the shoreline design's Lite and Full pages
  // do, and each render checks the site's switches before showing any of it.
  usesCatalog: true,
  pages: SHORELINE_PAGES,
  fitsCatalog: () => false,
  looks: [{ key: CARD_LOOK, label: 'Business card', description: 'Pinned prints paint in one of the family’s skins (the stored look key names the skin); the bulletin board has its own fixed look.' }],
  parseSubmission: (raw) => {
    const parsed = CardContentSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, authored: parsed.data }
      : { ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) };
  },
  mediaJobs: () => [],
  applyMedia: (authored) => authored,
  toPayload: (authored) => ({ content: authored, products: [] }),
  render: ({ content, lookKey, mood, brandPalette, tenantId, page, collectionSlug }) => {
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardSite tenantId={tenantId} design={design} page={page} collectionSlug={collectionSlug} paint={cardPaint({ mood, lookKey, brandPalette })} />;
  },
  renderCart: ({ content, cart, tenantId }) => {
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardCart tenantId={tenantId} design={design} cart={cart} />;
  },
  renderProduct: ({ content, product, tenantId }) => {
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardProduct tenantId={tenantId} design={design} product={product} />;
  },
  renderMarket: ({ content, market, tenantId }) => {
    const design = designOf(content);
    return <CardMarket tenantId={tenantId} design={design} market={market} />;
  },
  renderContentPage: ({ content, lookKey, mood, brandPalette, tenantId, html, title, body }) => {
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardPage tenantId={tenantId} design={design} paint={cardPaint({ mood, lookKey, brandPalette })} html={html} title={title} body={body} />;
  },
};
