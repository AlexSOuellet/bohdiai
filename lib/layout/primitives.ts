import { z } from 'zod';
import { IntentSchema, type Intent } from './intent';
import { LayoutNodeSchema, type LayoutNode } from './tree';

const NodeIdSchema = z.string().min(1).max(64).optional();

export const SpacingScaleSchema = z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl']);
export type SpacingScale = z.infer<typeof SpacingScaleSchema>;

const NonZeroSpacingScaleSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']);
export type NonZeroSpacingScale = z.infer<typeof NonZeroSpacingScaleSchema>;

export const MinHeightSchema = z.enum(['auto', 'sm', 'md', 'lg', 'screen']);
export type MinHeight = z.infer<typeof MinHeightSchema>;

export const RadiusSchema = z.enum(['none', 'sm', 'md', 'lg', 'pill', 'full']);
export type Radius = z.infer<typeof RadiusSchema>;

export const BorderSchema = z.enum(['none', 'hairline', 'thin', 'medium', 'thick']);
export type Border = z.infer<typeof BorderSchema>;

export const ShadowSchema = z.enum(['none', 'sm', 'md', 'lg']);
export type Shadow = z.infer<typeof ShadowSchema>;

export const AlignSchema = z.enum(['start', 'center', 'end', 'stretch']);
export type Align = z.infer<typeof AlignSchema>;

export const AlignWithBaselineSchema = z.enum(['start', 'center', 'end', 'stretch', 'baseline']);
export type AlignWithBaseline = z.infer<typeof AlignWithBaselineSchema>;

export const JustifySchema = z.enum([
  'start',
  'center',
  'end',
  'between',
  'around',
  'evenly',
  'stretch',
]);
export type Justify = z.infer<typeof JustifySchema>;

export const OverlapAnchorPositionSchema = z.enum([
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
]);
export type OverlapAnchorPosition = z.infer<typeof OverlapAnchorPositionSchema>;

export const BleedSideSchema = z.enum(['left', 'right', 'both', 'top', 'bottom', 'all']);
export type BleedSide = z.infer<typeof BleedSideSchema>;

export const RowMobileCollapseSchema = z.enum(['wrap', 'stack', 'preserve']);
export type RowMobileCollapse = z.infer<typeof RowMobileCollapseSchema>;

export const OverlapMobileCollapseSchema = z.enum(['preserve', 'stack']);
export type OverlapMobileCollapse = z.infer<typeof OverlapMobileCollapseSchema>;

export const MarqueeSpeedSchema = z.enum(['slow', 'medium', 'fast']);
export type MarqueeSpeed = z.infer<typeof MarqueeSpeedSchema>;

export const MarqueeDirectionSchema = z.enum(['left', 'right']);
export type MarqueeDirection = z.infer<typeof MarqueeDirectionSchema>;

export const AxisSchema = z.enum(['horizontal', 'vertical']);
export type Axis = z.infer<typeof AxisSchema>;

export const BandContentWidthSchema = z.enum(['narrow', 'normal', 'wide', 'full']);
export type BandContentWidth = z.infer<typeof BandContentWidthSchema>;

export const OverlapScrimSchema = z.enum(['none', 'light', 'dark', 'auto']);
export type OverlapScrim = z.infer<typeof OverlapScrimSchema>;

export const StageRevealMotionSchema = z.enum(['rise', 'fade', 'rise-fade']);
export type StageRevealMotion = z.infer<typeof StageRevealMotionSchema>;

export const StageRevealStaggerSchema = z.enum(['tight', 'normal', 'loose']);
export type StageRevealStagger = z.infer<typeof StageRevealStaggerSchema>;

const lazyChildren = () => z.array(z.lazy(() => LayoutNodeSchema));
const lazyChild = () => z.lazy(() => LayoutNodeSchema);

export interface BandNode {
  type: 'band';
  id?: string;
  intent?: Intent;
  padding?: SpacingScale;
  minHeight?: MinHeight;
  align?: Align;
  justify?: Justify;
  contentWidth?: BandContentWidth;
  children: LayoutNode[];
  mobile?: {
    padding?: SpacingScale;
    minHeight?: MinHeight;
    align?: Align;
    justify?: Justify;
  };
}

