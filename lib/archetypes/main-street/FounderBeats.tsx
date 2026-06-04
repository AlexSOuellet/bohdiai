/**
 * Main Street — BEAT 3, the founder, in four bodies.
 *
 * All four live on the skin's CONTRAST surface as a band that spans the full
 * viewport width — but the portrait and copy stay inside the content column
 * (`ms-wrap`, padded), so nothing ever kisses the screen edges. Each is a TEASER
 * carrying an "about" cue to the full bio; the calendar shows whenever the maker
 * does in-person events. Structure only — every color is a skin var, every type
 * value a named role.
 */
import type { ReactNode } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';

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

function AboutCue({ about, skin }: { about: FounderAbout | undefined; skin: ArchetypeTheme }) {
  if (!about) return null;
  const r = roles(skin);
  return (
    <a href={about.href} data-type="navLabel" className="ms-aboutcue" style={{ ...typeRoleCss(r.navLabel), color: 'var(--ms-accent)', display: 'inline-block', marginTop: 30 }}>
      {about.label} &rarr;
    </a>
  );
}

function FindUsList({ findUs, skin, eventsHref, heading = 'eyebrow' }: { findUs: NonNullable<Founder['findUs']>; skin: ArchetypeTheme; eventsHref: string; heading?: 'eyebrow' | 'title' }) {
  const r = roles(skin);
  return (
    <div>
      <span data-type={heading} style={{ ...typeRoleCss(heading === 'title' ? r.title : r.eyebrow), color: heading === 'title' ? 'var(--ms-contrast-fg)' : 'var(--ms-accent)', display: 'block', marginBottom: 16 }}>
        {findUs.label}
      </span>
      {findUs.rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '13px 0', borderBottom: `1px solid ${HAIR}` }}>
          <span data-type="day" style={{ ...typeRoleCss(r.day), color: 'var(--ms-contrast-fg-muted)', flex: '0 0 95px' }}>{row.day}</span>
          <span data-type="where" style={{ ...typeRoleCss(r.where), color: 'var(--ms-contrast-fg)', flex: 1 }}>{row.where}</span>
          <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-contrast-fg-muted)' }}>{row.time}</span>
        </div>
      ))}
      <a href={eventsHref} data-type="navLabel" className="ms-eventscue" style={{ ...typeRoleCss(r.navLabel), color: 'var(--ms-accent)', display: 'inline-block', marginTop: 18 }}>
        {findUs.eventsLabel ?? DEFAULT_EVENTS} &rarr;
      </a>
    </div>
  );
}

type TreatmentProps = { founder: Founder; skin: ArchetypeTheme; about?: FounderAbout | undefined; eventsHref: string };

/** quote — portrait beside a pull-quote (the calm, authority-forward default). */
export function FounderQuote({ founder, skin, about, eventsHref }: TreatmentProps) {
  const r = roles(skin);
  return (
    <FounderBand>
      <div className="ms-founder-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}>
        <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden' }}>
          <Media media={founder.photo} />
        </div>
        <div>
          <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0 }}>{founder.quote}</p>
          <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 26 }}>&mdash; {founder.attribution}</div>
          {founder.findUs && (
            <div style={{ marginTop: 40, borderTop: `1px solid ${HAIR}`, paddingTop: 24 }}>
              <FindUsList findUs={founder.findUs} skin={skin} eventsHref={eventsHref} />
            </div>
          )}
          <AboutCue about={about} skin={skin} />
        </div>
      </div>
    </FounderBand>
  );
}

/** portrait — a large CONTAINED portrait, the quote over a soft bottom scrim.
 *  The image sits inside the column; text is inset from the block's own edges. */
export function FounderPortrait({ founder, skin, about, eventsHref }: TreatmentProps) {
  const r = roles(skin);
  return (
    <FounderBand>
      <div className="ms-founder-portrait" style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '16 / 10' }}>
        <Media media={founder.photo} />
        <div className="ms-portrait-scrim" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--ms-contrast-bg) 4%, color-mix(in srgb, var(--ms-contrast-bg) 50%, transparent) 32%, transparent 62%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '48px clamp(28px, 5vw, 64px)' }}>
          <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0, maxWidth: '22ch' }}>{founder.quote}</p>
          <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 20 }}>&mdash; {founder.attribution}</div>
        </div>
      </div>
      {founder.findUs && (
        <div className="ms-portrait-strip" style={{ marginTop: 36 }}>
          <FindUsList findUs={founder.findUs} skin={skin} eventsHref={eventsHref} />
        </div>
      )}
      <AboutCue about={about} skin={skin} />
    </FounderBand>
  );
}

/** letter — the quote as a short signed note on a narrow measure, a small inset
 *  portrait. Intimate and homemade; the antidote to the dark-slab reflex. */
export function FounderLetter({ founder, skin, about, eventsHref }: TreatmentProps) {
  const r = roles(skin);
  return (
    <FounderBand>
      <div className="ms-founder-letter" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 104, height: 104, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 34px', position: 'relative', border: `1px solid ${HAIR}` }}>
          <Media media={founder.photo} />
        </div>
        <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0, lineHeight: 1.4 }}>{founder.quote}</p>
        <div data-type="title" style={{ ...typeRoleCss(r.title), fontStyle: 'italic', color: 'var(--ms-contrast-fg)', marginTop: 30 }}>{founder.attribution}</div>
        {founder.findUs && (
          <div style={{ marginTop: 44, textAlign: 'left', borderTop: `1px solid ${HAIR}`, paddingTop: 28 }}>
            <FindUsList findUs={founder.findUs} skin={skin} eventsHref={eventsHref} />
          </div>
        )}
        <AboutCue about={about} skin={skin} />
      </div>
    </FounderBand>
  );
}

/** findus — the calendar is the hero; the portrait + a line of voice support it.
 *  Only valid when a find-us list exists (the dispatcher guarantees it). */
export function FounderFindUs({ founder, skin, about, eventsHref }: TreatmentProps) {
  const r = roles(skin);
  const findUs = founder.findUs;
  return (
    <FounderBand>
      <div className="ms-founder-findus" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 64, alignItems: 'start' }}>
        <div>{findUs && <FindUsList findUs={findUs} skin={skin} eventsHref={eventsHref} heading="title" />}</div>
        <div className="ms-findus-aside">
          <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 3, overflow: 'hidden', marginBottom: 22 }}>
            <Media media={founder.photo} />
          </div>
          <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-contrast-fg)', margin: 0 }}>{founder.quote}</p>
          <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 18 }}>&mdash; {founder.attribution}</div>
          <AboutCue about={about} skin={skin} />
        </div>
      </div>
    </FounderBand>
  );
}
