/** THROWAWAY PROBE — Archetype 2: Catalog-forward.
 *  Salt Hill Bakery (small bakery, RUSTIC mood).
 *  Product-first, but composed with rhythm. Mixed-size mosaic, varied
 *  gutters, a featured product breaking the row. NOT a Shopify 3-up.
 *  Same design system + niche + mood as the editorial version — only
 *  the composition shape changes. Delete with the folder. */

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
  button { font-family: var(--font-body); cursor: pointer; }
`;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,500&family=Manrope:wght@400;500;600&display=swap';

function ProductLabel({ name, desc, price }: { name: string; desc: string; price: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 16,
        gap: 16,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 24',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 2 }}>{desc}</div>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontVariationSettings: '"opsz" 24',
        }}
      >
        {price}
      </span>
    </div>
  );
}

export default function CatalogBakery() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <style dangerouslySetInnerHTML={{ __html: DS }} />

      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 48px',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 28',
          }}
        >
          Salt Hill{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--ink-soft)', fontWeight: 400 }}>
            Bakery
          </span>
        </div>
        <nav
          style={{
            display: 'flex',
            gap: 28,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          <a href="#">Loaves</a>
          <a href="#">Pastries</a>
          <a href="#">Whole grain</a>
          <a href="#">Visit</a>
          <a href="#" style={{ color: 'var(--sienna)' }}>
            Cart (0)
          </a>
        </nav>
      </header>

      {/* Tagline + headline */}
      <div style={{ padding: '64px 48px 0', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--sienna)',
          }}
        >
          Pulled from the oven Tuesday — Sunday
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(56px, 7.5vw, 104px)',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            margin: '24px 0 0',
            fontVariationSettings: '"opsz" 96',
          }}
        >
          Fresh this <em style={{ fontStyle: 'italic', color: 'var(--sienna)' }}>morning</em>
        </h1>
      </div>

      {/* Today's bake — featured large, asymmetric */}
      <section style={{ padding: '72px 48px' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.65fr 1fr',
            gap: 56,
            alignItems: 'end',
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1500&q=80"
            alt="Country loaf"
            style={{ width: '100%', height: 560, objectFit: 'cover' }}
          />
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--sienna)',
                marginBottom: 12,
              }}
            >
              Today&rsquo;s bake
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 4.5vw, 64px)',
                fontWeight: 400,
                letterSpacing: '-0.028em',
                lineHeight: 1.02,
                margin: 0,
                fontVariationSettings: '"opsz" 64',
              }}
            >
              The country loaf
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
                marginTop: 20,
              }}
            >
              Wheat, rye, salt, water. Twenty-four hour cold rise. A loaf you&rsquo;ll want to tear
              open in the car.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 24,
                marginTop: 32,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 36,
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 40',
                }}
              >
                $9
              </span>
              <button
                style={{
                  background: 'var(--sienna)',
                  color: 'var(--bg)',
                  border: 'none',
                  padding: '14px 28px',
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Loaves mosaic — mixed sizes, breaks the grid */}
      <section style={{ padding: '72px 48px', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 40,
              borderBottom: '1px solid var(--ink)',
              paddingBottom: 16,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 48,
                fontWeight: 400,
                letterSpacing: '-0.025em',
                margin: 0,
                fontVariationSettings: '"opsz" 48',
              }}
            >
              All the loaves
            </h2>
            <span
              style={{
                fontSize: 12,
                color: 'var(--ink-soft)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Six this week
            </span>
          </div>

          {/* Row 1: big left, two stacked right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: 32,
              marginBottom: 32,
            }}
          >
            <div>
              <img
                src="https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=1300&q=80"
                alt="Seeded rye"
                style={{ width: '100%', height: 540, objectFit: 'cover' }}
              />
              <ProductLabel name="Seeded rye" desc="Caraway, fennel, long sour" price="$11" />
            </div>
            <div style={{ display: 'grid', gap: 32 }}>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80"
                  alt="Brioche"
                  style={{ width: '100%', height: 254, objectFit: 'cover' }}
                />
                <ProductLabel name="Brown butter brioche" desc="Fri / Sat only" price="$12" />
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80"
                  alt="Olive sourdough"
                  style={{ width: '100%', height: 254, objectFit: 'cover' }}
                />
                <ProductLabel name="Olive sourdough" desc="Castelvetrano, rosemary" price="$10" />
              </div>
            </div>
          </div>

          {/* Row 2: three columns, one is a reserve callout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            <div>
              <img
                src="https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=900&q=80"
                alt="Spelt boule"
                style={{ width: '100%', height: 300, objectFit: 'cover' }}
              />
              <ProductLabel name="Spelt boule" desc="Heritage grain, hearth-baked" price="$10" />
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1591985666643-1ecc67616216?auto=format&fit=crop&w=900&q=80"
                alt="Walnut levain"
                style={{ width: '100%', height: 300, objectFit: 'cover' }}
              />
              <ProductLabel name="Walnut levain" desc="Toasted walnut, honey" price="$11" />
            </div>
            <div
              style={{
                background: 'var(--bg)',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                border: '1px solid var(--rule)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--sienna)',
                }}
              >
                Sold out by 10 am
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1.22,
                  marginTop: 16,
                  marginBottom: 0,
                  fontVariationSettings: '"opsz" 28',
                }}
              >
                Reserve a loaf and we&rsquo;ll hold it for you.
              </p>
              <a
                href="#"
                style={{
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--sienna)',
                  marginTop: 24,
                  borderBottom: '1px solid var(--sienna)',
                  paddingBottom: 4,
                  alignSelf: 'flex-start',
                }}
              >
                How reservations work
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pastries strip — different shape than loaves */}
      <section style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 40,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 40,
                fontWeight: 400,
                letterSpacing: '-0.022em',
                margin: 0,
                fontVariationSettings: '"opsz" 44',
              }}
            >
              Pastries{' '}
              <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>— from the case</span>
            </h2>
            <a
              href="#"
              style={{
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--sienna)',
              }}
            >
              See all 12 →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { name: 'Morning bun', img: 'photo-1555507036-ab1f4038808a', price: '$4' },
              { name: 'Cardamom roll', img: 'photo-1509365465985-25d11c17e812', price: '$5' },
              { name: 'Almond croissant', img: 'photo-1549931319-a545dcf3bc73', price: '$5' },
              { name: 'Apple turnover', img: 'photo-1486427944299-d1955d23e34d', price: '$5' },
            ].map((p) => (
              <div key={p.name}>
                <img
                  src={`https://images.unsplash.com/${p.img}?auto=format&fit=crop&w=700&q=80`}
                  alt={p.name}
                  style={{ width: '100%', height: 220, objectFit: 'cover' }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontVariationSettings: '"opsz" 20',
                    }}
                  >
                    {p.name}
                  </span>
                  <span style={{ fontSize: 15, color: 'var(--ink-soft)' }}>{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find us */}
      <section style={{ padding: '96px 48px', background: 'var(--paper)' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: 72,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--sienna)',
                marginBottom: 14,
              }}
            >
              This week
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-0.022em',
                margin: 0,
                fontVariationSettings: '"opsz" 52',
              }}
            >
              Find us at the markets
            </h2>
          </div>
          <div>
            {[
              { day: 'Thu Apr 18', place: 'Hartland Farmers Market', time: '3 — 6 pm' },
              { day: 'Sat Apr 20', place: 'Norwich Farmers Market', time: '9 am — 1 pm' },
              { day: 'Sun Apr 21', place: 'White River Co-op', time: '10 am — 2 pm' },
            ].map((e) => (
              <div
                key={e.day}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 120px',
                  gap: 24,
                  padding: '22px 0',
                  borderTop: '1px solid var(--rule)',
                  fontSize: 16,
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontVariationSettings: '"opsz" 20',
                  }}
                >
                  {e.day}
                </span>
                <span>{e.place}</span>
                <span style={{ color: 'var(--ink-soft)', textAlign: 'right', fontSize: 14 }}>
                  {e.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '48px',
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
            fontVariationSettings: '"opsz" 22',
          }}
        >
          Salt Hill Bakery{' '}
          <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            — Hartland, Vermont
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>© 2026</div>
      </footer>
    </>
  );
}
