/**
 * Main Street — chrome: the skin→CSS bridge and the shared shell.
 *
 * Owns the one place a skin's values become CSS: `skinVarsCss` emits every
 * color (both surfaces) and every font voice as a `--ms-*` custom property
 * scoped to `.arch-main-street`, plus the structural CSS (grain, scroll reveal,
 * the goods marquee, responsive rules). The beats then reference vars and
 * `color-mix` derivations — never literals. Structure only; no niche words.
 */
import React from 'react';
import Link from 'next/link';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { MainStreetContent } from './schemas';
import { MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';

export function typeRoleCss(role: TypeRole): React.CSSProperties {
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

export function fontHref(skin: ArchetypeTheme): string {
  return MAIN_STREET_FONT_HREFS[skin.key] ?? Object.values(MAIN_STREET_FONT_HREFS)[0]!;
}

export function roles(skin: ArchetypeTheme): MainStreetRoles {
  return skin.type as unknown as MainStreetRoles;
}

export function skinVarsCss(skin: ArchetypeTheme): string {
  const p = skin.palette;
  const c = p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.fgMuted };
  const sp = skin.spacing;
  const a = skin.atmosphere;
  const mo = skin.motion;
  const r = roles(skin);
  // Mobile font-size overrides for roles that declare a distinct sizeMobile.
  const responsive = Object.entries(skin.type)
    .filter(([, role]) => role.sizeMobile && role.sizeMobile !== role.size)
    .map(
      ([k, role]) =>
        `@media (max-width:768px){.arch-main-street [data-type="${k}"]{font-size:${role.sizeMobile}px}}`,
    )
    .join('\n');
  return `
    .arch-main-street{
      --ms-bg:${p.bg};--ms-fg:${p.fg};--ms-fg-muted:${p.fgMuted};--ms-accent:${p.accent};--ms-on-accent:${p.onAccent ?? p.bg};--ms-rule:${p.rule};
      --ms-contrast-bg:${c.bg};--ms-contrast-fg:${c.fg};--ms-contrast-fg-muted:${c.fgMuted};
      --ms-disp:${r.brand.family};--ms-body:${r.body.family};--ms-mono:${r.eyebrow.family};
      --ms-section:${sp.section}px;--ms-loose:${sp.loose}px;--ms-base:${sp.base}px;--ms-tight:${sp.tight}px;
      background:var(--ms-bg);color:var(--ms-fg);position:relative;isolation:isolate;min-height:100vh;
      font-family:var(--ms-body);line-height:1.6;
    }
    .arch-main-street a{color:var(--ms-accent);text-decoration:none}
    .arch-main-street .ms-grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;mix-blend-mode:multiply;background-image:${a.grain ?? 'none'}}
    .arch-main-street .archetype-photo{filter:${a.photoFilter ?? 'none'};display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-wrap{max-width:1200px;margin-inline:auto;padding-inline:40px}
    @media(max-width:860px){.arch-main-street .ms-wrap{padding-inline:20px}}
    /* scroll reveal — arrives once, resolves to stillness */
    .arch-main-street .ms-reveal{opacity:0;transform:translateY(30px);transition:opacity 1.1s ${mo.reveal.easing},transform 1.1s ${mo.reveal.easing}}
    .arch-main-street .ms-reveal.in{opacity:1;transform:none}
    .arch-main-street .ms-reveal.d1{transition-delay:.12s}
    /* goods marquee — slow, edge-to-edge, pauses on hover */
    .arch-main-street .ms-marquee{animation:ms-scroll 46s linear infinite}
    .arch-main-street .ms-marquee:hover{animation-play-state:paused}
    @keyframes ms-scroll{to{transform:translateX(-50%)}}
    @media(max-width:860px){
      .arch-main-street .ms-founder-grid{grid-template-columns:1fr!important;gap:36px!important}
      .arch-main-street .ms-marquee [data-ms-card]{width:74vw}
    }
    @media(prefers-reduced-motion:reduce){
      .arch-main-street .ms-reveal{opacity:1;transform:none;transition:none}
      .arch-main-street .ms-marquee{animation:none}
    }
    ${responsive}
  `;
}

export function MainStreetRoot({ skin, children }: { skin: ArchetypeTheme; children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={fontHref(skin)} />
      <style dangerouslySetInnerHTML={{ __html: skinVarsCss(skin) }} />
      <div className="arch-main-street">
        <div className="ms-grain" aria-hidden />
        {children}
      </div>
    </>
  );
}

export function Media({
  media,
  className,
  style,
}: {
  media: { kind?: 'video' | 'image'; url?: string | undefined; poster?: string | undefined; alt: string };
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = ['archetype-photo', className].filter(Boolean).join(' ');
  if (media.kind === 'video' && media.url) {
    return (
      <video className={cls} style={style} src={media.url} poster={media.poster} autoPlay loop muted playsInline aria-label={media.alt} />
    );
  }
  if (media.url) return <img className={cls} style={style} src={media.url} alt={media.alt} />;
  return <div className={cls} aria-label={media.alt} style={{ ...style, background: 'var(--ms-fg-muted)', opacity: 0.18 }} />;
}

export function Nav({ identity, skin }: { identity: MainStreetContent['identity']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <>
      <Link href="/" data-type="wordmark" style={{ ...typeRoleCss(r.wordmark), color: 'inherit' }}>
        {identity.wordmark}
      </Link>
      <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
        {identity.nav.map((item) => (
          <a key={item} href="#" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
            {item}
          </a>
        ))}
        <a href="/cart" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
          Cart
        </a>
      </div>
    </>
  );
}

export function MainStreetFooter({ shopName, skin }: { shopName: string; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <footer
      style={{
        background: 'var(--ms-contrast-bg)',
        color: 'var(--ms-contrast-fg)',
        padding: '54px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
      }}
    >
      <span data-type="wordmark" style={{ ...typeRoleCss(r.wordmark) }}>
        {shopName}
      </span>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <Link href="/" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Home
        </Link>
        <a href="/privacy" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Privacy
        </a>
        <a href="/terms" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>
          Terms
        </a>
        <span data-type="legal" style={{ ...typeRoleCss(r.legal), opacity: 0.5 }}>
          &copy; {shopName}
        </span>
      </div>
    </footer>
  );
}
