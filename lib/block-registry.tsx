import type { ReactNode } from 'react';

import NavSplit from '@/blocks/nav-split';
import HeroEditorial from '@/blocks/hero-editorial';
import HeroCinematic from '@/blocks/hero-cinematic';
import HeroSplitGallery from '@/blocks/hero-split-gallery';
import HeroSplitScreen from '@/blocks/hero-split-screen';
import AboutMaker from '@/blocks/about-maker';
import ProductsBloomGrid from '@/blocks/products-bloom-grid';
import ProductsGrid from '@/blocks/products-grid';
import ProductsEditorialGrid from '@/blocks/products-editorial-grid';
import ProductsSplitCarousel from '@/blocks/products-split-carousel';
import CollectionsRow from '@/blocks/collections-row';
import CtaBanner from '@/blocks/cta-banner';
import TestimonialsGrid from '@/blocks/testimonials-grid';
import EventsList from '@/blocks/events-list';
import CustomContent from '@/blocks/custom-content';
import FooterClassic from '@/blocks/footer-classic';

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
  'hero-editorial':          asBlock(HeroEditorial),
  'hero-cinematic':          asBlock(HeroCinematic),
  'hero-split-gallery':      asBlock(HeroSplitGallery),
  'hero-split-screen':       asBlock(HeroSplitScreen),
  'about-maker':             asBlock(AboutMaker),
  'products-bloom-grid':     asBlock(ProductsBloomGrid),
  'products-grid':           asBlock(ProductsGrid),
  'products-editorial-grid': asBlock(ProductsEditorialGrid),
  'products-split-carousel': asBlock(ProductsSplitCarousel),
  'collections-row':         asBlock(CollectionsRow),
  'cta-banner':              asBlock(CtaBanner),
  'testimonials-grid':       asBlock(TestimonialsGrid),
  'events-list':             asBlock(EventsList),
  'custom-content':          asBlock(CustomContent),
  'footer-classic':          asBlock(FooterClassic),
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
      const Widget = WIDGET_REGISTRY[slotData.widgetKey];
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
