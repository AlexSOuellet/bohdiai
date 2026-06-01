/** THROWAWAY PROBE — editorial poster, take three: an ACTUAL poster, not a split
 * hero. Type composed ONTO the one image — masthead over the airy top, feature line
 * anchored low, scale contrast, coverline, a frame. Refined/cool palette. Hero
 * generated on Higgsfield. Delete with the folder. */
import type { CSSProperties } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600&display=swap';

const C = {
  bone: '#ece9df',
  ink: '#2f3328',
  soft: '#52584a',
  sage: '#7a8568',
  terra: '#b16f4c',
};

function reveal(delayMs: number, durSec = 2.6): CSSProperties {
  return {
    '--stage-reveal-duration': `${durSec}s`,
    animation: `stage-fade var(--stage-reveal-duration) linear ${delayMs}ms both`,
  } as CSSProperties;
}

const label: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 'clamp(11px, 1vw, 13px)',
  fontWeight: 600,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
};

export default function PosterBotanicalPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />

      <main style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden', background: C.bone }}>
        {/* the one image, full-bleed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/poster-botanical.png"
          alt="Dried lavender, eucalyptus and wildflowers with amber apothecary vials on linen"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 32%',
            animation: 'stage-fade 2s ease both',
          }}
        />
        {/* lighten top + bottom so the ink type reads on the photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(236,233,223,0.62) 0%, rgba(236,233,223,0.05) 26%, rgba(236,233,223,0) 55%, rgba(236,233,223,0.5) 86%, rgba(236,233,223,0.72) 100%)',
          }}
        />
        {/* poster frame */}
        <div style={{ position: 'absolute', inset: 'clamp(16px, 1.8vw, 30px)', border: `1px solid ${C.ink}40`, pointerEvents: 'none' }} />

        {/* composed overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'clamp(40px, 5vw, 88px)',
            color: C.ink,
          }}
        >
          {/* TOP — kicker + masthead, big */}
          <div>
            <div style={{ ...label, color: C.sage, marginBottom: 'clamp(14px, 2vw, 24px)' }}>
              Small-batch botanical apothecary
            </div>
            <h1
              style={{
                ...reveal(300, 2.8),
                fontFamily: 'Fraunces, serif',
                fontWeight: 400,
                fontSize: 'clamp(52px, 9.5vw, 168px)',
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
                margin: 0,
                maxWidth: '11ch',
              }}
            >
              Fernhill Botanicals
            </h1>
          </div>

          {/* BOTTOM — feature line low-left, CTA low-right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ width: 56, height: 1, background: C.terra, marginBottom: 22 }} />
              <h2
                style={{
                  ...reveal(1300, 2.8),
                  fontFamily: 'Fraunces, serif',
                  fontWeight: 300,
                  fontSize: 'clamp(28px, 4.2vw, 62px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.015em',
                  margin: 0,
                }}
              >
                Pressed from the{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.terra }}>field</span>, by hand
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 'clamp(13px, 1.3vw, 16px)',
                  letterSpacing: '0.04em',
                  color: C.soft,
                  margin: '18px 0 0',
                }}
              >
                Lavender · Eucalyptus · Wildflower — steeped in small batches
              </p>
            </div>
            <a href="#" style={{ ...label, color: C.ink, borderBottom: `1px solid ${C.ink}`, paddingBottom: 5, whiteSpace: 'nowrap' }}>
              Into the apothecary →
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
