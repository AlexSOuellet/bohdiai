/** THROWAWAY PROBE — a Posy-style POSTER statement page for a fictional brand
 * (Rustic Rhody, a Rhode Island woodworker). NOT a literal magazine — a bold,
 * art-directed brand statement: big wordmark, a tilted framed hero product with
 * offset shadows, a stamp, product chips, mostly static with a couple of slow
 * fades. Runs taller than the viewport. Plain <img> so no next.config change.
 * Delete with the folder. */
import type { CSSProperties } from 'react';

// Verified-live woodworking shots. Swap freely.
const IMG = {
  hero: 'https://images.unsplash.com/photo-1666013942797-9daa4b8b3b4f?fm=jpg&q=70&w=1600&auto=format&fit=crop',
  a: 'https://images.unsplash.com/photo-1624811533744-f85d5325d49c?fm=jpg&q=70&w=900&auto=format&fit=crop',
  b: 'https://images.unsplash.com/photo-1690983321709-0eccbcb20d00?fm=jpg&q=70&w=900&auto=format&fit=crop',
  c: 'https://images.unsplash.com/photo-1617695615794-a5abcece0f48?fm=jpg&q=70&w=900&auto=format&fit=crop',
};

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,500&family=Caveat:wght@600;700&family=Inter:wght@400;500;600&display=swap';

function fade(delaySec: number, durationSec = 3): CSSProperties {
  return {
    '--stage-reveal-duration': `${durationSec}s`,
    animation: `stage-fade var(--stage-reveal-duration) linear ${delaySec}s both`,
  } as CSSProperties;
}

const C = {
  paper: '#f1e4cd',
  ink: '#241a10',
  walnut: '#5a3d28',
  barn: '#9e3b2e',
  gold: '#c98a3c',
  sage: '#6f7d4f',
};

const label: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 'clamp(11px, 1vw, 13px)',
  fontWeight: 600,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
};

function Chip({ img, name }: { img: string; name: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          aspectRatio: '4 / 5',
          border: `3px solid ${C.ink}`,
          overflow: 'hidden',
          background: '#0002',
          boxShadow: `-8px 10px 0 -2px ${C.gold}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div
        style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 700,
          fontSize: 'clamp(18px, 2vw, 24px)',
          marginTop: 14,
        }}
      >
        {name}
      </div>
    </div>
  );
}

export default function RusticRhodyPoster() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />

      <main
        style={{
          minHeight: '100vh',
          width: '100%',
          background: `radial-gradient(120% 80% at 75% 18%, #f7eed9 0%, ${C.paper} 55%, #e7d6ba 100%)`,
          color: C.ink,
          fontFamily: 'Fraunces, serif',
          overflowX: 'hidden',
        }}
      >
        {/* chrome */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'clamp(20px, 2.6vw, 34px) clamp(24px, 4vw, 64px)',
          }}
        >
          <span
            style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: 'clamp(24px,2.6vw,34px)', color: C.barn, transform: 'rotate(-3deg)', display: 'inline-block' }}
          >
            Rustic Rhody
          </span>
          <nav style={{ ...label, display: 'flex', gap: 'clamp(14px,2vw,28px)', color: C.walnut }}>
            <span>Flags</span>
            <span>Boards</span>
            <span>Lazy Susans</span>
            <span>The Bench</span>
          </nav>
        </header>

        {/* POSTER */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: 'clamp(24px, 4vw, 64px)',
            alignItems: 'center',
            padding: 'clamp(8px, 2vw, 32px) clamp(24px, 4vw, 64px) clamp(40px, 5vw, 80px)',
          }}
        >
          {/* copy */}
          <div>
            <div style={{ ...label, color: C.sage, marginBottom: 18 }}>Handmade in Rhode Island</div>
            <h1
              style={{
                ...fade(0.2, 3.4),
                fontWeight: 900,
                fontSize: 'clamp(46px, 7.5vw, 116px)',
                lineHeight: 0.9,
                letterSpacing: '-0.025em',
                margin: 0,
              }}
            >
              Wood that{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: C.barn }}>remembers</span>{' '}
              the tree
            </h1>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(15px, 1.5vw, 19px)',
                lineHeight: 1.55,
                color: C.walnut,
                maxWidth: 460,
                margin: '24px 0 0',
              }}
            >
              Wooden flags, cutting boards, and lazy susans — cut, planed, and oiled one at a time on
              a bench in Rhode Island.
            </p>
            <a
              href="#"
              style={{
                display: 'inline-block',
                marginTop: 30,
                background: C.barn,
                color: C.paper,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: '0.02em',
                padding: '15px 30px',
                borderRadius: 2,
              }}
            >
              Shop the bench
            </a>
          </div>

          {/* tilted framed hero + stamp */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                ...fade(0.6, 3.6),
                position: 'relative',
                width: 'min(100%, 460px)',
                aspectRatio: '4 / 5',
                transform: 'rotate(4deg)',
                border: `7px solid ${C.ink}`,
                boxShadow: `-18px 22px 0 -3px ${C.sage}, -32px 40px 0 -4px ${C.gold}, -44px 56px 50px rgba(36,26,16,0.28)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.hero}
                alt="A finished cutting board on the bench"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* stamp */}
            <div
              style={{
                position: 'absolute',
                top: 'clamp(-6px, 1vw, 12px)',
                right: 'clamp(-4px, 2vw, 28px)',
                width: 'clamp(92px, 11vw, 132px)',
                height: 'clamp(92px, 11vw, 132px)',
                borderRadius: '50%',
                background: C.gold,
                color: C.ink,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                transform: 'rotate(13deg)',
                boxShadow: `0 0 0 4px ${C.ink}, 0 14px 26px rgba(36,26,16,0.25)`,
                fontFamily: 'Caveat, cursive',
                fontWeight: 700,
                fontSize: 'clamp(16px, 1.8vw, 22px)',
                lineHeight: 1.05,
                padding: 10,
              }}
            >
              Made by
              <br />
              hand
            </div>
          </div>
        </section>

        {/* WHAT WE MAKE — pushes the page past the fold */}
        <section
          style={{
            borderTop: `3px dashed ${C.walnut}`,
            padding: 'clamp(40px, 5vw, 72px) clamp(24px, 4vw, 64px) clamp(56px, 6vw, 96px)',
          }}
        >
          <div style={{ ...label, color: C.barn, marginBottom: 'clamp(20px,3vw,36px)' }}>
            What comes off the bench
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(20px, 3vw, 44px)',
            }}
          >
            <Chip img={IMG.a} name="Wooden Flags" />
            <Chip img={IMG.b} name="Cutting Boards" />
            <Chip img={IMG.c} name="Lazy Susans" />
          </div>
        </section>
      </main>
    </>
  );
}
