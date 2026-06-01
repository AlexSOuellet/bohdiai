'use client';

/** THROWAWAY PROBE — the "meld" interaction. Delete with the folder.
 *
 * The intro Moment dissolving into the home page: on Enter, the full-screen moment
 * SLOWLY fades out while the home fades in beneath it. The candle image persists
 * across the dissolve (it's the moment backdrop AND the home hero), so it reads as
 * one continuous fade rather than a page cut. Feel-prototype; real route/cookie/SEO
 * wiring is a separate decision once the motion is approved.
 */
import { useState, type CSSProperties, type MouseEvent } from 'react';
import { compileStyleSheet, googleFontPreconnectLinks } from '@/lib/style-sheet-loader';
import { LayoutPage } from '@/components/storefront/layout/Page';
import type { MomentFixture } from './moments';

const CANDLE_IMAGE =
  'https://jdmizpqtpbmcpspfuihp.supabase.co/storage/v1/object/public/generated-images/hero-images/candle-bonanza/hero.jpg';

// The whole dissolve is deliberately slow.
const DISSOLVE = '2.4s';

export function MeldDemo({ moment }: { moment: MomentFixture }) {
  const [entered, setEntered] = useState(false);
  const compiled = compileStyleSheet(moment.sheet);
  const preconnect = googleFontPreconnectLinks();

  // The moment's "Enter" is an <a href="/shop"> inside the stage tree. Intercept it
  // and run the dissolve instead of navigating.
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && anchor.getAttribute('href') === '/shop') {
      e.preventDefault();
      setEntered(true);
    }
  }

  const eyebrow: CSSProperties = {
    fontFamily: 'var(--type-eyebrow-font)',
    fontSize: 'var(--type-eyebrow-size)',
    fontWeight: 'var(--type-eyebrow-weight)' as CSSProperties['fontWeight'],
    letterSpacing: 'var(--type-eyebrow-letter-spacing, normal)',
    textTransform: 'var(--type-eyebrow-transform, none)' as CSSProperties['textTransform'],
    color: 'var(--color-primary)',
  };

  return (
    <>
      {preconnect.map((l) => (
        <link
          key={l.href}
          rel={l.rel}
          href={l.href}
          {...(l.crossOrigin === 'anonymous' ? { crossOrigin: 'anonymous' as const } : {})}
        />
      ))}
      {compiled.googleFontLinks.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: compiled.cssVariables }} />

      <div style={{ background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
        {/* HOME — sits underneath. Fades in slowly as the moment fades out. */}
        <div
          data-meld-fade
          style={
            {
              '--meld-fade-duration': DISSOLVE,
              opacity: entered ? 1 : 0,
              transition: `opacity ${DISSOLVE} ease`,
              pointerEvents: entered ? 'auto' : 'none',
            } as CSSProperties
          }
        >
          <nav
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 28px',
              background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-outline)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--type-wordmark-font)',
                fontSize: 'var(--type-wordmark-size)',
                fontWeight: 'var(--type-wordmark-weight)' as CSSProperties['fontWeight'],
              }}
            >
              Ember &amp; Oak
            </span>
            <span style={{ display: 'flex', gap: 22, fontFamily: 'var(--type-body-font)', fontSize: 15 }}>
              <span>Shop</span>
              <span>About</span>
              <span>Contact</span>
            </span>
          </nav>

          {/* Home hero — the SAME candle image, now settled as the hero. */}
          <section style={{ position: 'relative', height: '74vh', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CANDLE_IMAGE}
              alt="A lit candle in golden light"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 45%' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.25) 45%, transparent)',
              }}
            />
            <div style={{ position: 'absolute', left: 0, bottom: 0, padding: 56, color: '#f6f1ea', maxWidth: 720 }}>
              <div
                style={{ ...eyebrow, color: '#f6f1ea', opacity: 0.85, marginBottom: 14 }}
              >
                Ember &amp; Oak
              </div>
              <h1
                style={{
                  fontFamily: 'var(--type-headline-font)',
                  fontSize: 'var(--type-headline-size)',
                  fontWeight: 'var(--type-headline-weight)' as CSSProperties['fontWeight'],
                  lineHeight: 1.0,
                  margin: 0,
                  textShadow: '0 1px 28px rgba(0,0,0,0.45)',
                }}
              >
                Made to outlast the evening
              </h1>
            </div>
          </section>

          <section style={{ padding: '88px 28px', background: 'var(--color-surface)' }}>
            <div style={{ maxWidth: 1040, margin: '0 auto' }}>
              <p style={eyebrow}>The bench</p>
              <h2
                style={{
                  fontFamily: 'var(--type-headline-font)',
                  fontSize: 'var(--type-sub-size)',
                  fontWeight: 'var(--type-headline-weight)' as CSSProperties['fontWeight'],
                  lineHeight: 1.05,
                  margin: '12px 0 36px',
                  maxWidth: 640,
                }}
              >
                Three scents poured in small runs
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  ['Morning', 'Citrus, fig leaf, cool stone'],
                  ['Golden hour', 'Amber, saffron, dried rose'],
                  ['After dark', 'Cedar smoke, leather, clove'],
                ].map(([name, notes]) => (
                  <div key={name}>
                    <div
                      style={{
                        aspectRatio: '4 / 5',
                        background: 'var(--color-surface-variant)',
                        borderRadius: 4,
                        marginBottom: 14,
                      }}
                    />
                    <div
                      style={{
                        fontFamily: 'var(--type-sub-font)',
                        fontSize: 'var(--type-sub-size)',
                        fontWeight: 'var(--type-sub-weight)' as CSSProperties['fontWeight'],
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--type-body-font)',
                        fontSize: 'var(--type-body-size)',
                        color: 'var(--color-on-surface-variant)',
                        marginTop: 4,
                      }}
                    >
                      {notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* MOMENT — full-screen overlay. Fades out slowly to reveal the home. */}
        <div
          onClickCapture={onClickCapture}
          aria-hidden={entered}
          data-meld-fade
          style={
            {
              '--meld-fade-duration': DISSOLVE,
              position: 'fixed',
              inset: 0,
              zIndex: 20,
              opacity: entered ? 0 : 1,
              transition: `opacity ${DISSOLVE} ease`,
              pointerEvents: entered ? 'none' : 'auto',
            } as CSSProperties
          }
        >
          <LayoutPage page={moment.page} />
        </div>
      </div>
    </>
  );
}
