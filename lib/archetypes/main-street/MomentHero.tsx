'use client';

/**
 * Main Street — BEAT 1: the moment IS the hero.
 *
 * A full-screen held video with the brand story told one line at a time,
 * cross-fading, landing on the brand + CTA — and that landing IS the resting
 * hero. Plays on load; you scroll past it. The fixed nav stays hidden until the
 * brand lands, then appears, and goes solid once the hero scrolls out of view.
 *
 * Timing is copied EXACTLY from the proven Story primitive: a 900ms breath of
 * media alone, 3400ms hold per line, a 1.8s LINEAR cross-fade (an eased opacity
 * fade front-loads and reads as a pop; linear is a true dissolve). Reads colors
 * and fonts from the skin — nothing typographic or color is hardcoded; the
 * black scrim/backstop are neutral legibility devices, not skin colors.
 */
import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles } from './chrome';

const OPEN_MS = 900;
const HOLD_MS = 3400;
const FADE = '1.8s';

export function MomentHero({
  identity,
  moment,
  skin,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const r = roles(skin);
  const brandStep = moment.story.length;
  const [step, setStep] = useState(-1);
  const [solid, setSolid] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const landed = step >= brandStep;

  useEffect(() => {
    if (step >= brandStep) return undefined;
    const t = setTimeout(() => setStep((s) => s + 1), step < 0 ? OPEN_MS : HOLD_MS);
    return () => clearTimeout(t);
  }, [step, brandStep]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => setSolid(!e.isIntersecting)), {
      rootMargin: '-80px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const frame = (visible: boolean, z: number): CSSProperties => ({
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    padding: 'clamp(28px,6vw,96px)',
    opacity: visible ? 1 : 0,
    transition: `opacity ${FADE} linear`,
    pointerEvents: visible ? 'auto' : 'none',
    zIndex: z,
  });

  const navVisible = landed || solid;

  return (
    <>
      <nav
        data-ms-nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: solid ? '14px 40px' : '20px 40px',
          background: solid ? 'var(--ms-bg)' : 'transparent',
          color: solid ? 'var(--ms-fg)' : 'var(--ms-contrast-fg)',
          boxShadow: solid ? '0 1px 0 var(--ms-rule)' : 'none',
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? 'auto' : 'none',
          transition: 'opacity .8s ease, background .5s ease, padding .5s ease, color .5s ease',
        }}
      >
        <Nav identity={identity} skin={skin} />
      </nav>

      <header
        ref={heroRef}
        data-ms-hero
        style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#0c0907', color: 'var(--ms-contrast-fg)' }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Media media={moment.media} style={{ filter: 'saturate(1.02) contrast(1.04) brightness(.92) sepia(.06)' }} />
        </div>
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.25), rgba(0,0,0,.74))' }}
        />

        {moment.story.map((line, i) => (
          <div key={i} data-story-line style={frame(step === i, 2)}>
            <p
              data-type="storyline"
              style={{
                ...typeRoleCss(r.storyline),
                color: 'var(--ms-contrast-fg)',
                maxWidth: '18ch',
                margin: 0,
                textShadow: '0 2px 36px rgba(0,0,0,.55)',
              }}
            >
              {line}
            </p>
          </div>
        ))}

        <div data-story-brand style={frame(landed, 3)}>
          <div>
            <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-contrast-fg-muted)', marginBottom: 18 }}>
              {moment.eyebrow}
            </div>
            <h1
              data-type="brand"
              style={{ ...typeRoleCss(r.brand), color: 'var(--ms-contrast-fg)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}
            >
              {moment.brand}
            </h1>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <a
                href="#goods"
                data-type="navLabel"
                style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: '#fff', padding: '16px 26px', borderRadius: 2 }}
              >
                {moment.ctaLabel}
              </a>
              {moment.secondaryCtaLabel && (
                <a
                  href="#"
                  data-type="navLabel"
                  style={{
                    ...typeRoleCss(r.navLabel),
                    border: '1px solid var(--ms-contrast-fg-muted)',
                    color: 'var(--ms-contrast-fg)',
                    padding: '16px 26px',
                    borderRadius: 2,
                  }}
                >
                  {moment.secondaryCtaLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
