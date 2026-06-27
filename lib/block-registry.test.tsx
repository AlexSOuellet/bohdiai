import { describe, it, expect } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { renderBlock, type BlockRow } from './block-registry';

// renderBlock builds a React element (it does NOT invoke the heavy block
// components), so the branches are all observable on the returned element's
// props without rendering the whole block tree.
type BlockEl = ReactElement<{
  content: Record<string, unknown>;
  tenantId: string;
  slots?: Record<string, ReactNode>;
}>;
type SlotEl = ReactElement<{ content: Record<string, string> }>;

const row = (block_key: string, content: Record<string, unknown>): BlockRow => ({ block_key, position: 0, content });

describe('renderBlock', () => {
  it('returns null for an unknown block key', () => {
    expect(renderBlock(row('no-such-block', {}), 'tenant-1')).toBeNull();
  });

  it('renders a known block with its content and tenantId, and no slots prop when there are none', () => {
    const el = renderBlock(row('footer-classic', { title: 'Thanks' }), 'tenant-1') as BlockEl;
    expect(el.props.tenantId).toBe('tenant-1');
    expect(el.props.content['title']).toBe('Thanks');
    expect(el.props.slots).toBeUndefined();
  });

  it('splits slots out of content and threads a known widget into the slot', () => {
    const el = renderBlock(
      row('hero-cinematic', { headline: 'Hi', slots: { primary: { widgetKey: 'cta-button', content: { label: 'Buy' } } } }),
      'tenant-1',
    ) as BlockEl;
    // the `slots` sub-object is removed from the block's content
    expect(el.props.content['slots']).toBeUndefined();
    expect(el.props.content['headline']).toBe('Hi');
    // and rendered into a real widget element
    const slot = el.props.slots!['primary'] as SlotEl;
    expect(slot.props.content['label']).toBe('Buy');
  });

  it('accepts the legacy `key` field name for a slot widget', () => {
    const el = renderBlock(
      row('hero-cinematic', { slots: { primary: { key: 'cta-button', content: { label: 'Go' } } } }),
      'tenant-1',
    ) as BlockEl;
    const slot = el.props.slots!['primary'] as SlotEl;
    expect(slot.props.content['label']).toBe('Go');
  });

  it('skips a slot whose widget is unknown (no slots prop when none resolve)', () => {
    const el = renderBlock(
      row('hero-cinematic', { slots: { primary: { widgetKey: 'ghost-widget', content: {} } } }),
      'tenant-1',
    ) as BlockEl;
    expect(el.props.slots).toBeUndefined();
  });
});
