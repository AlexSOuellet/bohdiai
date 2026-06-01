/** THROWAWAY PROBE index — see moments.tsx. Delete with the folder. */
import { MOMENTS } from './moments';

export default function MomentProbeIndex() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Moment probe</h1>
      <p style={{ color: '#555', marginTop: 8 }}>
        Hand-built intro Moments in the current layout language, pushed until the engine
        gives out. Each links to a full-screen render.
      </p>
      <ul style={{ marginTop: 24, lineHeight: 2 }}>
        {MOMENTS.map((m) => (
          <li key={m.id}>
            <a href={`/moment-probe/${m.id}`} style={{ color: '#c24d24', fontWeight: 600 }}>
              {m.label}
            </a>
            <div style={{ color: '#666', fontSize: 14 }}>{m.intent}</div>
          </li>
        ))}
        <li style={{ marginTop: 12 }}>
          <a href="/moment-probe/meld" style={{ color: '#c24d24', fontWeight: 600 }}>
            Candles · the meld (click Enter)
          </a>
          <div style={{ color: '#666', fontSize: 14 }}>
            The intro folding into the home page — full-screen stage shrinks into the hero as the
            home slides up beneath it.
          </div>
        </li>
      </ul>
    </main>
  );
}
