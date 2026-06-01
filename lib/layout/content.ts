import { z } from 'zod';
import { IntentSchema } from './intent';

const NodeIdSchema = z.string().min(1).max(64).optional();

const AspectRatioSchema = z.enum(['1:1', '4:5', '3:4', '4:3', '3:2', '16:9', '21:9', 'auto']);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

const TextRoleSchema = z.enum(['eyebrow', 'headline', 'sub', 'body', 'caption']);
export type TextRole = z.infer<typeof TextRoleSchema>;

const TextAlignSchema = z.enum(['start', 'center', 'end']);
export type TextAlign = z.infer<typeof TextAlignSchema>;

export const TextNodeSchema = z
  .object({
    type: z.literal('text'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    role: TextRoleSchema,
    content: z.string().min(1),
    align: TextAlignSchema.optional(),
    mobile: z
      .object({
        role: TextRoleSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type TextNode = z.infer<typeof TextNodeSchema>;

export const ImageNodeSchema = z
  .object({
    type: z.literal('image'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    brief: z.string().min(1),
    alt: z.string().min(1),
    aspect: AspectRatioSchema.optional(),
    assetUrl: z.string().url().optional(),
    focal: z
      .object({
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
      })
      .strict()
      .optional(),
  })
  .strict();
export type ImageNode = z.infer<typeof ImageNodeSchema>;

const ButtonVariantSchema = z.enum(['primary', 'secondary', 'ghost', 'link']);
export type ButtonVariant = z.infer<typeof ButtonVariantSchema>;

export const ButtonNodeSchema = z
  .object({
    type: z.literal('button'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    label: z.string().min(1).max(80),
    href: z.string().min(1),
    variant: ButtonVariantSchema.optional(),
  })
  .strict();
export type ButtonNode = z.infer<typeof ButtonNodeSchema>;

export const WordmarkNodeSchema = z
  .object({
    type: z.literal('wordmark'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    kind: z.enum(['text', 'image']),
    content: z.string().min(1),
    href: z.string().min(1).optional(),
    /**
     * Optional gradient text fill for a text wordmark. Use only when the design calls
     * for it — most wordmarks are a single solid color. from/to reference named palette
     * colors; angle is in degrees (default 90, i.e. left-to-right).
     */
    gradient: z
      .object({
        from: z.string().min(1),
        to: z.string().min(1),
        angle: z.number().min(0).max(360).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type WordmarkNode = z.infer<typeof WordmarkNodeSchema>;

export const VideoNodeSchema = z
  .object({
    type: z.literal('video'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    assetUrl: z.string().url(),
    poster: z.string().url().optional(),
    autoplay: z.boolean().optional(),
    loop: z.boolean().optional(),
    muted: z.boolean().optional(),
    controls: z.boolean().optional(),
    aspect: AspectRatioSchema.optional(),
  })
  .strict();
export type VideoNode = z.infer<typeof VideoNodeSchema>;

const DividerWeightSchema = z.enum(['hairline', 'thin', 'medium', 'thick']);
const DividerStyleSchema = z.enum(['solid', 'dashed', 'dotted']);

export const DividerNodeSchema = z
  .object({
    type: z.literal('divider'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    weight: DividerWeightSchema.optional(),
    style: DividerStyleSchema.optional(),
  })
  .strict();
export type DividerNode = z.infer<typeof DividerNodeSchema>;

export const QuoteNodeSchema = z
  .object({
    type: z.literal('quote'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    body: z.string().min(1),
    attribution: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
  })
  .strict();
export type QuoteNode = z.infer<typeof QuoteNodeSchema>;

const ProductOrderSchema = z.enum([
  'featured',
  'newest',
  'oldest',
  'price-asc',
  'price-desc',
  'manual',
]);

const ProductFilterSchema = z
  .object({
    collectionSlug: z.string().min(1).optional(),
    tag: z.string().min(1).optional(),
  })
  .strict();

export const ProductGridNodeSchema = z
  .object({
    type: z.literal('productGrid'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    count: z.number().int().min(1).max(48).optional(),
    order: ProductOrderSchema.optional(),
    filter: ProductFilterSchema.optional(),
    manualIds: z.array(z.string().min(1)).max(48).optional(),
    columns: z.number().int().min(1).max(6).optional(),
    mobileColumns: z.number().int().min(1).max(3).optional(),
  })
  .strict();
export type ProductGridNode = z.infer<typeof ProductGridNodeSchema>;

export const FeaturedProductNodeSchema = z
  .object({
    type: z.literal('featuredProduct'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    productId: z.string().min(1),
    showPrice: z.boolean().optional(),
    showAddToCart: z.boolean().optional(),
  })
  .strict();
export type FeaturedProductNode = z.infer<typeof FeaturedProductNodeSchema>;

const CollectionOrderSchema = z.enum(['featured', 'newest', 'manual']);

export const CollectionGridNodeSchema = z
  .object({
    type: z.literal('collectionGrid'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    count: z.number().int().min(1).max(24).optional(),
    order: CollectionOrderSchema.optional(),
    manualSlugs: z.array(z.string().min(1)).max(24).optional(),
    columns: z.number().int().min(1).max(6).optional(),
    mobileColumns: z.number().int().min(1).max(3).optional(),
  })
  .strict();
export type CollectionGridNode = z.infer<typeof CollectionGridNodeSchema>;

export const FeaturedCollectionNodeSchema = z
  .object({
    type: z.literal('featuredCollection'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    collectionSlug: z.string().min(1),
    previewCount: z.number().int().min(1).max(12).optional(),
  })
  .strict();
export type FeaturedCollectionNode = z.infer<typeof FeaturedCollectionNodeSchema>;

export const SubscriptionGridNodeSchema = z
  .object({
    type: z.literal('subscriptionGrid'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    count: z.number().int().min(1).max(12).optional(),
    columns: z.number().int().min(1).max(4).optional(),
    mobileColumns: z.number().int().min(1).max(2).optional(),
  })
  .strict();
export type SubscriptionGridNode = z.infer<typeof SubscriptionGridNodeSchema>;

export const FeaturedSubscriptionNodeSchema = z
  .object({
    type: z.literal('featuredSubscription'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    subscriptionId: z.string().min(1),
  })
  .strict();
export type FeaturedSubscriptionNode = z.infer<typeof FeaturedSubscriptionNodeSchema>;

const ContactFieldSchema = z
  .object({
    name: z.string().min(1).max(40),
    label: z.string().min(1).max(80),
    kind: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
    required: z.boolean().optional(),
    placeholder: z.string().max(120).optional(),
    options: z.array(z.string().min(1)).max(20).optional(),
  })
  .strict();

export const ContactFormNodeSchema = z
  .object({
    type: z.literal('contactForm'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    fields: z.array(ContactFieldSchema).min(1).max(12).optional(),
    submitLabel: z.string().min(1).max(40).optional(),
    successMessage: z.string().min(1).max(240).optional(),
  })
  .strict();
export type ContactFormNode = z.infer<typeof ContactFormNodeSchema>;

export const CartNodeSchema = z
  .object({
    type: z.literal('cart'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    variant: z.enum(['icon', 'page']),
  })
  .strict();
export type CartNode = z.infer<typeof CartNodeSchema>;

export const SocialLinksNodeSchema = z
  .object({
    type: z.literal('socialLinks'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    platforms: z.array(z.string().min(1)).max(12).optional(),
    style: z.enum(['icons', 'labels', 'both']).optional(),
  })
  .strict();
export type SocialLinksNode = z.infer<typeof SocialLinksNodeSchema>;

export const NavLinksNodeSchema = z
  .object({
    type: z.literal('navLinks'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    order: z.enum(['auto', 'manual']).optional(),
    manualOrder: z.array(z.string().min(1)).max(20).optional(),
    style: z.enum(['plain', 'underlined', 'pill']).optional(),
  })
  .strict();
export type NavLinksNode = z.infer<typeof NavLinksNodeSchema>;

export const EventsListNodeSchema = z
  .object({
    type: z.literal('eventsList'),
    id: NodeIdSchema,
    intent: IntentSchema.optional(),
    count: z.number().int().min(1).max(24).optional(),
    upcoming: z.boolean().optional(),
    layout: z.enum(['stack', 'grid', 'row']).optional(),
  })
  .strict();
export type EventsListNode = z.infer<typeof EventsListNodeSchema>;

export const ContentNodeSchema = z.discriminatedUnion('type', [
  TextNodeSchema,
  ImageNodeSchema,
  ButtonNodeSchema,
  WordmarkNodeSchema,
  VideoNodeSchema,
  DividerNodeSchema,
  QuoteNodeSchema,
  ProductGridNodeSchema,
  FeaturedProductNodeSchema,
  CollectionGridNodeSchema,
  FeaturedCollectionNodeSchema,
  SubscriptionGridNodeSchema,
  FeaturedSubscriptionNodeSchema,
  ContactFormNodeSchema,
  CartNodeSchema,
  SocialLinksNodeSchema,
  NavLinksNodeSchema,
  EventsListNodeSchema,
]);
export type ContentNode = z.infer<typeof ContentNodeSchema>;

export const CONTENT_NODE_TYPES = [
  'text',
  'image',
  'button',
  'wordmark',
  'video',
  'divider',
  'quote',
  'productGrid',
  'featuredProduct',
  'collectionGrid',
  'featuredCollection',
  'subscriptionGrid',
  'featuredSubscription',
  'contactForm',
  'cart',
  'socialLinks',
  'navLinks',
  'eventsList',
] as const;
export type ContentNodeType = (typeof CONTENT_NODE_TYPES)[number];
