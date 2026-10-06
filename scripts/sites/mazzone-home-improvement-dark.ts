/**
 * Mazzone Home Improvement, the DARK trial — the same real content as
 * mazzone-home-improvement.ts in the blueprint design, on its own hidden draft
 * so the harbor version stays exactly as it is (Alex, 2026-10-06: "try it, but
 * do not lose this one"). Built with --draft; never switched on — whichever Alex
 * picks is moved to Joe's real address.
 */
import type { ContractorContent } from '../../lib/archetypes/contractor/schemas';
import { SITE as JOE, content as joeContent } from './mazzone-home-improvement';

export const SITE = {
  ...JOE,
  subdomain: 'mazzone-home-improvement-dark',
};

export function content(media: (file: string) => string): ContractorContent {
  return { ...joeContent(media), design: 'blueprint' };
}
