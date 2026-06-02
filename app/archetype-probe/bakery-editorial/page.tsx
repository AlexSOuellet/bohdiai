/** THROWAWAY PROBE — Archetype 1: Editorial.
 *  Salt Hill Bakery (small bakery, RUSTIC mood).
 *  Asymmetric, magazine-feel composition. Story-led, breathing room.
 *  Delete with the folder. */

const DS = `
  :root {
    --bg: #F5EFE2;
    --ink: #2A1E14;
    --ink-soft: #5A4636;
    --paper: #E8DFCD;
    --sienna: #B5471F;
    --olive: #5C6A3C;
    --rule: #D7CBB3;
    --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
    --font-body: 'Manrope', system-ui, sans-serif;
  }
  body { background: var(--bg); color: var(--ink); font-family: var(--font-body); margin: 0; }
  a { color: inherit; text-decoration: none; }
  img { display: block; }
`;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600&display=swap';

export default function EditorialBakery() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <style dangerouslySetInnerHTML={{ __html: DS }} />

      {/* Header — slim, sparse, masthead-quiet */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '28px 56px',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 24',
          }}
        >
          Salt Hill
        </div>
        <nav
          style={{
            display: 'flex',
            gap: 32,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          <a href="#">The bread</a>
          <a href="#">Where to find us</a>
          <a href="#">About</a>
        </nav>
      </header>

      {/* Opening — cover-feel, asymmetric */}
      <section style={{ padding: '120px 56px 96px' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.45fr 1fr',
            gap: 96,
            alignItems: 'start',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(72px, 9vw, 144px)',
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: '-0.035em',
              margin: 0,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Bread<br />
            from a quiet<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sienna)' }}>hill</em> in<br />
            Vermont
          </h1>
          <div style={{ marginTop: 80, paddingTop: 24, borderTop: '1px solid var(--ink)' }}>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>
              Salt Hill is a one-oven bakery in Hartland. We bake six days a week with flour from
              the next valley over and water from a spring that hasn&rsquo;t run dry in a hundred
              years.
            </p>
            <div
              style={{
                marginTop: 32,
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
              }}
            >
              No. 47 · Spring 2026
            </div>
          </div>
        </div>
      </section>

      {/* Cover story — this week's bake */}
      <section style={{ padding: '80px 56px 120px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--sienna)',
              marginBottom: 32,
            }}
          >
            This week&rsquo;s bake
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.25fr 1fr',
              gap: 80,
              alignItems: 'start',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80"
              alt="The country loaf"
              style={{
                width: '100%',
                height: 560,
                objectFit: 'cover',
                filter: 'saturate(0.94) contrast(1.04)',
              }}
            />
            <div style={{ paddingTop: 24 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(48px, 5vw, 84px)',
                  fontWeight: 400,
                  lineHeight: 0.96,
                  letterSpacing: '-0.028em',
                  margin: 0,
                  fontVariationSettings: '"opsz" 84',
                }}
              >
                The
                <br />
                <em style={{ fontStyle: 'italic' }}>country</em>
                <br />
                loaf
              </h2>
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.65,
                  marginTop: 36,
                  color: 'var(--ink-soft)',
                  maxWidth: 420,
                }}
              >
                Wheat, rye, salt, water, a long cold rise. Cuts open with a quiet crackle and pulls
                in long ropes. Best with butter while it&rsquo;s still warm, or sliced thick the
                next morning under an egg.
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 32,
                  marginTop: 40,
                  paddingTop: 24,
                  borderTop: '1px solid var(--rule)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 32,
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 36',
                  }}
                >
                  $9
                </span>
                <a
                  href="#"
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--sienna)',
                    borderBottom: '1px solid var(--sienna)',
                    paddingBottom: 4,
                  }}
                >
                  Reserve a loaf
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Continued spread — varied bread features */}
      <section style={{ padding: '120px 56px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 72 }}>
            <div>
              <img
                src="https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=1400&q=80"
                alt="Seeded rye"
                style={{ width: '100%', height: 500, objectFit: 'cover' }}
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 40,
                  fontWeight: 400,
                  marginTop: 28,
                  letterSpacing: '-0.02em',
                  fontVariationSettings: '"opsz" 40',
                }}
              >
                Seeded rye{' '}
                <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic', fontWeight: 400 }}>
                  — $11
                </span>
              </h3>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--ink-soft)',
                  maxWidth: 480,
                  marginTop: 10,
                  lineHeight: 1.55,
                }}
              >
                Caraway, fennel, and a long sour. Dense and tight-crumbed, made for hard cheese and
                cold weather.
              </p>
            </div>
            <div style={{ paddingTop: 96 }}>
              <img
                src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80"
                alt="Brioche"
                style={{ width: '100%', height: 340, objectFit: 'cover' }}
              />
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 400,
                  marginTop: 22,
                  letterSpacing: '-0.02em',
                  fontVariationSettings: '"opsz" 28',
                }}
              >
                Brown butter brioche{' '}
                <span style={{ color: 'var(--ink-soft)' }}>— $12</span>
              </h3>
              <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.55 }}>
                Enriched dough, brown butter folded in cold. Friday and Saturday only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pull quote */}
      <section style={{ padding: '120px 56px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0,
              fontVariationSettings: '"opsz" 64',
            }}
          >
            &ldquo;Bread is the simplest thing,
            <br />
            and it asks for everything&rdquo;
          </p>
          <div
            style={{
              marginTop: 36,
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
            }}
          >
            — Margaret Hennessey, baker
          </div>
        </div>
      </section>

      {/* Where to find us — sidebar / list */}
      <section style={{ padding: '120px 56px' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: 96,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--sienna)',
                marginBottom: 16,
              }}
            >
              This week
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 4vw, 64px)',
                fontWeight: 400,
                lineHeight: 0.98,
                letterSpacing: '-0.025em',
                margin: 0,
                fontVariationSettings: '"opsz" 64',
              }}
            >
              Where
              <br />
              to find us
            </h2>
          </div>
          <div>
            {[
              {
                day: 'Thursday',
                date: 'Apr 18',
                place: 'Hartland Farmers Market',
                time: '3 — 6 pm',
              },
              {
                day: 'Saturday',
                date: 'Apr 20',
                place: 'Norwich Farmers Market',
                time: '9 am — 1 pm',
              },
              {
                day: 'Sunday',
                date: 'Apr 21',
                place: 'White River Junction Co-op',
                time: '10 am — 2 pm',
              },
            ].map((e) => (
              <div
                key={e.day + e.date}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 140px',
                  gap: 24,
                  padding: '28px 0',
                  borderTop: '1px solid var(--rule)',
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    fontVariationSettings: '"opsz" 24',
                  }}
                >
                  {e.day}{' '}
                  <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>{e.date}</span>
                </div>
                <div style={{ fontSize: 17 }}>{e.place}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', textAlign: 'right' }}>
                  {e.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — masthead quiet */}
      <footer
        style={{
          padding: '56px',
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 500,
            fontVariationSettings: '"opsz" 24',
          }}
        >
          Salt Hill Bakery{' '}
          <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            — Hartland, Vermont
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          © 2026 · Made with butter and time
        </div>
      </footer>
    </>
  );
}
