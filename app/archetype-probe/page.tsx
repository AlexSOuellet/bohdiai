/** THROWAWAY PROBE index — hand-built store-body archetypes. Same niche
 *  and mood across both (Salt Hill Bakery, RUSTIC), only the composition
 *  shape differs. Reacts to: does archetype-as-structure pull enough
 *  weight that Bohdi can stay in the language lane? Delete with the folder. */

const ARCHETYPES = [
  {
    slug: 'bakery-broadsheet',
    label: 'Broadsheet — 19th-century village newspaper (frontend-design skill applied)',
    note: 'Committed direction. Replaces the AI-builder section vocabulary entirely: masthead, lead story, almanac, classifieds, society column, baker’s note, colophon. Abril Fatface + Bodoni Moda + Spectral + DM Mono. Grain overlay, drop caps, double rules, halftone photos, orchestrated page-load reveal.',
  },
  {
    slug: 'bakery-editorial',
    label: 'Editorial — first attempt (kept for comparison)',
    note: 'Asymmetric magazine-feel. The version Alex called out as no different from what Bohdi already produces.',
  },
  {
    slug: 'bakery-catalog',
    label: 'Catalog-forward — first attempt (kept for comparison)',
    note: 'Mixed-size mosaic. Same call-out applies — looks almost the same as the editorial version.',
  },
];

export default function ArchetypeProbeIndex() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Archetype probe</h1>
      <p style={{ color: '#555', marginTop: 12, lineHeight: 1.55 }}>
        Both pages are <strong>Salt Hill Bakery</strong> in <strong>RUSTIC</strong> mood. Same design
        system (Fraunces + Manrope, warm cream / sienna palette, paper texture). Same copy voice.
        Same imagery pool. <strong>Only the composition shape differs</strong> — that&rsquo;s the
        archetype doing its job.
      </p>
      <ul style={{ marginTop: 28, paddingLeft: 0, listStyle: 'none' }}>
        {ARCHETYPES.map((a) => (
          <li key={a.slug} style={{ marginBottom: 24 }}>
            <a
              href={`/archetype-probe/${a.slug}`}
              style={{ color: '#B5471F', fontWeight: 600, fontSize: 18 }}
            >
              {a.label} →
            </a>
            <div style={{ color: '#666', fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{a.note}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
