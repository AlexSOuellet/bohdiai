import type { ReactNode } from 'react';

import NavSplit from '@/blocks/nav-split';
import NavCenteredWordmark from '@/blocks/nav-centered-wordmark';
import HeroEditorial from '@/blocks/hero-editorial';
import HeroCinematic from '@/blocks/hero-cinematic';
import HeroSplitGallery from '@/blocks/hero-split-gallery';
import HeroSplitScreen from '@/blocks/hero-split-screen';
import HeroBento from '@/blocks/hero-bento';
import HeroSuperType from '@/blocks/hero-super-type';
import HeroLava from '@/blocks/hero-lava';
import AboutMaker from '@/blocks/about-maker';
import AboutFoundersNote from '@/blocks/about-founders-note';
import AboutManifest from '@/blocks/about-manifest';
import AboutStory from '@/blocks/about-story';
import ProductsBloomGrid from '@/blocks/products-bloom-grid';
import ProductsGrid from '@/blocks/products-grid';
import ProductsEditorialGrid from '@/blocks/products-editorial-grid';
import ProductsSplitCarousel from '@/blocks/products-split-carousel';
import ProductsBentoGrid from '@/blocks/products-bento-grid';
import ProductsInTheWild from '@/blocks/products-in-the-wild';
import CollectionsRow from '@/blocks/collections-row';
import CtaBanner from '@/blocks/cta-banner';
import TestimonialsGrid from '@/blocks/testimonials-grid';
import TestimonialsFeatured from '@/blocks/testimonials-featured';
import TestimonialsCarousel from '@/blocks/testimonials-carousel';
import EventsList from '@/blocks/events-list';
import CustomContent from '@/blocks/custom-content';
import FooterClassic from '@/blocks/footer-classic';
import ContactForm from '@/blocks/contact-form';
import ProductsShopGrid from '@/blocks/products-shop-grid';
import PageIntro from '@/blocks/page-intro';

import CtaButton from '@/widgets/cta-button';

// ─── Shared prop shapes ───────────────────────────────────────────────────────

interface BlockProps {
  content: Record<string, unknown>;
  slots?: Record<string, ReactNode>;
  tenantId?: string;
}

type BlockComponent = (props: BlockProps) => ReactNode | Promise<ReactNode>;

interface WidgetProps {
  content: Record<string, string>;
}

type WidgetComponent = (props: WidgetProps) => ReactNode;

// ─── Registry adapters ────────────────────────────────────────────────────────

// Each block declares typed props (e.g. HeroEditorialProps). The registry
// dispatches them at runtime keyed by block_key, so the static types can't be
// verified at the call site. The adapter casts once here and each block is
// responsible for only reading fields that exist in its content schema.
function asBlock(c: (props: never) => ReactNode | Promise<ReactNode>): BlockComponent {
  return c as unknown as BlockComponent;
}

function asWidget(c: (props: never) => ReactNode): WidgetComponent {
  return c as unknown as WidgetComponent;
}

// ─── Widget registry ──────────────────────────────────────────────────────────

const WIDGET_REGISTRY: Record<string, WidgetComponent> = {
  'cta-button': asWidget(CtaButton),
};

// ─── Block registry ───────────────────────────────────────────────────────────

export interface BlockRow {
  block_key: string;
  position: number;
  content: Record<string, unknown>;
}

interface SlotData {
  widgetKey: string;
  content: Record<string, string>;
}

const BLOCK_REGISTRY: Record<string, BlockComponent> = {
  'nav-split':               asBlock(NavSplit),
  'nav-centered-wordmark':   asBlock(NavCenteredWordmark),
  'hero-editorial':          asBlock(HeroEditorial),
  'hero-cinematic':          asBlock(HeroCinematic),
  'hero-split-gallery':      asBlock(HeroSplitGallery),
  'hero-split-screen':       asBlock(HeroSplitScreen),
  'hero-bento':              asBlock(HeroBento),
  'hero-super-type':         asBlock(HeroSuperType),
  'hero-lava':               asBlock(HeroLava),
  'about-maker':             asBlock(AboutMaker),
  'about-founders-note':     asBlock(AboutFoundersNote),
  'about-manifest':          asBlock(AboutManifest),
  'about-story':             asBlock(AboutStory),
  'products-bloom-grid':     asBlock(ProductsBloomGrid),
  'products-grid':           asBlock(ProductsGrid),
  'products-editorial-grid': asBlock(ProductsEditorialGrid),
  'products-split-carousel': asBlock(ProductsSplitCarousel),
  'products-bento-grid':     asBlock(ProductsBentoGrid),
  'products-in-the-wild':    asBlock(ProductsInTheWild),
  'collections-row':         asBlock(CollectionsRow),
  'cta-banner':              asBlock(CtaBanner),
  'testimonials-grid':       asBlock(TestimonialsGrid),
  'testimonials-featured':   asBlock(TestimonialsFeatured),
  'testimonials-carousel':   asBlock(TestimonialsCarousel),
  'events-list':             asBlock(EventsList),
  'custom-content':          asBlock(CustomContent),
  'footer-classic':          asBlock(FooterClassic),
  'contact-form':            asBlock(ContactForm),
  'products-shop-grid':      asBlock(ProductsShopGrid),
  'page-intro':              asBlock(PageIntro),
};

export function renderBlock(row: BlockRow, tenantId: string): ReactNode {
  const Component = BLOCK_REGISTRY[row.block_key];
  if (Component === undefined) return null;

  const { slots: rawSlots, ...content } = row.content as Record<string, unknown> & {
    slots?: Record<string, SlotData>;
  };

  const renderedSlots: Record<string, ReactNode> = {};
  if (rawSlots !== undefined) {
    for (const [slotKey, slotData] of Object.entries(rawSlots)) {
      // Bohdi sometimes wrote slots with `key` instead of `widgetKey` before the
      // tool schema enforced the field name. Accept either for existing tenants.
      const widgetKey =
        slotData.widgetKey ??
        (slotData as unknown as { key?: string }).key ??
        '';
      const Widget = WIDGET_REGISTRY[widgetKey];
      if (Widget !== undefined) {
        renderedSlots[slotKey] = <Widget content={slotData.content} />;
      }
    }
  }

  const hasSlots = Object.keys(renderedSlots).length > 0;

  return (
    <Component
      key={row.block_key + String(row.position)}
      content={content}
      tenantId={tenantId}
      {...(hasSlots ? { slots: renderedSlots } : {})}
    />
  );
}
