/** THROWAWAY PROBE — the "spotlight" brick, rebuilt to the real vision: the screen
 * starts BLACK and the light slowly comes up on the object — it emerges from the
 * dark — then the words. A whisper of push-in underneath. Hero image generated on
 * Higgsfield (Nano Banana). Delete with the folder. */
import type { CSSProperties } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600&family=Inter:wght@400;500;600&display=swap';

const cream = '#f4efe6';

// reduced-motion-safe slow opacity fade (the mechanism the stage uses)
function reveal(delayMs: number, durSec = 2.6): CSSProperties {
  return {
    '--stage-reveal-duration': `${durSec}s`,
    animation: `stage-fade var(--stage-reveal-duration) linear ${delayMs}ms both`,
  } as CSSProperties;
}

export default function SpotlightPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
      {/* a whisper of push-in underneath the reveal */}
      <style>{`@keyframes spotlight-push { from { transform: scale(1.0); } to { transform: scale(1.1); } }`}</style>

      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* slow push-in wrapper (gentle, secondary) */}
        <div
          data-spotlight-zoom
          style={
            {
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              transformOrigin: '30% 52%',
              '--spotlight-zoom-duration': '20s',
              animation: 'spotlight-push 20s ease-out forwards',
            } as CSSProperties
          }
        >
          {/* THE SPOTLIGHT: the image rises out of pure black over ~6s */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/spotlight-ring.png"
            alt="A handmade hammered silver ring with a raw labradorite stone"
            data-stage-reveal
            style={
              {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                '--stage-reveal-duration': '6s',
                animation: 'stage-fade var(--stage-reveal-duration) linear 500ms both',
              } as CSSProperties
            }
          />
        </div>

        {/* deepen the right side so the words read once the light is up */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 480,
            textAlign: 'right',
            padding: 'clamp(32px, 6vw, 96px)',
            color: cream,
          }}
        >
          <div
            data-stage-reveal
            style={{
              ...reveal(4200, 2.2),
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(11px, 1vw, 13px)',
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#d9b27a',
              marginBottom: 22,
            }}
          >
            Handmade, one at a time
          </div>

          <h1
            data-stage-reveal
            style={{
              ...reveal(5000),
              fontFamily: 'Fraunces, serif',
              fontWeight: 300,
              fontSize: 'clamp(40px, 6vw, 88px)',
              lineHeight: 0.98,
              letterSpacing: '-0.01em',
              margin: 0,
              textShadow: '0 2px 40px rgba(0,0,0,0.6)',
            }}
          >
            Ore &amp; Ash
          </h1>

          <p
            data-stage-reveal
            style={{
              ...reveal(6200),
              fontFamily: 'Fraunces, serif',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(17px, 1.7vw, 22px)',
              lineHeight: 1.4,
              color: 'rgba(244,239,230,0.9)',
              margin: '20px 0 0',
            }}
          >
            Raised from raw silver and stone
          </p>

          <a
            data-stage-reveal
            href="#"
            style={{
              ...reveal(7200),
              display: 'inline-block',
              marginTop: 34,
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: cream,
              borderBottom: `1px solid ${cream}`,
              paddingBottom: 4,
            }}
          >
            See the work
          </a>
        </div>
      </main>
    </>
  );
}
