/**
 * Main Street — BEATS 2-4.
 *
 *  2. GOODS IN MOTION — a slow, edge-to-edge marquee of catalog rows (never a
 *     card grid, the banned AI-builder tell). Hover to pause.
 *  3. FOUNDER + a real "find us this week" CALENDAR — the maker's voice and
 *     face beside where to meet them, on the skin's CONTRAST surface (so the
 *     same bones invert correctly for a dark skin with zero code change).
 *  4. CLOSE — a big-type sign-off + an order/pickup CTA.
 *
 * Structure only: every color is a skin var or a color-mix derivation, every
 * type value is a named role, every word is a content slot.
 */
import React from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';

export function GoodsMarquee({
  goods,
  products,
  skin,
}: {
  goods: MainStreetContent['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
}) {
  const r = roles(skin);
  // Duplicate the row so the -50% scroll loops seamlessly.
  const loop = [...products, ...products];
  return (
    <section id="goods" style={{ padding: '96px 0 110px', overflow: 'hidden' }}>
      <div
        className="ms-wrap"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}
      >
        <h2 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: 0 }}>
          {goods.title}
        </h2>
        {goods.label && (
          <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)' }}>
            {goods.label}
          </span>
        )}
      </div>
      <div className="ms-marquee" style={{ display: 'flex', gap: 26, width: 'max-content', padding: '0 13px' }}>
        {loop.map((p, i) => (
          <article key={p.slug + i} data-ms-card style={{ width: 340, flex: '0 0 auto' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 5',
                borderRadius: 3,
                overflow: 'hidden',
                background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))',
              }}
            >
              <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
              <span
                data-type="price"
                style={{
                  ...typeRoleCss(r.price),
                  position: 'absolute',
                  left: 12,
                  bottom: 12,
                  background: 'var(--ms-bg)',
                  color: 'var(--ms-fg)',
                  padding: '6px 10px',
                  borderRadius: 2,
                }}
              >
                {p.price}
              </span>
            </div>
            <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: '16px 0 2px' }}>
              {p.name}
            </h3>
            {p.shortDescription && (
              <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: 0 }}>
                {p.shortDescription}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function FounderCalendar({ founder, skin }: { founder: MainStreetContent['founder']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  // Hairlines derived from the contrast surface's own text — direction-agnostic.
  const hair = 'color-mix(in srgb, var(--ms-contrast-fg) 18%, transparent)';
  return (
    <section
      data-ms-founder
      style={{ background: 'var(--ms-contrast-bg)', color: 'var(--ms-contrast-fg)', padding: '110px 40px' }}
    >
      <div
        className="ms-wrap ms-founder-grid"
        style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}
      >
        <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden' }}>
          <Media media={founder.photo} />
        </div>
        <div>
          <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0 }}>
            {founder.quote}
          </p>
          <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 26 }}>
            &mdash; {founder.attribution}
          </div>
          {founder.findUs && (
            <div style={{ marginTop: 40, borderTop: `1px solid ${hair}`, paddingTop: 24 }}>
              <span
                data-type="eyebrow"
                style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 16 }}
              >
                {founder.findUs.label}
              </span>
              {founder.findUs.rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 16,
                    padding: '13px 0',
                    borderBottom: `1px solid ${hair}`,
                  }}
                >
                  <span data-type="day" style={{ ...typeRoleCss(r.day), color: 'var(--ms-contrast-fg-muted)', flex: '0 0 95px' }}>
                    {row.day}
                  </span>
                  <span data-type="where" style={{ ...typeRoleCss(r.where), color: 'var(--ms-contrast-fg)', flex: 1 }}>
                    {row.where}
                  </span>
                  <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-contrast-fg-muted)' }}>
                    {row.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Close({ close, skin }: { close: MainStreetContent['close']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <section style={{ padding: '130px 40px', textAlign: 'center' }}>
      <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 22 }}>
        {close.label}
      </span>
      <h2 data-type="closeHead" style={{ ...typeRoleCss(r.closeHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: '0 auto 36px' }}>
        {close.headline}
      </h2>
      <a
        href="#"
        data-type="navLabel"
        style={{
          ...typeRoleCss(r.navLabel),
          background: 'var(--ms-accent)',
          color: '#fff',
          padding: '16px 26px',
          borderRadius: 2,
          display: 'inline-block',
        }}
      >
        {close.ctaLabel}
      </a>
    </section>
  );
}
