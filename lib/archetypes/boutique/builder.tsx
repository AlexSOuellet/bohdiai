/**
 * Boutique — the build spec for a hand-built maker shop with a catalog. The
 * envelope names the design; the words come from the owner's About you, the
 * pieces from the catalog and the dates from Market dates, all edited in the
 * backend. Never on Bohdi's onboarding menu; built by scripts/build-boutique-site.ts.
 */
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import type { ArchetypeBuildSpec } from '../builder';
import type { CartView, ProductView } from '../content';
import { supabaseAdmin } from '@/lib/supabase';
import { BoutiqueContentSchema, type BoutiqueContent } from './design';
import { loadBoutiqueData } from './data';
import { withSale } from '@/lib/storefront/promotions';
import { NurseryHome, NurseryShop, NurseryCertificate, NurseryContentPage, NurseryCart } from './NurseryLanding';

export const BOUTIQUE_LOOK = 'boutique';

function parse(raw: unknown): BoutiqueContent {
  const parsed = BoutiqueContentSchema.safeParse(raw);
  if (!parsed.success) notFound();
  return parsed.data;
}

async function Home({
  tenantId,
  products,
  logoUrl,
  page,
}: {
  tenantId: string;
  products: ProductView[];
  logoUrl?: string | undefined;
  page: 'home' | 'shop';
}): Promise<ReactElement> {
  const data = await loadBoutiqueData(supabaseAdmin(), tenantId);
  const priced = withSale(products, data.sale);
  if (page === 'shop') return <NurseryShop data={data} products={priced} logoUrl={logoUrl} />;
  return <NurseryHome data={data} products={priced} tenantId={tenantId} logoUrl={logoUrl} />;
}

async function Product({
  tenantId,
  product,
  logoUrl,
}: {
  tenantId: string;
  product: ProductView;
  logoUrl?: string | undefined;
}): Promise<ReactElement> {
  const data = await loadBoutiqueData(supabaseAdmin(), tenantId);
  const [priced = product] = withSale([product], data.sale);
  return <NurseryCertificate data={data} product={priced} logoUrl={logoUrl} />;
}

async function Plain({
  tenantId,
  logoUrl,
  html,
  title,
  body,
}: {
  tenantId: string;
  logoUrl?: string | undefined;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
}): Promise<ReactElement> {
  const data = await loadBoutiqueData(supabaseAdmin(), tenantId);
  return <NurseryContentPage data={data} logoUrl={logoUrl} html={html} title={title} body={body} />;
}

async function Cart({
  tenantId,
  cart,
  logoUrl,
}: {
  tenantId: string;
  cart: CartView;
  logoUrl?: string | undefined;
}): Promise<ReactElement> {
  const data = await loadBoutiqueData(supabaseAdmin(), tenantId);
  if (!data.cart) notFound();
  return <NurseryCart data={data} cart={cart} logoUrl={logoUrl} />;
}

export const BOUTIQUE_SPEC: ArchetypeBuildSpec<BoutiqueContent> = {
  key: 'boutique',
  label: 'Boutique',
  menuDescription:
    'A hand-built maker shop with its own design: a home page, the catalog, and a page for every piece.',
  handBuilt: true,
  usesCatalog: true,
  pages: ['shop'],
  fitsCatalog: () => true,
  looks: [
    {
      key: BOUTIQUE_LOOK,
      label: 'Boutique',
      description: 'Each design carries its own fixed look.',
    },
  ],
  parseSubmission: (raw) => {
    const parsed = BoutiqueContentSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, authored: parsed.data }
      : {
          ok: false,
          issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        };
  },
  mediaJobs: () => [],
  applyMedia: (authored) => authored,
  toPayload: (authored) => ({ content: authored, products: [] }),
  render: ({ content, products, page, logoUrl, tenantId }) => {
    parse(content);
    if (tenantId === undefined) notFound();
    return (
      <Home
        tenantId={tenantId}
        products={products}
        logoUrl={logoUrl}
        page={page === 'shop' ? 'shop' : 'home'}
      />
    );
  },
  renderProduct: ({ content, product, logoUrl, tenantId }) => {
    parse(content);
    if (tenantId === undefined) notFound();
    return <Product tenantId={tenantId} product={product} logoUrl={logoUrl} />;
  },
  renderCart: ({ content, cart, logoUrl, tenantId }) => {
    parse(content);
    return <Cart tenantId={tenantId} cart={cart} logoUrl={logoUrl} />;
  },
  renderContentPage: ({ content, logoUrl, tenantId, html, title, body }) => {
    parse(content);
    if (tenantId === undefined) notFound();
    return <Plain tenantId={tenantId} logoUrl={logoUrl} html={html} title={title} body={body} />;
  },
};
