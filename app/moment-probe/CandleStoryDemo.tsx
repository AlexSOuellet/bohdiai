'use client';

/** THROWAWAY PROBE — intro variation: a story told in headlines that cross-fade
 * into each other over the flickering candle, ending on the brand. Slow, cinematic,
 * reduced-motion-safe. Delete with the folder. */
import { useEffect, useState, type CSSProperties } from 'react';

const DEFAULT_VIDEO = '/flickering-candle.mp4';
const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600&display=swap';

const HOLD_MS = 3400; // how long each line lingers before dissolving
const FADE = '1.8s'; // how long the cross-fade takes

// The story, told one line at a time. No terminal punctuation in headlines.
const DEFAULT_STORY = [
  'It starts with the wax',
  'Poured by hand, one at a time',
  'Then forty-five hours of patience',
  'Until it throws a light that holds the room',
];

export interface StoryMomentProps {
  video?: string;
  story?: string[];
  eyebrow?: string;
  brand?: string;
  cta?: string;
}

const cream = '#f6f1ea';

function frameStyle(visible: boolean): CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: 'clamp(28px, 6vw, 96px)',
    textAlign: 'center',
    opacity: visible ? 1 : 0,
    transition: `opacity ${FADE} linear`,
    pointerEvents: visible ? 'auto' : 'none',
    // keep the cross-fade alive under reduced motion (opacity is motion-safe)
    ['--meld-fade-duration' as string]: FADE,
  } as CSSProperties;
}

const line: CSSProperties = {
  fontFamily: 'Fraunces, serif',
  fontWeight: 400,
  fontSize: 'clamp(30px, 5.4vw, 76px)',
  lineHeight: 1.08,
  letterSpacing: '-0.01em',
  color: cream,
  maxWidth: 920,
  margin: 0,
  textShadow: '0 2px 36px rgba(0,0,0,0.5)',
};

export default function CandleStoryDemo({
  video = DEFAULT_VIDEO,
  story = DEFAULT_STORY,
  eyebrow = 'Hand-poured in Providence',
  brand = 'Ember & Oak',
  cta = 'Step inside',
}: StoryMomentProps) {
  const BRAND = story.length; // final step index
  const [step, setStep] = useState(-1); // -1 = media alone, a breath before it starts

  useEffect(() => {
    if (step >= BRAND) return; // landed on the brand — stop
    const delay = step < 0 ? 900 : HOLD_MS;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step, BRAND]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS} />

      <main style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden', background: '#0c0907' }}>
        <video
          src={video}
          autoPlay
          loop
          muted
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0.25), rgba(0,0,0,0.72))',
          }}
        />

        {/* story lines, each cross-fading into the next */}
        {story.map((text, i) => (
          <div key={i} data-meld-fade style={frameStyle(step === i)}>
            <p style={line}>{text}</p>
          </div>
        ))}

        {/* final brand frame — stays */}
        <div data-meld-fade style={frameStyle(step >= BRAND)}>
          <div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 'clamp(11px, 1.1vw, 14px)',
                fontWeight: 600,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(246,241,234,0.75)',
                marginBottom: 18,
              }}
            >
              {eyebrow}
            </div>
            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: 'clamp(48px, 9vw, 132px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                color: cream,
                margin: 0,
                textShadow: '0 2px 40px rgba(0,0,0,0.5)',
              }}
            >
              {brand}
            </h1>
            <a
              href="#"
              style={{
                display: 'inline-block',
                marginTop: 34,
                background: cream,
                color: '#1a120b',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: '0.04em',
                padding: '15px 34px',
                borderRadius: 2,
              }}
            >
              {cta}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
