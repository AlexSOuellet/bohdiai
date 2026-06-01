/** THROWAWAY PROBE — the "atmosphere wash" brick: a still that's quietly ALIVE.
 * No video — the image sits present while CSS gives it ambient life: a warm glow
 * breathing on the object, dust motes drifting through the light, a whisper of
 * grain. The cheap, no-video option for static niches. Same ring + brand as the
 * spotlight so the brick difference is pure. Delete with the folder. */
import type { CSSProperties } from 'react';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600&family=Inter:wght@400;500;600&display=swap';

const cream = '#f4efe6';

function reveal(delayMs: number, durSec = 2.6): CSSProperties {
  return {
    '--stage-reveal-duration': `${durSec}s`,
    animation: `stage-fade var(--stage-reveal-duration) linear ${delayMs}ms both`,
  } as CSSProperties;
}

// Dust motes drifting up through the light — hardcoded (no random) to stay stable.
const MOTES = [
  { left: '16%', size: 5, dur: 15, delay: 0 },
  { left: '24%', size: 3, dur: 19, delay: 4 },
  { left: '33%', size: 6, dur: 17, delay: 7 },
  { left: '21%', size: 4, dur: 22, delay: 2 },
  { left: '38%', size: 3, dur: 16, delay: 9 },
  { left: '29%', size: 5, dur: 21, delay: 5 },
  { left: '13%', size: 4, dur: 18, delay: 11 },
];

export default function WashPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />
      <style>{`
        @keyframes wash-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wash-breathe { 0%,100% { opacity: .45; transform: translate(-50%,-50%) scale(1); } 50% { opacity: .8; transform: translate(-50%,-50%) scale(1.12); } }
        @keyframes wash-drift { 0% { transform: translateY(40px); opacity: 0; } 18% { opacity: .7; } 82% { opacity: .45; } 100% { transform: translateY(-220px); opacity: 0; } }
      `}</style>

      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#0a0806',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* the still — present, with a gentle settle-in */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/spotlight-ring.png"
          alt="A handmade hammered silver ring with a raw labradorite stone"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            animation: 'wash-in 1.6s ease both',
          }}
        />

        {/* warm glow breathing on the stone */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            top: '50%',
            width: 'min(60vw, 720px)',
            height: 'min(60vw, 720px)',
            background: 'radial-gradient(circle, rgba(232,168,92,0.28), rgba(232,168,92,0.06) 45%, transparent 70%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            animation: 'wash-breathe 8s ease-in-out infinite',
          }}
        />

        {/* drifting dust motes */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {MOTES.map((m, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: m.left,
                bottom: '-30px',
                width: m.size,
                height: m.size,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,244,225,0.95), rgba(255,228,190,0.5) 50%, transparent 75%)',
                filter: 'blur(0.6px)',
                animation: `wash-drift ${m.dur}s linear ${m.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* whisper of grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            pointerEvents: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* deepen the right so the words read */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 35%, rgba(10,8,6,0.55) 72%, rgba(10,8,6,0.82) 100%)',
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
            style={{
              ...reveal(900, 2.2),
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
            style={{
              ...reveal(1700),
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
            style={{
              ...reveal(2900),
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
            href="#"
            style={{
              ...reveal(3900),
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
