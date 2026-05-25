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

// ─── Widget registry ──────────────────────────────────────────────────────────

type WidgetComponent = (props: { content: Record<string, string> }) => ReactNode;

const WIDGET_REGISTRY: Record<string, WidgetComponent> = {
  'cta-button': CtaButton as unknown as WidgetComponent,
};

// ─── Block registry ───────────────────────────────────────────────────────────

interface SlotData {
  widgetKey: string;
  content: Record<string, string>;
}

export interface BlockRow {
  block_key: string;
  position: number;
  content: Record<string, unknown>;
}

// Block components receive content, optional rendered slots, and optional tenantId.
// Data-fetching blocks (products, collections, events) use tenantId to query the DB.
type BlockComponent = (props: {
  content: Record<string, unknown>;
  slots?: Record<string, ReactNode>;
  tenantId?: string;
}) => ReactNode | Promise<ReactNode>;

const BLOCK_REGISTRY: Record<string, BlockComponent> = {
  'hero-editorial': HeroEditorial as unknown as BlockComponent,
  'about-maker': AboutMaker as unknown as BlockComponent,
  'products-grid': ProductsGrid as unknown as BlockComponent,
  'collections-row': CollectionsRow as unknown as BlockComponent,
  'cta-banner': CtaBanner as unknown as BlockComponent,
  'testimonials-grid': TestimonialsGrid as unknown as BlockComponent,
  'events-list': EventsList as unknown as BlockComponent,
  'custom-content': CustomContent as unknown as BlockComponent,
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
      const WidgetComponent = WIDGET_REGISTRY[slotData.widgetKey];
      if (WidgetComponent !== undefined) {
        renderedSlots[slotKey] = <WidgetComponent content={slotData.content} />;
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
