import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { REVEAL_OBSERVER_OPTIONS } from './reveal-observer';
import { Reveal } from './Reveal';
import { GoodsModule } from './GoodsModule';
import { GoodsTable } from './GoodsTable';
import { GoodsProcession } from './GoodsProcession';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const goods = { title: 'The Collection' };

function makeProducts(n: number): ProductView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `p-${i}`,
    name: `Piece ${i}`,
    price: `$${i + 1}`,
    description: '',
    shortDescription: 'a small thing',
    status: 'active' as const,
    media: [{ kind: 'image' as const, url: '/x.webp', alt: `Piece ${i}` }],
    variations: [],
  }));
}

let captured: Array<IntersectionObserverInit | undefined> = [];
const original = globalThis.IntersectionObserver;

beforeEach(() => {
  captured = [];
  class FakeIO {
    constructor(_cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      captured.push(options);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = () => [];
  }
  globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = original;
});

describe('REVEAL_OBSERVER_OPTIONS', () => {
  it('uses a zero ratio threshold so tall elements can still fire', () => {
    expect(REVEAL_OBSERVER_OPTIONS.threshold).toBe(0);
    expect(REVEAL_OBSERVER_OPTIONS.rootMargin).toBe('0px 0px -12% 0px');
  });
});

describe('scroll reveals share the height-independent observer options', () => {
  it('Reveal', () => {
    render(<Reveal>x</Reveal>);
    expect(captured).toEqual([REVEAL_OBSERVER_OPTIONS]);
  });
  it('GoodsModule', () => {
    render(<GoodsModule goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(captured.length).toBeGreaterThan(0);
    captured.forEach((o) => expect(o).toEqual(REVEAL_OBSERVER_OPTIONS));
  });
  it('GoodsTable', () => {
    render(<GoodsTable goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(captured.length).toBeGreaterThan(0);
    captured.forEach((o) => expect(o).toEqual(REVEAL_OBSERVER_OPTIONS));
  });
  it('GoodsProcession', () => {
    render(<GoodsProcession goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(captured.length).toBeGreaterThan(0);
    captured.forEach((o) => expect(o).toEqual(REVEAL_OBSERVER_OPTIONS));
  });
});
