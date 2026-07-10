/**
 * Editor — door 1 ("try a different feeling").
 *
 * The shelf the maker chooses from: the seven feelings, and for each feeling the
 * skins that can wear it, presented as full STYLE SHEETS — the skin's palette and
 * its real type voices together, so the maker judges color and type as one
 * package (Editor-Design.md). This module derives that view from the existing
 * skin shelf; it invents nothing. Picking a sheet re-renders the maker's exact
 * content in that skin (a pure renderer re-skin), so the choice is just a skin
 * key — no AI, no regeneration.
 */
import type { MoodKey } from '@/lib/moods';
import { MOOD_LIST } from '@/lib/moods';
import {
  MAIN_STREET_SKINS,
  SKIN_DESCRIPTIONS,
  MAIN_STREET_FONT_HREFS,
} from '@/lib/archetypes/main-street/skins';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';

/** The two-surface palette a card paints, lifted verbatim from the skin. */
export interface SheetPalette {
  bg: string;
  fg: string;
  fgMuted: string;
  accent: string;
  onAccent: string;
  rule: string;
  /** The skin's alternate (contrast) surface, when it declares one. */
  contrastBg: string | null;
  contrastFg: string | null;
}

/** The three real type voices a card renders, as CSS font-family strings. */
export interface SheetFonts {
  display: string;
  displayUppercase: boolean;
  body: string;
  label: string;
}

/** One skin shown as a full style sheet — palette + real fonts together. */
export interface SkinStyleSheet {
  /** The skin key, e.g. 'main-street-ember' — the value committed on "Use this look". */
  key: string;
  /** The skin's display label, e.g. 'Ember'. */
  label: string;
  /** One plain-language line about the skin (its colors, type, world). */
  description: string;
  palette: SheetPalette;
  fonts: SheetFonts;
  /** The Google Fonts href that loads this skin's three faces for real rendering. */
  fontHref: string;
}

/** The six feelings in lineup order, with their maker-facing labels. */
export const FEELINGS: ReadonlyArray<{ key: MoodKey; label: string; description: string }> =
  MOOD_LIST.map((m) => ({ key: m.key, label: m.label, description: m.description }));

/** True when `key` names a real Main Street skin — the guard for any override. */
export function isKnownSkin(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(MAIN_STREET_SKINS, key);
}

/** Build the full style sheet for one skin from the live shelf data. Throws on an
 *  unknown key so a typo can never silently render an empty card. */
export function skinStyleSheet(key: string): SkinStyleSheet {
  const skin = MAIN_STREET_SKINS[key];
  if (skin === undefined) throw new Error(`Unknown skin "${key}"`);

  const p = skin.palette;
  const brand = skin.type['brand'];
  const body = skin.type['body'];
  const navLabel = skin.type['navLabel'];

  return {
    key,
    label: skin.label,
    description: SKIN_DESCRIPTIONS[key] ?? '',
    palette: {
      bg: p.bg,
      fg: p.fg,
      fgMuted: p.fgMuted,
      accent: p.accent,
      onAccent: p.onAccent ?? p.bg,
      rule: p.rule,
      contrastBg: p.contrast?.bg ?? null,
      contrastFg: p.contrast?.fg ?? null,
    },
    fonts: {
      display: brand?.family ?? body?.family ?? 'serif',
      displayUppercase: brand?.uppercase === true,
      body: body?.family ?? 'sans-serif',
      label: navLabel?.family ?? body?.family ?? 'monospace',
    },
    fontHref: MAIN_STREET_FONT_HREFS[key] ?? '',
  };
}

/** The skins that can wear a feeling, each as a full style sheet — the shelf the
 *  maker sees under the selected feeling. Honours the D41 mood gate, so a maker
 *  who picks a non-dark feeling is never shown a dark skin. */
export function feelingShelf(mood: MoodKey): SkinStyleSheet[] {
  return moodAlignedSkins(mood).map(skinStyleSheet);
}

/** The feeling a skin belongs to, for marking the maker's current look. A skin
 *  can wear more than one feeling; we return the first that lists it, or null
 *  for an unknown skin. */
export function feelingForSkin(key: string): MoodKey | null {
  for (const f of FEELINGS) {
    if (moodAlignedSkins(f.key).includes(key)) return f.key;
  }
  return null;
}
