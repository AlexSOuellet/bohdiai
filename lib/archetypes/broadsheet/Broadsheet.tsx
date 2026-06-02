/**
 * Broadsheet archetype — renderer.
 *
 * Takes validated content + a resolved theme and produces the page. The
 * composition (masthead → lead → almanac → around-the-oven → classifieds →
 * markets → baker's note → colophon), the type system, the color pairs,
 * the spacing, the atmosphere overlays, and the orchestrated reveal are all
 * baked in here. Bohdi's content fills the slots; he cannot author shape.
 */
import React from 'react';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { BroadsheetContent } from './schemas';

interface BroadsheetRoles {
  masthead: TypeRole;
  motto: TypeRole;
  storyHead: TypeRole;
  sectionHead: TypeRole;
  itemHead: TypeRole;
  body: TypeRole;
  bodyEmphasis: TypeRole;
  caption: TypeRole;
  price: TypeRole;
}

function typeRoleCss(role: TypeRole): React.CSSProperties {
  return {
    fontFamily: role.family,
    fontSize: role.size,
    fontWeight: role.weight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    fontStyle: role.italic ? 'italic' : undefined,
    textTransform: role.uppercase ? 'uppercase' : undefined,
    fontVariationSettings: role.variationSettings,
  };
}

function fontHrefForTheme(_theme: ArchetypeTheme): string {
  // The classical pairing is the only one shipped today. When additional
  // pairings are introduced this becomes per-theme.
  return 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&display=swap';
}

function rootCss(theme: ArchetypeTheme): string {
  const { palette, atmosphere, motion, spacing } = theme;
  const type = theme.type as unknown as BroadsheetRoles;
  const responsive = Object.entries(theme.type)
    .filter(([, role]) => role.sizeMobile && role.sizeMobile !== role.size)
    .map(
      ([key, role]) =>
        `@media (max-width: 768px) { .arch-broadsheet [data-type="${key}"] { font-size: ${role.sizeMobile}px; } }`,
    )
    .join('\n');

  return `
    .arch-broadsheet {
      background: ${palette.bg};
      color: ${palette.fg};
      position: relative;
      isolation: isolate;
      min-height: 100vh;
      --bs-bg: ${palette.bg};
      --bs-fg: ${palette.fg};
      --bs-fg-muted: ${palette.fgMuted};
      --bs-accent: ${palette.accent};
      --bs-rule: ${palette.rule};
      --bs-section: ${spacing.section}px;
      --bs-loose: ${spacing.loose}px;
      --bs-base: ${spacing.base}px;
      --bs-tight: ${spacing.tight}px;
    }
    .arch-broadsheet a { color: var(--bs-accent); text-decoration: none; }
    .arch-broadsheet a:hover { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
    .arch-broadsheet::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      z-index: 1;
      ${atmosphere.grain ?? ''}
    }
    .arch-broadsheet::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      z-index: 1;
      ${atmosphere.wash ?? ''}
    }
    .arch-broadsheet > .arch-stage { position: relative; z-index: 2; }
    .arch-broadsheet .archetype-photo {
      filter: ${atmosphere.photoFilter ?? 'none'};
      mix-blend-mode: multiply;
      display: block;
      width: 100%;
    }
    @keyframes archBroadsheetReveal {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .arch-broadsheet .arch-stage > * {
      opacity: 0;
      animation: archBroadsheetReveal ${motion.reveal.duration}ms ${motion.reveal.easing} forwards;
    }
    ${Array.from({ length: 9 }, (_, i) =>
      `.arch-broadsheet .arch-stage > *:nth-child(${i + 1}) { animation-delay: ${i * motion.reveal.stagger}ms; }`,
    ).join('\n')}
    @media (prefers-reduced-motion: reduce) {
      .arch-broadsheet .arch-stage > * { animation: none; opacity: 1; transform: none; }
    }
    .arch-broadsheet .arch-dropcap::first-letter {
      font-family: ${type.masthead.family};
      font-size: 5.2em;
      line-height: 0.86;
      float: left;
      padding: 6px 12px 0 0;
      color: var(--bs-fg);
    }
    .arch-broadsheet .arch-ornament {
      display: flex; align-items: center; gap: 14px;
      color: var(--bs-fg);
      font-family: ${type.sectionHead.family};
      font-style: italic; font-size: 22px;
      margin: ${spacing.tight}px 0;
    }
    .arch-broadsheet .arch-ornament::before,
    .arch-broadsheet .arch-ornament::after {
      content: ''; flex: 1; height: 1px; background: var(--bs-rule);
    }
    ${responsive}
  `;
}

