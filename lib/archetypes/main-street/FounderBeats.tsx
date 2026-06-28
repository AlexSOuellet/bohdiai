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

/** Split "Maren Ellis, founder" into [name, role]; no comma → [whole, '']. Used by
 *  the letter and signature to set the name as a flourish and the role as a label. */
function splitAttribution(attribution: string): [string, string] {
  const i = attribution.indexOf(',');
  if (i === -1) return [attribution.trim(), ''];
  return [attribution.slice(0, i).trim(), attribution.slice(i + 1).trim()];
}

/** letter — a real note: a slip of paper laid on the contrast band, slightly
 *  turned, a snapshot clipped to one corner, the maker's words read left-aligned
 *  like correspondence, signed in the skin's display hand. Intimate and homemade —
 *  the structural opposite of the centered card. Paper + ink derive from the skin's
 *  base surface; placement, rotation, the clip, and the signed hand are all classes
 *  in skinVarsCss, never inline. */
export function FounderLetter({ founder, about }: TreatmentProps) {
  const [name, role] = splitAttribution(founder.attribution);
  return (
    <FounderBand>
      <div className="ms-letter-stage">
        <div className="ms-founder-letter ms-letter-paper">
          <span className="ms-letter-clip">
            <Media media={founder.photo} />
          </span>
          <Type as="span" role="eyebrow" className="ms-letter-kicker">
            {founder.eyebrow ?? 'A note'}
          </Type>
          <Type as="p" role="body" className="ms-letter-body">{founder.quote}</Type>
          <div className="ms-letter-sign">{name}</div>
          {role && (
            <Type as="div" role="sig" className="ms-letter-name">{role}</Type>
          )}
          {about && (
            <Type as="a" role="navLabel" href={about.href} className="ms-letter-ps">
              P.S. {about.label} &rarr;
            </Type>
          )}
        </div>
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

/** workbench — the maker at work in their own space. A wide documentary shot of the
 *  craft (hands at the bench), then a caption: an eyebrow, the maker's name, and a
 *  short intro in their own words. The environment is the subject, not a posed
 *  headshot — that's what sets it apart from the portrait. The wide media and the
 *  caption grid are classes in skinVarsCss, never inline. */
export function FounderWorkbench({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-workbench">
        <span className="ms-wb-photo">
          <Media media={founder.photo} />
        </span>
        <div className="ms-wb-cap">
          <div className="ms-wb-head">
            <Type as="span" role="eyebrow" className="ms-wb-eye">
              {founder.eyebrow ?? 'In the workshop'}
            </Type>
            <Type as="div" role="title" className="ms-wb-name">{founder.attribution}</Type>
          </div>
          <div className="ms-wb-text">
            <Type as="p" role="body" className="ms-wb-intro">{founder.quote}</Type>
            <AboutCue about={about} />
          </div>
        </div>
      </div>
    </FounderBand>
  );
}

/** editorial — a magazine "meet the maker" feature. A kicker, a feature headline, a
 *  byline, then the long About story set in two columns with a drop cap, a pull-quote,
 *  and the about cue. Long-form and refined where the other bodies are short. It
 *  draws on the authored About story when present (finally giving it a home on the
 *  front page) and falls back to the quote alone. Columns, the drop cap, and the
 *  pull-quote rules live in skinVarsCss. */
export function FounderEditorial({
  founder,
  about,
  aboutPage,
}: TreatmentProps & { aboutPage?: MainStreetContent['about'] }) {
  const paragraphs = aboutPage?.story ?? [founder.quote];
  const headline = aboutPage?.heading ?? founder.heading ?? 'Meet the maker';
  return (
    <FounderBand>
      <div className="ms-founder-editorial">
        <Type as="span" role="eyebrow" className="ms-ed-kicker">
          {founder.eyebrow ?? 'Meet the maker'}
        </Type>
        <Type as="h2" role="goodsHead" className="ms-ed-head">{headline}</Type>
        <Type as="div" role="sig" className="ms-ed-by">{founder.attribution}</Type>
        <div className="ms-ed-cols">
          {paragraphs.map((p, i) => (
            <Type as="p" role="body" key={i} className="ms-ed-para">{p}</Type>
          ))}
        </div>
        {aboutPage && (
          <Type as="p" role="quote" className="ms-ed-pull">{founder.quote}</Type>
        )}
        <AboutCue about={about} />
      </div>
    </FounderBand>
  );
}

/** signature — the maker's promise set large as type, no photo. A manifesto the
 *  words carry on their own: a small kicker, the statement in the skin's display
 *  voice (an amplified close-head), the maker's name as a signed hand, then the
 *  role. Assertive and modern. The statement amplifies its role through a scoped
 *  class in skinVarsCss. */
export function FounderSignature({ founder, about }: TreatmentProps) {
  const [name, role] = splitAttribution(founder.attribution);
  return (
    <FounderBand>
      <div className="ms-founder-signature">
        <Type as="span" role="eyebrow" className="ms-sig-eye">
          {founder.eyebrow ?? 'What we stand for'}
        </Type>
        <Type as="p" role="closeHead" className="ms-sig-statement">{founder.quote}</Type>
        <div className="ms-sig-sign">{name}</div>
        {role && (
          <Type as="div" role="sig" className="ms-sig-name">{role}</Type>
        )}
        <AboutCue about={about} />
      </div>
    </FounderBand>
  );
}
