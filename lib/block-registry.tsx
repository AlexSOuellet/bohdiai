import type { ReactNode } from 'react';

import HeroEditorial from '@/blocks/hero-editorial';
import AboutMaker from '@/blocks/about-maker';
import ProductsGrid from '@/blocks/products-grid';
import CollectionsRow from '@/blocks/collections-row';
import CtaBanner from '@/blocks/cta-banner';
import TestimonialsGrid from '@/blocks/testimonials-grid';
import EventsList from '@/blocks/events-list';
import CustomContent from '@/blocks/custom-content';

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
  'hero-editorial':    asBlock(HeroEditorial),
  'about-maker':       asBlock(AboutMaker),
  'products-grid':     asBlock(ProductsGrid),
  'collections-row':   asBlock(CollectionsRow),
  'cta-banner':        asBlock(CtaBanner),
  'testimonials-grid': asBlock(TestimonialsGrid),
  'events-list':       asBlock(EventsList),
  'custom-content':    asBlock(CustomContent),
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
