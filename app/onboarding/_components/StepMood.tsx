'use client';

import { useState } from 'react';
import { MOOD_LIST } from '@/lib/moods';
import type { MoodKey } from '@/lib/moods';
import type { OnboardingData } from './types';

/** Each card carries a representative slice of one real skin from its mood's
 *  shelf — the bg, an accent stripe, and the mood label set in that skin's
 *  display font. The card isn't a preview of the site the maker will get
 *  (Bohdi picks from a shelf of six per mood), but the type personality and
 *  the color register the maker sees here belong to the neighborhood their
 *  site will live in. Skins are chosen for visual range across the seven cards
 *  so the picker doesn't collapse into one color story. */
interface MoodVisual {
  /** Card background — the skin's bg color. */
  bg: string;
  /** Label color — the skin's fg color, readable on bg. */
  fg: string;
  /** Accent stripe color — the skin's accent. */
  accent: string;
  /** Display font for the mood label, lifted from the skin verbatim. */
  displayFont: string;
  /** Some display faces want uppercase (Oswald, Cinzel, etc). */
  uppercase: boolean;
  /** Display weight — different faces sit best at different weights. */
  weight: number;
}

const MOOD_VISUALS: Record<MoodKey, MoodVisual> = {
  // dark → Nightshade (violet-black + electric amethyst, gothic Gloock)
  dark: {
    bg: '#14101F',
    fg: '#E7E2F1',
    accent: '#9D6BEC',
    displayFont: "'Gloock', Georgia, serif",
    uppercase: false,
    weight: 400,
  },
  // rustic → Tannery (dark leather + saddle amber, heavy Bitter slab)
  rustic: {
    bg: '#1A1410',
    fg: '#E9DCC4',
    accent: '#C2873B',
    displayFont: "'Bitter', Georgia, serif",
    uppercase: false,
    weight: 800,
  },
  // cozy → Sprout (pistachio + warm apricot, rounded Quicksand)
  cozy: {
    bg: '#F2F4E9',
    fg: '#34402F',
    accent: '#E08A4B',
    displayFont: "'Quicksand', system-ui, sans-serif",
    uppercase: false,
    weight: 700,
  },
  // modern → Studio (warm paper + electric red, bold Syne)
  modern: {
    bg: '#F4F1EA',
    fg: '#16140F',
    accent: '#E5391B',
    displayFont: "'Syne', system-ui, sans-serif",
    uppercase: false,
    weight: 800,
  },
  // elegant → Celestine (pale lilac + dusk violet, classical Cinzel caps)
  elegant: {
    bg: '#ECE9F2',
    fg: '#2A2540',
    accent: '#7A6FB0',
    displayFont: "'Cinzel', Georgia, serif",
    uppercase: true,
    weight: 600,
  },
  // cheerful → Bubblegum (cotton-candy pink + bubblegum, rounded Fredoka)
  cheerful: {
    bg: '#FFF0F5',
    fg: '#2A1A3E',
    accent: '#FF4FA3',
    displayFont: "'Fredoka', system-ui, sans-serif",
    uppercase: false,
    weight: 600,
  },
};

/** One combined Google Fonts href that loads every display face the picker
 *  uses. Faster than seven separate <link> tags. */
const PICKER_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Gloock' +
  '&family=Bitter:wght@800' +
  '&family=Quicksand:wght@700' +
  '&family=Syne:wght@800' +
  '&family=Cinzel:wght@600' +
  '&family=Fredoka:wght@600' +
  '&display=swap';

interface StepMoodProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepMood({ data, onAdvance, onBack }: StepMoodProps) {
  const [selectedMood, setSelectedMood] = useState<MoodKey | ''>(data.moodKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMood) return;
    onAdvance({ moodKey: selectedMood });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <link rel="stylesheet" href={PICKER_FONTS_HREF} />

      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-text-soft"
        >
          ← Back
        </button>
        <h1 className="mb-2 font-serif text-3xl text-text">How do you want your store to feel?</h1>
        <p className="text-sm text-muted">This shapes everything — colors, layout, the whole vibe.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {MOOD_LIST.map((mood) => {
          const v = MOOD_VISUALS[mood.key];
          const isSelected = selectedMood === mood.key;
          return (
            <button
              key={mood.key}
              type="button"
              onClick={() => setSelectedMood(mood.key)}
              aria-pressed={isSelected}
              className={[
                'relative flex flex-col justify-between overflow-hidden rounded-lg border text-left transition-all duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey',
                isSelected ? 'ring-2 ring-honey/60' : 'hover:brightness-105',
              ].join(' ')}
              style={{
                background: v.bg,
                color: v.fg,
                borderColor: isSelected ? 'var(--honey)' : 'rgba(0,0,0,0.08)',
                minHeight: 168,
                padding: '22px 22px 18px',
              }}
            >
              {isSelected && (
                <span
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-honey text-[11px] text-bg"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}

              <span
                style={{
                  fontFamily: v.displayFont,
                  fontWeight: v.weight,
                  // Sized for the WIDEST face on the shelf (Syne 800 + "Modern")
                  // — every other face fits comfortably at this scale. Per-mood
                  // sizing was the alternative; ceiling 22 was simpler.
                  fontSize: 'clamp(18px, 1.8vw, 22px)',
                  lineHeight: 1.05,
                  letterSpacing: v.uppercase ? '0.06em' : '-0.005em',
                  textTransform: v.uppercase ? 'uppercase' : 'none',
                  color: v.fg,
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {mood.label}
              </span>

              <div className="mt-4 flex items-end justify-between gap-3">
                <span
                  className="text-[11px] leading-snug"
                  style={{ color: v.fg, opacity: 0.62, maxWidth: '22ch' }}
                >
                  {mood.description.split('.')[0]}.
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    flex: '0 0 auto',
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: v.accent,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={!selectedMood}
        className="w-full rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Continue
      </button>
    </form>
  );
}
