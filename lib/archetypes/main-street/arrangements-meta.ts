import type { ArchetypeArrangement } from '../types';

/**
 * The curated arrangement family. Each is a complete page composition built in
 * MainStreet.tsx — hero treatment, region order, and spacing chosen together as
 * one finished design. Adding one means designing another complete page, never
 * recombining pieces. The maker can switch between these in the editor; because
 * every arrangement reads the same content, switching is one click.
 */
export const MAIN_STREET_ARRANGEMENTS: Record<string, ArchetypeArrangement> = {
  classic: { key: 'classic', label: 'Classic' },
  'goods-first': { key: 'goods-first', label: 'Goods first' },
  'story-led': { key: 'story-led', label: 'Story led' },
};

export const MAIN_STREET_DEFAULT_ARRANGEMENT = 'classic';
