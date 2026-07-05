/**
 * Main Street — BEAT 3, the founder, in seven bodies (quote, portrait, letter,
 * card, workbench, editorial, signature).
 *
 * All seven live on the skin's CONTRAST surface as a band that spans the full
 * viewport width — but the portrait and copy stay inside the content column
 * (`ms-wrap`, padded), so nothing ever kisses the screen edges. Each is a TEASER
 * carrying an "about" cue to the full bio; the calendar shows whenever the maker
 * does in-person events. Structure only — every color is a skin var, every type
 * value comes from its role's CSS (via the Type component), NO inline styles.
 * Two treatments set their text italic (letter attribution, card quote) — that
 * lives as a scoped `[data-type]` rule in skinVarsCss, never inline.
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

/** The full-width contrast band; children are held inside the padded column. */
function FounderBand({ children }: { children: ReactNode }) {
  return (
    <section data-ms-founder className="ms-founder-band">
      <div className="ms-wrap">{children}</div>
    </section>
  );
}

function AboutCue({ about }: { about: FounderAbout | undefined }) {
  if (!about) return null;
  return (
    <Type as="a" role="navLabel" href={about.href} className="ms-founder-aboutcue ms-aboutcue">
      {about.label} &rarr;
    </Type>
  );
}

/** The calendar list. Lives on the contrast band (onContrast, default) OR the
 *  base surface (onContrast=false, when rendered as its own find-us beat). The
 *  hairline + text colors flip with the surface via the `data-oncontrast`
 *  attribute — never inline. The "see all" cue only renders when the copywriter
 *  authored an eventsLabel; no hardcoded English fallback. */
export function FindUsList({ findUs, eventsHref, heading = 'eyebrow', onContrast = true }: { findUs: NonNullable<Founder['findUs']>; eventsHref: string; heading?: 'eyebrow' | 'title'; onContrast?: boolean }) {
  return (
    <div className="ms-findus-list" data-oncontrast={onContrast ? 'true' : 'false'}>
      <Type as="span" role={heading} className="ms-findus-heading" data-heading={heading}>
        {findUs.label}
      </Type>
      {findUs.rows.map((row, i) => (
        <div key={i} className="ms-findus-row">
          <Type as="span" role="day" className="ms-findus-day">{row.day}</Type>
          <Type as="span" role="where" className="ms-findus-where">{row.where}</Type>
          <Type as="span" role="price" className="ms-findus-time">{row.time}</Type>
        </div>
      ))}
      {findUs.eventsLabel && (
        <Type as="a" role="navLabel" href={eventsHref} className="ms-findus-cue ms-eventscue">
          {findUs.eventsLabel} &rarr;
        </Type>
      )}
    </div>
  );
}

type TreatmentProps = { founder: Founder; skin: ArchetypeTheme; about?: FounderAbout | undefined };

/** quote — portrait beside a pull-quote (the calm, authority-forward default). */
export function FounderQuote({ founder, about }: TreatmentProps) {
  return (
    <FounderBand>
      <div className="ms-founder-quote ms-founder-grid">
        <div className="ms-founder-quote-photo">
          <Media media={founder.photo} />
        </div>
        <div>
          <Type as="p" role="quote" className="ms-founder-quote-body">{founder.quote}</Type>
          <Type as="div" role="sig" className="ms-founder-quote-sig">&mdash; {founder.attribution}</Type>
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
      <div className="ms-founder-portrait ms-founder-portrait-frame">
        <Media media={founder.photo} />
        <div data-portrait-anchor className="ms-founder-portrait-anchor">
          <div data-portrait-scrim aria-hidden="true" className="ms-founder-portrait-scrim" />
          <div data-portrait-text className="ms-founder-portrait-text">
            <Type as="p" role="quote" className="ms-founder-portrait-quote">{founder.quote}</Type>
            <Type as="div" role="sig" className="ms-founder-portrait-sig">&mdash; {founder.attribution}</Type>
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
          {founder.eyebrow && (
            <Type as="span" role="eyebrow" className="ms-letter-kicker">
              {founder.eyebrow}
            </Type>
          )}
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
      <div className="ms-founder-card">
        {founder.eyebrow && (
          <Type as="span" role="eyebrow" className="ms-founder-card-eyebrow">
            {founder.eyebrow}
          </Type>
        )}
        {founder.heading && (
          <Type as="h2" role="title" className="ms-founder-card-heading">
            {founder.heading}
          </Type>
        )}
        <div className="ms-founder-card-avatar">
          <Media media={founder.photo} />
        </div>
        <Type as="p" role="quote" className="ms-founder-card-quote">{founder.quote}</Type>
        <Type as="div" role="sig" className="ms-founder-card-sig">&mdash; {founder.attribution}</Type>
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
            {founder.eyebrow && (
              <Type as="span" role="eyebrow" className="ms-wb-eye">
                {founder.eyebrow}
              </Type>
            )}
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
  const headline = aboutPage?.heading ?? founder.heading;
  return (
    <FounderBand>
      <div className="ms-founder-editorial">
        {founder.eyebrow && (
          <Type as="span" role="eyebrow" className="ms-ed-kicker">
            {founder.eyebrow}
          </Type>
        )}
        {headline && (
          <Type as="h2" role="goodsHead" className="ms-ed-head">{headline}</Type>
        )}
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
        {founder.eyebrow && (
          <Type as="span" role="eyebrow" className="ms-sig-eye">
            {founder.eyebrow}
          </Type>
        )}
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