export const BandSchema = z
  .object({
    type: z.literal('band'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    padding: SpacingScaleSchema.optional(),
    minHeight: MinHeightSchema.optional(),
    align: AlignSchema.optional(),
    justify: JustifySchema.optional(),
    contentWidth: BandContentWidthSchema.optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        padding: SpacingScaleSchema.optional(),
        minHeight: MinHeightSchema.optional(),
        align: AlignSchema.optional(),
        justify: JustifySchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface StackNode {
  type: 'stack';
  id?: string;
  intent?: Intent;
  gap?: SpacingScale;
  align?: Align;
  justify?: Justify;
  children: LayoutNode[];
  mobile?: {
    gap?: SpacingScale;
    align?: Align;
    justify?: Justify;
  };
}

export const StackSchema = z
  .object({
    type: z.literal('stack'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    gap: SpacingScaleSchema.optional(),
    align: AlignSchema.optional(),
    justify: JustifySchema.optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        gap: SpacingScaleSchema.optional(),
        align: AlignSchema.optional(),
        justify: JustifySchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface RowNode {
  type: 'row';
  id?: string;
  intent?: Intent;
  gap?: SpacingScale;
  align?: AlignWithBaseline;
  justify?: Justify;
  wrap?: boolean;
  children: LayoutNode[];
  mobile?: {
    gap?: SpacingScale;
    align?: AlignWithBaseline;
    justify?: Justify;
    collapse?: RowMobileCollapse;
  };
}

export const RowSchema = z
  .object({
    type: z.literal('row'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    gap: SpacingScaleSchema.optional(),
    align: AlignWithBaselineSchema.optional(),
    justify: JustifySchema.optional(),
    wrap: z.boolean().optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        gap: SpacingScaleSchema.optional(),
        align: AlignWithBaselineSchema.optional(),
        justify: JustifySchema.optional(),
        collapse: RowMobileCollapseSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface SplitNode {
  type: 'split';
  id?: string;
  intent?: Intent;
  direction: Axis;
  ratios: number[];
  gap?: SpacingScale;
  align?: Align;
  children: LayoutNode[];
  mobile?: {
    direction?: Axis;
    gap?: SpacingScale;
    stackOrder?: number[];
  };
}

export const SplitSchema = z
  .object({
    type: z.literal('split'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    direction: AxisSchema,
    ratios: z.array(z.number().min(1).max(99)).min(2).max(8),
    gap: SpacingScaleSchema.optional(),
    align: AlignSchema.optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        direction: AxisSchema.optional(),
        gap: SpacingScaleSchema.optional(),
        stackOrder: z.array(z.number().int().min(0)).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface GridNode {
  type: 'grid';
  id?: string;
  intent?: Intent;
  columns: number;
  rows?: number;
  gapX?: SpacingScale;
  gapY?: SpacingScale;
  align?: Align;
  justify?: Align;
  children: LayoutNode[];
  mobile?: {
    columns?: number;
    gapX?: SpacingScale;
    gapY?: SpacingScale;
  };
}

export const GridSchema = z
  .object({
    type: z.literal('grid'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    columns: z.number().int().min(1).max(12),
    rows: z.number().int().min(1).max(12).optional(),
    gapX: SpacingScaleSchema.optional(),
    gapY: SpacingScaleSchema.optional(),
    align: AlignSchema.optional(),
    justify: AlignSchema.optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        columns: z.number().int().min(1).max(6).optional(),
        gapX: SpacingScaleSchema.optional(),
        gapY: SpacingScaleSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface OverlapNode {
  type: 'overlap';
  id?: string;
  intent?: Intent;
  align?: OverlapAnchorPosition;
  anchor: number;
  scrim?: OverlapScrim;
  children: LayoutNode[];
  mobile?: {
    collapse?: OverlapMobileCollapse;
    stackOrder?: number[];
  };
}

export const OverlapSchema = z
  .object({
    type: z.literal('overlap'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    align: OverlapAnchorPositionSchema.optional(),
    anchor: z.number().int().min(0),
    scrim: OverlapScrimSchema.optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        collapse: OverlapMobileCollapseSchema.optional(),
        stackOrder: z.array(z.number().int().min(0)).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface BleedNode {
  type: 'bleed';
  id?: string;
  intent?: Intent;
  side: BleedSide;
  child: LayoutNode;
  mobile?: {
    side?: BleedSide;
  };
}

export const BleedSchema = z
  .object({
    type: z.literal('bleed'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    side: BleedSideSchema,
    child: lazyChild(),
    mobile: z
      .object({
        side: BleedSideSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface PaneNode {
  type: 'pane';
  id?: string;
  intent?: Intent;
  padding?: SpacingScale;
  radius?: Radius;
  border?: Border;
  shadow?: Shadow;
  fill?: boolean;
  child: LayoutNode;
  mobile?: {
    padding?: SpacingScale;
    radius?: Radius;
    border?: Border;
    shadow?: Shadow;
  };
}

export const PaneSchema = z
  .object({
    type: z.literal('pane'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    padding: SpacingScaleSchema.optional(),
    radius: RadiusSchema.optional(),
    border: BorderSchema.optional(),
    shadow: ShadowSchema.optional(),
    fill: z.boolean().optional(),
    child: lazyChild(),
    mobile: z
      .object({
        padding: SpacingScaleSchema.optional(),
        radius: RadiusSchema.optional(),
        border: BorderSchema.optional(),
        shadow: ShadowSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface MarqueeNode {
  type: 'marquee';
  id?: string;
  intent?: Intent;
  direction?: MarqueeDirection;
  speed?: MarqueeSpeed;
  gap?: SpacingScale;
  pauseOnHover?: boolean;
  children: LayoutNode[];
  mobile?: {
    speed?: MarqueeSpeed;
    gap?: SpacingScale;
  };
}

export const MarqueeSchema = z
  .object({
    type: z.literal('marquee'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    direction: MarqueeDirectionSchema.optional(),
    speed: MarqueeSpeedSchema.optional(),
    gap: SpacingScaleSchema.optional(),
    pauseOnHover: z.boolean().optional(),
    children: lazyChildren(),
    mobile: z
      .object({
        speed: MarqueeSpeedSchema.optional(),
        gap: SpacingScaleSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface GutterNode {
  type: 'gutter';
  id?: string;
  intent?: Intent;
  size: NonZeroSpacingScale;
  axis?: Axis;
  mobile?: {
    size?: NonZeroSpacingScale;
  };
}

export const GutterSchema = z
  .object({
    type: z.literal('gutter'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    size: NonZeroSpacingScaleSchema,
    axis: AxisSchema.optional(),
    mobile: z
      .object({
        size: NonZeroSpacingScaleSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface StageNode {
  type: 'stage';
  id?: string;
  intent?: Intent;
  /** Held height. Defaults to 'screen' — a stage is a full-viewport moment. */
  minHeight?: MinHeight;
  /** Where the content block sits over the media. Defaults to 'bottom-left'. */
  align?: OverlapAnchorPosition;
  /** Inset of the content block from the edges. Defaults to 'xl'. */
  padding?: SpacingScale;
  /** Contrast wash between the media and the content. Defaults to 'auto' (→ dark). */
  scrim?: OverlapScrim;
  /**
   * How the content flows in. A stage is never static — content arrives in
   * sequence. Defaults to rise-fade with a normal stagger.
   */
  reveal?: {
    motion?: StageRevealMotion;
    stagger?: StageRevealStagger;
  };
  /** The held media — an image or video, expected to be `fill`. Fills the viewport. */
  media: LayoutNode;
  /** The overlaid content that flows in over the media. */
  content: LayoutNode[];
  mobile?: {
    minHeight?: MinHeight;
    align?: OverlapAnchorPosition;
    padding?: SpacingScale;
  };
}

export const StageSchema = z
  .object({
    type: z.literal('stage'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    minHeight: MinHeightSchema.optional(),
    align: OverlapAnchorPositionSchema.optional(),
    padding: SpacingScaleSchema.optional(),
    scrim: OverlapScrimSchema.optional(),
    reveal: z
      .object({
        motion: StageRevealMotionSchema.optional(),
        stagger: StageRevealStaggerSchema.optional(),
      })
      .strict()
      .optional(),
    media: lazyChild(),
    content: lazyChildren(),
    mobile: z
      .object({
        minHeight: MinHeightSchema.optional(),
        align: OverlapAnchorPositionSchema.optional(),
        padding: SpacingScaleSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const PRIMITIVE_NODE_TYPES = [
  'band',
  'stack',
  'row',
  'split',
  'grid',
  'overlap',
  'bleed',
  'pane',
  'marquee',
  'gutter',
  'stage',
] as const;
export type PrimitiveNodeType = (typeof PRIMITIVE_NODE_TYPES)[number];

export type PrimitiveNode =
  | BandNode
  | StackNode
  | RowNode
  | SplitNode
  | GridNode
  | OverlapNode
  | BleedNode
  | PaneNode
  | MarqueeNode
  | GutterNode
  | StageNode;
