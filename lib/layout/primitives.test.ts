import { describe, it, expect } from 'vitest';
import {
  SpacingScaleSchema,
  MinHeightSchema,
  RadiusSchema,
  BorderSchema,
  ShadowSchema,
  AlignSchema,
  AlignWithBaselineSchema,
  JustifySchema,
  OverlapAnchorPositionSchema,
  BleedSideSchema,
  RowMobileCollapseSchema,
  OverlapMobileCollapseSchema,
  MarqueeSpeedSchema,
  MarqueeDirectionSchema,
  AxisSchema,
  BandContentWidthSchema,
  OverlapScrimSchema,
  BandSchema,
  StackSchema,
  RowSchema,
  SplitSchema,
  GridSchema,
  OverlapSchema,
  BleedSchema,
  PaneSchema,
  MarqueeSchema,
  GutterSchema,
  PRIMITIVE_NODE_TYPES,
} from './primitives';

const text = { type: 'text', role: 'body', content: 'x' } as const;

describe('atomic enum schemas', () => {
  const cases: Array<[unknown, { good: string[]; bad: string }]> = [
    [SpacingScaleSchema, { good: ['none', 'xs', 'xxl'], bad: 'mega' }],
    [MinHeightSchema, { good: ['auto', 'screen'], bad: 'mini' }],
    [RadiusSchema, { good: ['none', 'pill', 'full'], bad: 'oval' }],
    [BorderSchema, { good: ['none', 'thick'], bad: 'fat' }],
    [ShadowSchema, { good: ['none', 'lg'], bad: 'xl' }],
    [AlignSchema, { good: ['start', 'stretch'], bad: 'baseline' }],
    [AlignWithBaselineSchema, { good: ['baseline', 'stretch'], bad: 'foo' }],
    [JustifySchema, { good: ['between', 'evenly'], bad: 'lol' }],
    [OverlapAnchorPositionSchema, { good: ['top-left', 'bottom-right'], bad: 'middle' }],
    [BleedSideSchema, { good: ['all', 'left', 'top'], bad: 'side' }],
    [RowMobileCollapseSchema, { good: ['stack', 'wrap', 'preserve'], bad: 'fold' }],
    [OverlapMobileCollapseSchema, { good: ['stack', 'preserve'], bad: 'wrap' }],
    [MarqueeSpeedSchema, { good: ['slow', 'fast'], bad: 'turbo' }],
    [MarqueeDirectionSchema, { good: ['left', 'right'], bad: 'up' }],
    [AxisSchema, { good: ['horizontal', 'vertical'], bad: 'diagonal' }],
    [BandContentWidthSchema, { good: ['narrow', 'normal', 'wide', 'full'], bad: 'huge' }],
    [OverlapScrimSchema, { good: ['none', 'light', 'dark', 'auto'], bad: 'gradient' }],
  ];

  for (const [schema, { good, bad }] of cases) {
    const s = schema as { safeParse: (v: unknown) => { success: boolean } };
    for (const g of good) {
      it(`accepts ${g}`, () => {
        expect(s.safeParse(g).success).toBe(true);
      });
    }
    it(`rejects ${bad}`, () => {
      expect(s.safeParse(bad).success).toBe(false);
    });
  }
});

describe('BandSchema', () => {
  it('accepts minimum', () => {
    expect(BandSchema.parse({ type: 'band', children: [] }).type).toBe('band');
  });
  it('accepts full', () => {
    const n = BandSchema.parse({
      type: 'band',
      id: 'b',
      padding: 'md',
      minHeight: 'lg',
      align: 'center',
      justify: 'between',
      children: [text],
      mobile: { padding: 'sm', minHeight: 'auto', align: 'start', justify: 'start' },
    });
    expect(n.children.length).toBe(1);
  });
  it('rejects bad padding', () => {
    expect(BandSchema.safeParse({ type: 'band', padding: 'huge', children: [] }).success).toBe(
      false,
    );
  });
  it('rejects extras', () => {
    expect(BandSchema.safeParse({ type: 'band', children: [], wat: 1 }).success).toBe(false);
  });
  it('accepts contentWidth', () => {
    expect(
      BandSchema.parse({ type: 'band', contentWidth: 'wide', children: [] }).contentWidth,
    ).toBe('wide');
  });
  it('accepts contentWidth full', () => {
    expect(
      BandSchema.parse({ type: 'band', contentWidth: 'full', children: [] }).contentWidth,
    ).toBe('full');
  });
  it('rejects bad contentWidth', () => {
    expect(BandSchema.safeParse({ type: 'band', contentWidth: 'huge', children: [] }).success).toBe(
      false,
    );
  });
});

describe('StackSchema', () => {
  it('accepts', () => {
    expect(StackSchema.parse({ type: 'stack', children: [text], gap: 'sm' }).type).toBe('stack');
  });
  it('accepts mobile', () => {
    expect(
      StackSchema.parse({
        type: 'stack',
        children: [],
        mobile: { gap: 'xs', align: 'end', justify: 'center' },
      }).type,
    ).toBe('stack');
  });
  it('rejects bad gap', () => {
    expect(StackSchema.safeParse({ type: 'stack', gap: 'gross', children: [] }).success).toBe(
      false,
    );
  });
});

describe('RowSchema', () => {
  it('accepts full', () => {
    const n = RowSchema.parse({
      type: 'row',
      gap: 'md',
      align: 'baseline',
      justify: 'evenly',
      wrap: true,
      children: [text],
      mobile: { gap: 'xs', align: 'start', justify: 'center', collapse: 'wrap' },
    });
    expect(n.wrap).toBe(true);
  });
  it('rejects bad mobile collapse', () => {
    expect(
      RowSchema.safeParse({ type: 'row', children: [], mobile: { collapse: 'fold' } }).success,
    ).toBe(false);
  });
});

