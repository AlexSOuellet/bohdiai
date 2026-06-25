/**
 * Main Street — BEAT 3, the founder, in four bodies.
 *
 * All four live on the skin's CONTRAST surface as a band that spans the full
 * viewport width — but the portrait and copy stay inside the content column
 * (`ms-wrap`, padded), so nothing ever kisses the screen edges. Each is a TEASER
 * carrying an "about" cue to the full bio; the calendar shows whenever the maker
 * does in-person events. Structure only — every color is a skin var, every type
 * value comes from its role's CSS (via the Type component). Two treatments set
 * their text italic (letter attribution, card quote) — that lives as a scoped
 * `[data-type]` rule in skinVarsCss, never inline.
 */
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';

type Founder = MainStreetContent['founder'];

export interface FounderAbout {
  href: string;
  label: string;
}

/** Neutral fallback for the calendar's events cue. */
const DEFAULT_EVENTS = 'See all dates';

/** A hairline derived from the contrast surface's own text — direction-agnostic
 *  so it reads on a dark OR a light contrast panel. */
const HAIR = 'color-mix(in srgb, var(--ms-contrast-fg) 18%, transparent)';

/** The full-width contrast band; children are held inside the padded column. */
function FounderBand({ children }: { children: ReactNode }) {
  return (
    <section data-ms-founder style={{ background: 'var(--ms-contrast-bg)', color: 'var(--ms-contrast-fg)', padding: '110px 40px' }}>
      <div className="ms-wrap">{children}</div>
    </section>
  );
}

function AboutCue({ about }: { about: FounderAbout | undefined }) {
  if (!about) return null;
  return (
    <Type as="a" role="navLabel" href={about.href} className="ms-aboutcue" style={{ color: 'var(--ms-accent)', display: 'inline-block', marginTop: 30 }}>
      {about.label} &rarr;
    </Type>
  );
}

/** The calendar list. Lives on the contrast band (onContrast, default) OR the
 *  base surface (onContrast=false, when rendered as its own find-us beat). The
 *  hairline + text colors flip with the surface so it reads either way. */
export function FindUsList({ findUs, eventsHref, heading = 'eyebrow', onContrast = true }: { findUs: NonNullable<Founder['findUs']>; eventsHref: string; heading?: 'eyebrow' | 'title'; onContrast?: boolean }) {
  const fg = onContrast ? 'var(--ms-contrast-fg)' : 'var(--ms-fg)';
  const fgMuted = onContrast ? 'var(--ms-contrast-fg-muted)' : 'var(--ms-fg-muted)';
  const hair = onContrast ? HAIR : 'var(--ms-rule)';
  return (
    <div>
      <Type as="span" role={heading} style={{ color: heading === 'title' ? fg : 'var(--ms-accent)', display: 'block', marginBottom: 16 }}>
        {findUs.label}
      </Type>
      {findUs.rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '13px 0', borderBottom: `1px solid ${hair}` }}>
          <Type as="span" role="day" style={{ color: fgMuted, flex: '0 0 95px' }}>{row.day}</Type>
          <Type as="span" role="where" style={{ color: fg, flex: 1 }}>{row.where}</Type>
          <Type as="span" role="price" style={{ color: fgMuted }}>{row.time}</Type>
        </div>
      ))}
      <Type as="a" role="navLabel" href={eventsHref} className="ms-eventscue" style={{ color: 'var(--ms-accent)', display: 'inline-block', marginTop: 18 }}>
        {findUs.eventsLabel ?? DEFAULT_EVENTS} &rarr;
      </Type>
    </div>
  );
}

type TreatmentProps = { founder: Founder; skin: ArchetypeTheme; about?: FounderAbout | undefined };

/** quote — portrait beside a pull-quote (the calm, authority-forward default). */
export function FounderQuote({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}>
        <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden' }}>
          <Media media={founder.photo} />
        </div>
        <div>
          <Type as="p" role="quote" style={{ color: 'var(--ms-contrast-fg)', margin: 0 }}>{founder.quote}</Type>
          <Type as="div" role="sig" style={{ color: 'var(--ms-contrast-fg-muted)', marginTop: 26 }}>&mdash; {founder.attribution}</Type>
          <AboutCue about={about} />
        </div>
      </div>
    </FounderBand>
  );
}

/** portrait — a large CONTAINED portrait with the quote anchored to the bottom.
 *  The scrim sits BEHIND the text container and follows its bounding box, so a
 *  long quote that pushes upward never sticks out into unscrimmed image area. */
export function FounderPortrait({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-portrait" style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '16 / 10' }}>
        <Media media={founder.photo} />
        <div data-portrait-anchor style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <div
            data-portrait-scrim
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, var(--ms-contrast-bg) 75%, color-mix(in srgb, var(--ms-contrast-bg) 65%, transparent) 92%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          <div data-portrait-text style={{ position: 'relative', padding: '48px clamp(28px, 5vw, 64px)' }}>
            <Type as="p" role="quote" style={{ color: 'var(--ms-contrast-fg)', margin: 0, maxWidth: '32ch' }}>{founder.quote}</Type>
            <Type as="div" role="sig" style={{ color: 'var(--ms-contrast-fg-muted)', marginTop: 20 }}>&mdash; {founder.attribution}</Type>
          </div>
        </div>
      </div>
      <AboutCue about={about} />
    </FounderBand>
  );
}

/** letter — the quote as a short signed note on a narrow measure, a small inset
 *  portrait. Intimate and homemade; the antidote to the dark-slab reflex. The
 *  attribution sets italic via the scoped `.ms-founder-letter [data-type="title"]`
 *  rule in skinVarsCss. */
export function FounderLetter({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-letter" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 168, height: 168, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 30px', position: 'relative', border: `1px solid ${HAIR}` }}>
          <Media media={founder.photo} />
        </div>
        <Type as="p" role="quote" style={{ color: 'var(--ms-contrast-fg)', margin: 0, lineHeight: 1.5 }}>{founder.quote}</Type>
        <Type as="div" role="title" style={{ color: 'var(--ms-contrast-fg)', marginTop: 30 }}>{founder.attribution}</Type>
        <AboutCue about={about} />
      </div>
    </FounderBand>
  );
}

/** card — the "Meet June" card: eyebrow, heading, a round face, a warm pull-quote,
 *  the attribution, and the about cue. Personal and inviting. The quote sets italic
 *  via the scoped `.ms-founder-card [data-type="quote"]` rule in skinVarsCss. */
export function FounderCard({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {founder.eyebrow && (
          <Type as="span" role="eyebrow" style={{ color: 'var(--ms-accent)', display: 'block', marginBottom: 14 }}>
            {founder.eyebrow}
          </Type>
        )}
        {founder.heading && (
          <Type as="h2" role="title" style={{ color: 'var(--ms-contrast-fg)', margin: '0 0 28px' }}>
            {founder.heading}
          </Type>
        )}
        <div style={{ width: 156, height: 156, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 24px', position: 'relative', border: `1px solid ${HAIR}` }}>
          <Media media={founder.photo} />
        </div>
        <Type as="p" role="quote" style={{ color: 'var(--ms-contrast-fg)', margin: 0, lineHeight: 1.5 }}>{founder.quote}</Type>
        <Type as="div" role="sig" style={{ color: 'var(--ms-contrast-fg-muted)', marginTop: 22 }}>&mdash; {founder.attribution}</Type>
        <AboutCue about={about} />
      </div>
    </FounderBand>
  );
}