export function Broadsheet({
  content,
  theme,
}: {
  content: BroadsheetContent;
  theme: ArchetypeTheme;
}) {
  const t = theme.type as unknown as BroadsheetRoles;

  return (
    <>
      <link rel="stylesheet" href={fontHrefForTheme(theme)} />
      <style dangerouslySetInnerHTML={{ __html: rootCss(theme) }} />

      <div className="arch-broadsheet">
        <main
          className="arch-stage"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: `${theme.spacing.section}px ${theme.spacing.loose + 24}px ${theme.spacing.page}px`,
          }}
        >
          {/* ============ MASTHEAD ============ */}
          <header>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                ...typeRoleCss(t.caption),
                color: theme.palette.fgMuted,
                paddingBottom: theme.spacing.tight,
                borderBottom: `1px solid ${theme.palette.rule}`,
              }}
              data-type="caption"
            >
              <span>{content.edition.volumeLabel}</span>
              <span>{content.edition.city}, {content.edition.region}</span>
              <span>{content.edition.dateLine}</span>
              <span>{content.edition.priceLine}</span>
            </div>
            <h1
              data-type="masthead"
              style={{
                ...typeRoleCss(t.masthead),
                margin: `${theme.spacing.loose}px 0 ${theme.spacing.tight}px`,
                textAlign: 'center',
              }}
            >
              {content.mastheadTitle}
            </h1>
            <div
              data-type="motto"
              style={{
                ...typeRoleCss(t.motto),
                textAlign: 'center',
                color: theme.palette.fgMuted,
                paddingBottom: theme.spacing.base,
                borderBottom: `4px double ${theme.palette.rule}`,
              }}
            >
              &mdash; {content.motto} &mdash;
            </div>
            <div
              data-type="caption"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                ...typeRoleCss(t.caption),
                color: theme.palette.fgMuted,
                padding: `${theme.spacing.tight}px 0`,
                borderBottom: `1px solid ${theme.palette.rule}`,
              }}
            >
              <span>{content.nav.sections.join(' · ')}</span>
              <span>{content.nav.primaryCta} · {content.nav.secondaryCta}</span>
            </div>
          </header>

          {/* ============ LEAD STORY ============ */}
          <section
            style={{
              padding: `${theme.spacing.loose}px 0 ${theme.spacing.base}px`,
              borderBottom: `1px solid ${theme.palette.rule}`,
            }}
          >
            <div
              data-type="caption"
              style={{ ...typeRoleCss(t.caption), color: theme.palette.accent, marginBottom: theme.spacing.tight }}
            >
              {content.lead.kicker}
            </div>
            <h2
              data-type="storyHead"
              style={{ ...typeRoleCss(t.storyHead), margin: `0 0 ${theme.spacing.base}px` }}
            >
              {content.lead.headline}
              {content.lead.headlineEmphasis && (
                <em style={{ fontStyle: 'italic', fontWeight: 500 }}> {content.lead.headlineEmphasis}</em>
              )}
            </h2>
            <div
              data-type="bodyEmphasis"
              style={{
                ...typeRoleCss(t.bodyEmphasis),
                color: theme.palette.fgMuted,
                maxWidth: 880,
                marginBottom: theme.spacing.loose,
              }}
            >
              {content.lead.subhead}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: theme.spacing.loose, alignItems: 'start' }}>
              <div>
                {content.lead.photo.url ? (
                  <img
                    src={content.lead.photo.url}
                    alt={content.lead.photo.alt}
                    className="archetype-photo"
                    style={{ height: 380, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      height: 380,
                      background: theme.palette.fgMuted,
                      opacity: 0.18,
                    }}
                    aria-label={content.lead.photo.alt}
                  />
                )}
                <div
                  data-type="caption"
                  style={{
                    ...typeRoleCss(t.caption),
                    color: theme.palette.fgMuted,
                    paddingTop: theme.spacing.tight,
                    borderTop: `1px solid ${theme.palette.fgMuted}`,
                    marginTop: theme.spacing.tight,
                  }}
                >
                  {content.lead.photo.caption}
                </div>
              </div>

              <p
                className="arch-dropcap"
                data-type="body"
                style={{ ...typeRoleCss(t.body), margin: 0 }}
              >
                {content.lead.bodyDropCap}
              </p>

              <p data-type="body" style={{ ...typeRoleCss(t.body), margin: 0 }}>
                {content.lead.bodyContinuation}
              </p>
            </div>

            <div
              style={{
                marginTop: theme.spacing.loose,
                paddingTop: theme.spacing.base,
                borderTop: `1px solid ${theme.palette.fgMuted}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div data-type="storyHead" style={{ ...typeRoleCss(t.storyHead), fontSize: 28, fontWeight: 700, letterSpacing: 0 }}>
                {content.lead.priceWord} <span style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>({content.lead.priceFigure})</span>
              </div>
              <a data-type="caption" href="#" style={{ ...typeRoleCss(t.caption), borderBottom: `1px solid ${theme.palette.accent}`, paddingBottom: 3 }}>
                {content.lead.ctaLabel} &rarr;
              </a>
            </div>
          </section>

          {/* ============ SCHEDULE ============ */}
          <section
            style={{
              padding: `${theme.spacing.loose}px 0 ${theme.spacing.base}px`,
              borderBottom: `4px double ${theme.palette.rule}`,
            }}
          >
            <div className="arch-ornament">
              <span>{content.schedule.title}</span>
            </div>
            <p
              data-type="bodyEmphasis"
              style={{
                ...typeRoleCss(t.bodyEmphasis),
                color: theme.palette.fgMuted,
                textAlign: 'center',
                margin: 0,
                fontSize: 15,
              }}
            >
              {content.schedule.intro}
            </p>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: theme.spacing.base,
                ...typeRoleCss(t.body),
              }}
            >
              <thead>
                <tr style={{ borderTop: `1px solid ${theme.palette.rule}`, borderBottom: `1px solid ${theme.palette.rule}` }}>
                  {[
                    content.schedule.headers.day,
                    content.schedule.headers.item,
                    content.schedule.headers.notes,
                    content.schedule.headers.price,
                    content.schedule.headers.status,
                  ].map((h, i) => (
                    <th
                      key={h}
                      data-type="caption"
                      style={{
                        ...typeRoleCss(t.caption),
                        textAlign: i >= 3 ? 'right' : 'left',
                        padding: '12px 16px 12px 0',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.schedule.rows.map((r, i) => (
                  <tr
                    key={r.day + r.itemName}
                    style={{ borderBottom: i === content.schedule.rows.length - 1 ? 'none' : `1px solid ${theme.palette.fgMuted}` }}
                  >
                    <td style={{ padding: '14px 16px 14px 0', verticalAlign: 'baseline', ...typeRoleCss(t.bodyEmphasis), fontSize: 18, color: r.highlight ? theme.palette.accent : theme.palette.fg }}>{r.day}</td>
                    <td style={{ padding: '14px 16px 14px 0', verticalAlign: 'baseline', ...typeRoleCss(t.bodyEmphasis), fontStyle: 'normal', fontWeight: 600, fontSize: 18 }}>{r.itemName}</td>
                    <td style={{ padding: '14px 16px 14px 0', verticalAlign: 'baseline', color: theme.palette.fgMuted }}>{r.notes}</td>
                    <td style={{ padding: '14px 16px 14px 0', verticalAlign: 'baseline', textAlign: 'right', ...typeRoleCss(t.price) }}>{r.price}</td>
                    <td style={{ padding: '14px 16px 14px 0', verticalAlign: 'baseline', textAlign: 'right', ...typeRoleCss(t.caption), color: r.highlight ? theme.palette.accent : theme.palette.fgMuted }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ============ NEWS COLUMN ============ */}
          <section
            style={{
              padding: `${theme.spacing.loose}px 0 ${theme.spacing.base}px`,
              borderBottom: `1px solid ${theme.palette.rule}`,
            }}
          >
            <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.accent, marginBottom: 6 }}>
              {content.newsColumn.pageLabel}
            </div>
            <h3 data-type="sectionHead" style={{ ...typeRoleCss(t.sectionHead), margin: `0 0 ${theme.spacing.loose}px` }}>
              {content.newsColumn.sectionTitle}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {content.newsColumn.stories.map((s, i) => (
                <article
                  key={s.headline}
                  style={{
                    padding: `0 ${theme.spacing.loose - 8}px`,
                    borderLeft: i === 0 ? 'none' : `1px solid ${theme.palette.rule}`,
                  }}
                >
                  <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.accent, marginBottom: theme.spacing.tight }}>
                    {s.kicker}
                  </div>
                  <h4 data-type="itemHead" style={{ ...typeRoleCss(t.itemHead), fontSize: 26, textTransform: 'none', letterSpacing: '-0.015em', margin: `0 0 ${theme.spacing.tight + 4}px` }}>
                    {s.headline}
                  </h4>
                  <p data-type="body" style={{ ...typeRoleCss(t.body), margin: 0, fontSize: 15.5 }}>
                    {s.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ============ CLASSIFIEDS ============ */}
          <section
            style={{
              padding: `${theme.spacing.loose}px 0 ${theme.spacing.base}px`,
              borderBottom: `1px solid ${theme.palette.rule}`,
            }}
          >
            <div className="arch-ornament">
              <span>{content.classifieds.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: theme.spacing.base }}>
              {content.classifieds.items.map((c, i) => (
                <article
                  key={c.headline}
                  style={{
                    padding: `${theme.spacing.base + 4}px ${theme.spacing.loose - 8}px`,
                    borderTop: i < 2 ? 'none' : `1px solid ${theme.palette.fgMuted}`,
                    borderLeft: i % 2 === 1 ? `1px solid ${theme.palette.rule}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <h5 data-type="itemHead" style={{ ...typeRoleCss(t.itemHead), fontSize: 20, margin: 0 }}>
                      {c.headline}
                    </h5>
                    <span data-type="price" style={{ ...typeRoleCss(t.price) }}>{c.price}</span>
                  </div>
                  <p data-type="body" style={{ ...typeRoleCss(t.body), margin: `0 0 ${theme.spacing.tight}px`, fontSize: 15 }}>
                    {c.body}
                  </p>
                  <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>
                    {c.tag}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ============ APPEARANCES ============ */}
          <section
            style={{
              padding: `${theme.spacing.loose}px 0 ${theme.spacing.base}px`,
              borderBottom: `1px solid ${theme.palette.rule}`,
            }}
          >
            <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.accent, marginBottom: 6 }}>
              {content.appearances.pageLabel}
            </div>
            <h3 data-type="sectionHead" style={{ ...typeRoleCss(t.sectionHead), margin: '0 0 8px' }}>
              {content.appearances.sectionTitle}
            </h3>
            <p data-type="bodyEmphasis" style={{ ...typeRoleCss(t.bodyEmphasis), color: theme.palette.fgMuted, marginTop: 0, marginBottom: theme.spacing.loose, fontSize: 17 }}>
              {content.appearances.intro}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', columnGap: theme.spacing.section }}>
              {content.appearances.events.map((e) => (
                <React.Fragment key={e.dayDate + e.location}>
                  <div style={{ padding: '18px 0', borderTop: `1px solid ${theme.palette.fgMuted}`, ...typeRoleCss(t.bodyEmphasis), fontWeight: 500, fontSize: 18 }}>{e.dayDate}</div>
                  <div style={{ padding: '18px 0', borderTop: `1px solid ${theme.palette.fgMuted}`, ...typeRoleCss(t.body) }}>{e.location}</div>
                  <div style={{ padding: '18px 0', borderTop: `1px solid ${theme.palette.fgMuted}`, ...typeRoleCss(t.price), fontSize: 13, color: theme.palette.fgMuted, textAlign: 'right' }}>{e.time}</div>
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* ============ FOUNDER NOTE ============ */}
          <section
            style={{
              padding: `${theme.spacing.section}px 0 ${theme.spacing.loose}px`,
              borderBottom: `4px double ${theme.palette.rule}`,
            }}
          >
            <div className="arch-ornament">
              <span>{content.founderNote.title}</span>
            </div>
            <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: theme.spacing.base }}>
              {content.founderNote.paragraphs.map((p, i) => (
                <p
                  key={i}
                  data-type="body"
                  className={i === 0 ? 'arch-dropcap' : undefined}
                  style={{ ...typeRoleCss(t.body), fontSize: 18, lineHeight: 1.65, margin: i === 0 ? 0 : `${theme.spacing.base + 2}px 0 0` }}
                >
                  {p}
                </p>
              ))}
              <p
                data-type="bodyEmphasis"
                style={{ ...typeRoleCss(t.bodyEmphasis), fontSize: 20, marginTop: theme.spacing.loose - 4 }}
              >
                &mdash; {content.founderNote.signatureName},<br />
                <span data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fgMuted, fontSize: 13 }}>
                  {content.founderNote.signatureRole}
                </span>
              </p>
            </div>
          </section>

          {/* ============ COLOPHON ============ */}
          <footer style={{ padding: `${theme.spacing.loose}px 0 0` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: theme.spacing.section, ...typeRoleCss(t.body), fontSize: 13, color: theme.palette.fgMuted }}>
              <div>
                <div style={{ ...typeRoleCss(t.masthead), fontSize: 28, color: theme.palette.fg, lineHeight: 1, marginBottom: theme.spacing.tight }}>
                  {content.shopName}
                </div>
                <p style={{ margin: 0, lineHeight: 1.55 }}>{content.colophon.description}</p>
              </div>
              <div>
                <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fg, marginBottom: theme.spacing.tight }}>{content.colophon.contactColumnTitle}</div>
                <div style={{ lineHeight: 1.7 }}>
                  {content.colophon.contact.email}<br />
                  {content.colophon.contact.phone}<br />
                  {content.colophon.contact.address}
                </div>
              </div>
              <div>
                <div data-type="caption" style={{ ...typeRoleCss(t.caption), color: theme.palette.fg, marginBottom: theme.spacing.tight }}>
                  {content.colophon.subscribe.title}
                </div>
                <div style={{ lineHeight: 1.55 }}>{content.colophon.subscribe.blurb}</div>
                <a href="#" data-type="caption" style={{ display: 'inline-block', marginTop: theme.spacing.tight, ...typeRoleCss(t.caption), borderBottom: `1px solid ${theme.palette.accent}`, paddingBottom: 2 }}>
                  {content.colophon.subscribe.ctaLabel} &rarr;
                </a>
              </div>
            </div>
            <div style={{ marginTop: theme.spacing.loose, paddingTop: 14, borderTop: `1px solid ${theme.palette.rule}`, display: 'flex', justifyContent: 'space-between', ...typeRoleCss(t.caption), color: theme.palette.fgMuted }}>
              <span>{content.edition.volumeLabel} · {content.edition.dateLine}</span>
              <span>{content.colophon.printedLine}</span>
              <span>&copy; {content.mastheadTitle}</span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
