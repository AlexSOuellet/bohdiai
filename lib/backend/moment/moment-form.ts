/**
 * The moment (Modular Plan step 2): the first thing a visitor sees. Its words
 * live in `site_moments`; its photo is an upload, and its extra photos (a design
 * that shows several) live in `site_moment_photos`. The form holds plain strings;
 * an empty field means "not set". Validation turns the form into the row and
 * names the field that needs fixing.
 */
import { LINK_TARGETS, type LinkTarget } from '@/lib/archetypes/main-street/links';

export const PLAY_MODES = ['once', 'always', 'off'] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

export type MomentForm = {
  /** The short line above the headline. */
  kicker: string;
  headline: string;
  /** One plain sentence under the headline. */
  sub: string;
  /** The story told one line at a time before the moment settles. */
  story: string[];
  ctaLabel: string;
  ctaTarget: LinkTarget | '';
  secondCtaLabel: string;
  secondCtaTarget: LinkTarget | '';
  /** How often the story plays: the first visit, every visit, or never. */
  playMode: PlayMode;
};

export type MomentRow = {
  kicker: string | null;
  headline: string | null;
  sub: string | null;
  story: string[] | null;
  cta_label: string | null;
  cta_target: string | null;
  second_cta_label: string | null;
  second_cta_target: string | null;
  play_mode: string;
};

export const MOMENT_LIMITS = { kicker: 60, headline: 160, sub: 300, ctaLabel: 40, secondCtaLabel: 40 } as const;
export const STORY_LINES_MAX = 8;
export const STORY_LINE_MAX = 120;
/** How many extra photos the moment holds. */
export const MOMENT_PHOTOS_LIMIT = 3;

export const EMPTY_MOMENT: MomentForm = {
  kicker: '',
  headline: '',
  sub: '',
  story: [],
  ctaLabel: '',
  ctaTarget: '',
  secondCtaLabel: '',
  secondCtaTarget: '',
  playMode: 'once',
};

const LABELS: Record<keyof typeof MOMENT_LIMITS, string> = {
  kicker: 'The short line above the headline',
  headline: 'The headline',
  sub: 'The line under the headline',
  ctaLabel: 'The main button',
  secondCtaLabel: 'The second button',
};

const orNull = (s: string): string | null => (s === '' ? null : s);
const oneLine = (s: string): string => s.trim().replace(/\s+/g, ' ');

function isLinkTarget(value: string): value is LinkTarget {
  return (LINK_TARGETS as readonly string[]).includes(value);
}

function isPlayMode(value: string): value is PlayMode {
  return (PLAY_MODES as readonly string[]).includes(value);
}

/** A button's words and where it goes, both or neither. */
function button(label: string, target: string, name: string): { ok: true; target: LinkTarget | null } | { ok: false; error: string } {
  if (target !== '' && !isLinkTarget(target)) return { ok: false, error: `Pick a page for ${name} to go to.` };
  if (label === '' && target !== '') return { ok: false, error: `Add the words on ${name}, or clear where it goes.` };
  if (label !== '' && target === '') return { ok: false, error: `Pick a page for ${name} to go to.` };
  return { ok: true, target: target === '' ? null : target };
}

export function buildMomentRow(form: MomentForm): { ok: true; row: MomentRow } | { ok: false; error: string } {
  const t = {
    kicker: oneLine(form.kicker),
    headline: oneLine(form.headline),
    sub: oneLine(form.sub),
    ctaLabel: oneLine(form.ctaLabel),
    secondCtaLabel: oneLine(form.secondCtaLabel),
  };
  for (const key of Object.keys(MOMENT_LIMITS) as (keyof typeof MOMENT_LIMITS)[]) {
    if (t[key].length > MOMENT_LIMITS[key]) {
      return { ok: false, error: `${LABELS[key]} is ${t[key].length} characters. Keep it to ${MOMENT_LIMITS[key]}.` };
    }
  }

  const story = form.story.map(oneLine).filter((l) => l !== '');
  if (story.length > STORY_LINES_MAX) return { ok: false, error: `The story holds up to ${STORY_LINES_MAX} lines.` };
  const long = story.find((l) => l.length > STORY_LINE_MAX);
  if (long !== undefined) return { ok: false, error: `“${long}” is ${long.length} characters. Keep each story line to ${STORY_LINE_MAX}.` };

  const main = button(t.ctaLabel, form.ctaTarget, 'the main button');
  if (!main.ok) return main;
  const second = button(t.secondCtaLabel, form.secondCtaTarget, 'the second button');
  if (!second.ok) return second;
  if (t.secondCtaLabel !== '' && t.ctaLabel === '') return { ok: false, error: 'Add the main button before a second one.' };
  if (!isPlayMode(form.playMode)) return { ok: false, error: 'Pick how often the story plays.' };

  return {
    ok: true,
    row: {
      kicker: orNull(t.kicker),
      headline: orNull(t.headline),
      sub: orNull(t.sub),
      story: story.length === 0 ? null : story,
      cta_label: orNull(t.ctaLabel),
      cta_target: main.target,
      second_cta_label: orNull(t.secondCtaLabel),
      second_cta_target: second.target,
      play_mode: form.playMode,
    },
  };
}

export function momentFormFromRow(row: MomentRow | null): MomentForm {
  if (row === null) return EMPTY_MOMENT;
  const target = (v: string | null): LinkTarget | '' => (v !== null && isLinkTarget(v) ? v : '');
  return {
    kicker: row.kicker ?? '',
    headline: row.headline ?? '',
    sub: row.sub ?? '',
    story: row.story ?? [],
    ctaLabel: row.cta_label ?? '',
    ctaTarget: target(row.cta_target),
    secondCtaLabel: row.second_cta_label ?? '',
    secondCtaTarget: target(row.second_cta_target),
    playMode: isPlayMode(row.play_mode) ? row.play_mode : 'once',
  };
}

/** The moment's photo or video, as a design paints it. */
export type MomentMedia = { kind: 'image' | 'video'; url: string; alt: string; posterUrl: string };

/** The moment as a design reads it: the words plus its media and extra photos. */
export type MomentView = MomentForm & { media: MomentMedia | null; photos: { id: string; url: string; alt: string }[] };