describe('SplitSchema', () => {
  it('accepts', () => {
    const n = SplitSchema.parse({
      type: 'split',
      direction: 'horizontal',
      ratios: [50, 50],
      children: [text, text],
      mobile: { direction: 'vertical', gap: 'sm', stackOrder: [1, 0] },
    });
    expect(n.ratios).toEqual([50, 50]);
  });
  it('rejects ratios < 2 items', () => {
    expect(
      SplitSchema.safeParse({
        type: 'split',
        direction: 'horizontal',
        ratios: [100],
        children: [text],
      }).success,
    ).toBe(false);
  });
  it('rejects ratio out of bounds', () => {
    expect(
      SplitSchema.safeParse({
        type: 'split',
        direction: 'horizontal',
        ratios: [0, 100],
        children: [text, text],
      }).success,
    ).toBe(false);
  });
  it('rejects bad direction', () => {
    expect(
      SplitSchema.safeParse({
        type: 'split',
        direction: 'diag',
        ratios: [50, 50],
        children: [text, text],
      }).success,
    ).toBe(false);
  });
});

describe('GridSchema', () => {
  it('accepts minimum', () => {
    expect(GridSchema.parse({ type: 'grid', columns: 3, children: [] }).columns).toBe(3);
  });
  it('accepts full', () => {
    const n = GridSchema.parse({
      type: 'grid',
      columns: 4,
      rows: 2,
      gapX: 'md',
      gapY: 'sm',
      align: 'center',
      justify: 'stretch',
      children: [text],
      mobile: { columns: 2, gapX: 'xs', gapY: 'xs' },
    });
    expect(n.rows).toBe(2);
  });
  it('rejects columns > 12', () => {
    expect(GridSchema.safeParse({ type: 'grid', columns: 13, children: [] }).success).toBe(false);
  });
  it('rejects mobile columns > 6', () => {
    expect(
      GridSchema.safeParse({ type: 'grid', columns: 3, children: [], mobile: { columns: 7 } })
        .success,
    ).toBe(false);
  });
});

describe('OverlapSchema', () => {
  it('accepts', () => {
    const n = OverlapSchema.parse({
      type: 'overlap',
      align: 'center',
      anchor: 0,
      children: [text, text],
      mobile: { collapse: 'stack', stackOrder: [0, 1] },
    });
    expect(n.anchor).toBe(0);
  });
  it('rejects negative anchor', () => {
    expect(OverlapSchema.safeParse({ type: 'overlap', anchor: -1, children: [text] }).success).toBe(
      false,
    );
  });
  it('accepts scrim', () => {
    expect(
      OverlapSchema.parse({ type: 'overlap', anchor: 0, scrim: 'dark', children: [text] }).scrim,
    ).toBe('dark');
  });
  it('rejects bad scrim', () => {
    expect(
      OverlapSchema.safeParse({ type: 'overlap', anchor: 0, scrim: 'gradient', children: [text] })
        .success,
    ).toBe(false);
  });
});

describe('BleedSchema', () => {
  it('accepts', () => {
    const n = BleedSchema.parse({
      type: 'bleed',
      side: 'both',
      child: text,
      mobile: { side: 'all' },
    });
    expect(n.side).toBe('both');
  });
  it('rejects missing child', () => {
    expect(BleedSchema.safeParse({ type: 'bleed', side: 'all' }).success).toBe(false);
  });
  it('rejects bad side', () => {
    expect(BleedSchema.safeParse({ type: 'bleed', side: 'middle', child: text }).success).toBe(
      false,
    );
  });
});

describe('PaneSchema', () => {
  it('accepts', () => {
    const n = PaneSchema.parse({
      type: 'pane',
      padding: 'md',
      radius: 'lg',
      border: 'thin',
      shadow: 'sm',
      fill: true,
      child: text,
      mobile: { padding: 'sm', radius: 'sm', border: 'none', shadow: 'none' },
    });
    expect(n.fill).toBe(true);
  });
  it('rejects bad radius', () => {
    expect(PaneSchema.safeParse({ type: 'pane', radius: 'square', child: text }).success).toBe(
      false,
    );
  });
});

describe('MarqueeSchema', () => {
  it('accepts full', () => {
    const n = MarqueeSchema.parse({
      type: 'marquee',
      direction: 'left',
      speed: 'fast',
      gap: 'md',
      pauseOnHover: true,
      children: [text],
      mobile: { speed: 'slow', gap: 'sm' },
    });
    expect(n.speed).toBe('fast');
  });
  it('rejects bad speed', () => {
    expect(MarqueeSchema.safeParse({ type: 'marquee', speed: 'turbo', children: [] }).success).toBe(
      false,
    );
  });
});

describe('GutterSchema', () => {
  it('accepts', () => {
    const n = GutterSchema.parse({
      type: 'gutter',
      size: 'md',
      axis: 'vertical',
      mobile: { size: 'sm' },
    });
    expect(n.size).toBe('md');
  });
  it('rejects size = none', () => {
    expect(GutterSchema.safeParse({ type: 'gutter', size: 'none' }).success).toBe(false);
  });
  it('rejects missing size', () => {
    expect(GutterSchema.safeParse({ type: 'gutter' }).success).toBe(false);
  });
  it('rejects bad axis', () => {
    expect(GutterSchema.safeParse({ type: 'gutter', size: 'md', axis: 'diag' }).success).toBe(
      false,
    );
  });
});

describe('PRIMITIVE_NODE_TYPES', () => {
  it('has 10 entries', () => {
    expect(PRIMITIVE_NODE_TYPES).toHaveLength(10);
  });
});
