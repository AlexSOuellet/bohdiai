import type { MoodKey } from './moods';

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
export type Tier = 'free' | 'basic' | 'pro';
export type CatalogStatus = 'active' | 'draft' | 'retired';

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
  /** What the AI reads to decide whether to pick this block for a given mood and niche. */
  description: string;
  /** Moods this block suits best. The AI prefers these but can pick any active block. */
  moodFit: MoodKey[];
  tenantTypeFit: TenantType[];
  tier: Tier;
  status: CatalogStatus;
  /** Widget slots this block exposes. The AI threads widgets into these slots. */
  slots: SlotDefinition[];
  /** Content fields the AI populates at generation time. */
  contentSchema: ContentField[];
}

export interface WidgetMeta {
  key: string;
  label: string;
  /** What the AI reads to decide whether to thread this widget into a slot. */
  description: string;
  /** Slot keys this widget can fill. Must match SlotDefinition.accepts in at least one block. */
  slotAccepts: string[];
  tenantTypeFit: TenantType[];
  tier: Tier;
  status: CatalogStatus;
  contentSchema: ContentField[];
}
