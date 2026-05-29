export type SectionType =
  | 'nav'
  | 'hero'
  | 'about'
  | 'products'
  | 'collections'
  | 'cta'
  | 'testimonials'
  | 'events'
  | 'custom'
  | 'footer';

export type TenantType = 'seller' | 'doer';
export type CatalogStatus = 'active' | 'draft' | 'retired';

/**
 * Where a block can appear in the storefront.
 *
 * - 'home': the AI may pick this block when composing the home page.
 * - 'shop': used on the /shop page.
 * - 'about': used on the /about page (expanded story, distinct from home about teaser).
 * - 'contact': used on the /contact page.
 * - 'gallery': used on the /gallery page.
 * - 'system': injected by the platform on every page (nav, footer). Never AI-picked.
 *
 * A block can declare multiple page types if it fits more than one context.
 * The home-page generator filters the manifest by `pageTypes.includes('home')`.
 */
export type PageType = 'home' | 'shop' | 'about' | 'contact' | 'gallery' | 'system';

export type ContentFieldType = 'text' | 'richtext' | 'image' | 'url';

export interface ContentField {
  key: string;
  type: ContentFieldType;
  label: string;
  required: boolean;
  /** Whether the AI fills this field at onboarding. False = maker fills it manually. */
  aiGenerated: boolean;
  maxLength?: number;
}

export interface SlotDefinition {
  key: string;
  label: string;
  /** Widget keys that can fill this slot. */
  accepts: string[];
  required: boolean;
}

export interface BlockMeta {
  /** Unique kebab-case identifier, e.g. 'hero-editorial'. Never changes after first deploy. */
  key: string;
  label: string;
  sectionType: SectionType;
  /** Purely structural description — what the block IS, not how it feels. */
  description: string;
  status: CatalogStatus;
  /**
   * Which pages this block can appear on. The home-page generator only sees blocks
   * tagged 'home'; secondary-page assembly only sees blocks tagged with the
   * matching page type; 'system' blocks (nav, footer) are platform-injected and
   * never appear in any generation manifest.
   */
  pageTypes: PageType[];
  /** Widget slots this block exposes. The AI threads widgets into these slots. */
  slots: SlotDefinition[];
  /** Content fields the AI populates at generation time. */
  contentSchema: ContentField[];
}

export interface WidgetMeta {
  key: string;
  label: string;
  /** Purely structural description — what the widget IS, not how it feels. */
  description: string;
  /** Slot keys this widget can fill. Must match SlotDefinition.accepts in at least one block. */
  slotAccepts: string[];
  status: CatalogStatus;
  contentSchema: ContentField[];
}
