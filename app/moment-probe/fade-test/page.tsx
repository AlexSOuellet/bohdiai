/** THROWAWAY isolation test — does a single element fade in this browser? Delete later. */
import type { CSSProperties } from 'react';

export default function FadeTest() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#161009',
        color: '#f6f1ea',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <h1
        data-stage-reveal
        style={
          {
            '--stage-reveal-duration': '10s',
            animation: 'stage-fade var(--stage-reveal-duration) linear 0.4s both',
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(40px, 9vw, 120px)',
            fontWeight: 700,
            margin: 0,
            textAlign: 'center',
          } as CSSProperties
        }
      >
        Watch me fade in slowly
      </h1>
    </main>
  );
}
