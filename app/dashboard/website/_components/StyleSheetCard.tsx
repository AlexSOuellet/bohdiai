'use client';

import type { SkinStyleSheet } from '@/lib/editor/look-shelf';

interface StyleSheetCardProps {
  sheet: SkinStyleSheet;
  selected: boolean;
  /** Marks the look currently live on the store. */
  current: boolean;
  onSelect: (key: string) => void;
}

/**
 * One skin shown as a full style sheet: the card paints itself in the skin's own
 * palette and renders its real type voices, so the maker judges color and type as
 * one package — and the shelf reads as visibly different options, not a row of
 * identical chips. The display name uses the skin's display face, the description
 * its body face, and the nav row its label face.
 */
export default function StyleSheetCard({ sheet, selected, current, onSelect }: StyleSheetCardProps) {
  const { palette: p, fonts: f } = sheet;

  return (
    <button
      type="button"
      onClick={() => onSelect(sheet.key)}
      aria-pressed={selected}
      className="group relative block w-full overflow-hidden rounded-xl text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-honey"
      style={{
        // Size the name off the card's own width (cqi) so long names never clip.
        containerType: 'inline-size',
        background: p.bg,
        color: p.fg,
        // The selection ring reads against any skin bg because it sits outside.
        boxShadow: selected
          ? '0 0 0 2px var(--honey), 0 8px 24px rgba(0,0,0,0.35)'
          : `inset 0 0 0 1px ${p.rule}`,
      }}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: f.label,
              color: p.accent,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {current ? 'Current' : 'Aa'}
          </span>
          {selected && (
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
              style={{ background: p.accent, color: p.onAccent }}
            >
              ✓
            </span>
          )}
        </div>

        <div
          className="mt-2"
          style={{
            lineHeight: 1.05,
            fontFamily: f.display,
            // cqi tracks the card width, so the longest names (Conservatory,
            // Hearthstone) fit just as the short ones do; clamp keeps the floor
            // and ceiling sane across the grid's 1- and 2-column breakpoints.
            fontSize: 'clamp(20px, 13cqi, 30px)',
            textTransform: f.displayUppercase ? 'uppercase' : 'none',
            letterSpacing: f.displayUppercase ? '0.02em' : '-0.01em',
            overflowWrap: 'anywhere',
          }}
        >
          {sheet.label}
        </div>

        <p
          className="mt-3"
          style={{ fontFamily: f.body, color: p.fgMuted, fontSize: 13, lineHeight: 1.45 }}
        >
          {sheet.description}
        </p>

        <div
          className="mt-3"
          style={{
            fontFamily: f.label,
            color: p.fgMuted,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Shop · About · Contact
        </div>
      </div>

      {/* Palette strip — the alternate surface plus the key roles as swatches. */}
      <div className="flex h-7 w-full" aria-hidden>
        <span className="flex-1" style={{ background: p.accent }} />
        <span className="flex-1" style={{ background: p.fg }} />
        {p.contrastBg && <span className="flex-1" style={{ background: p.contrastBg }} />}
        <span className="flex-[2]" style={{ background: p.bg, boxShadow: `inset 0 1px 0 ${p.rule}` }} />
      </div>
    </button>
  );
}
