/** THROWAWAY PROBE — Archetype attempt 3: BROADSHEET.
 *  Salt Hill Bakery, RUSTIC mood, executed as a 19th-century village
 *  newspaper. Committed direction (per frontend-design skill): pick an
 *  extreme aesthetic and execute with precision. Newspaper vocabulary
 *  replaces the AI-builder section vocabulary (no hero/products/contact
 *  stack). Type system + color pairs baked in so the unreadable-text and
 *  lost-color failure modes can't happen. Delete with the folder. */
import React from 'react';

const DS = `
  :root {
    --paper: #ECE1C6;
    --paper-deep: #E0D2AE;
    --ink: #1A1612;
    --ink-wash: #4A3F33;
    --rust: #A82E1A;
    --olive: #2D3A26;
    --rule: #1A1612;

    --f-mast: 'Abril Fatface', 'Bodoni 72', Georgia, serif;
    --f-display: 'Bodoni Moda', 'Bodoni 72', Georgia, serif;
    --f-body: 'Spectral', 'Iowan Old Style', Georgia, serif;
    --f-mono: 'DM Mono', 'Courier New', monospace;
  }

  html, body { margin: 0; padding: 0; }
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--f-body);
    font-size: 17px;
    line-height: 1.58;
    -webkit-font-smoothing: antialiased;
    position: relative;
  }

  /* grain overlay — full-page noise via SVG turbulence, layered with multiply */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    opacity: 0.32;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.09 0 0 0 0 0.07 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  }

  /* second softer warm tone wash for depth */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99;
    background:
      radial-gradient(ellipse at 30% 0%, rgba(168, 46, 26, 0.04), transparent 60%),
      radial-gradient(ellipse at 80% 100%, rgba(45, 58, 38, 0.05), transparent 65%);
  }

  a { color: var(--rust); text-decoration: none; }
  a:hover { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }

  /* page-load orchestration: staggered fade-up */
  @keyframes pgFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .stage > * { opacity: 0; animation: pgFadeUp 900ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
  .stage > *:nth-child(1) { animation-delay: 0ms; }
  .stage > *:nth-child(2) { animation-delay: 220ms; }
  .stage > *:nth-child(3) { animation-delay: 420ms; }
  .stage > *:nth-child(4) { animation-delay: 600ms; }
  .stage > *:nth-child(5) { animation-delay: 780ms; }
  .stage > *:nth-child(6) { animation-delay: 940ms; }
  .stage > *:nth-child(7) { animation-delay: 1080ms; }
  .stage > *:nth-child(8) { animation-delay: 1200ms; }
  @media (prefers-reduced-motion: reduce) {
    .stage > * { animation: none; opacity: 1; transform: none; }
  }

  /* drop cap */
  .dropcap::first-letter {
    font-family: var(--f-mast);
    font-size: 5.2em;
    line-height: 0.86;
    float: left;
    padding: 6px 12px 0 0;
    color: var(--ink);
  }

  /* halftone photo treatment */
  .print-photo {
    filter: grayscale(0.55) contrast(1.18) sepia(0.18) brightness(0.96);
    mix-blend-mode: multiply;
  }

  /* ornament rule */
  .ornament {
    display: flex; align-items: center; gap: 14px;
    color: var(--ink); font-family: var(--f-display);
    font-size: 18px;
    margin: 8px 0;
  }
  .ornament::before, .ornament::after {
    content: ''; flex: 1; height: 1px; background: var(--ink);
  }
`;

const FONTS =
  'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Mono:wght@400;500&display=swap';

export default function BroadsheetBakery() {
  return (
    <>
      <link rel="stylesheet" href={FONTS} />
      <style dangerouslySetInnerHTML={{ __html: DS }} />

      <main className="stage" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px 96px', position: 'relative', zIndex: 1 }}>

        {/* ==================== MASTHEAD ==================== */}
        <header style={{ paddingBottom: 4 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--ink-wash)',
            paddingBottom: 8, borderBottom: '1px solid var(--ink)',
          }}>
            <span>Vol. III — No. 24</span>
            <span>Hartland, Vermont</span>
            <span>Saturday · April 20 · 2026</span>
            <span>Five cents</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--f-mast)',
            fontSize: 'clamp(72px, 11vw, 168px)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 0.9,
            margin: '24px 0 8px',
            textAlign: 'center',
          }}>
            The Salt Hill Herald
          </h1>
          <div style={{
            textAlign: 'center', fontFamily: 'var(--f-display)',
            fontStyle: 'italic', fontSize: 19, color: 'var(--ink-wash)',
            letterSpacing: '0.02em',
            paddingBottom: 16, borderBottom: '4px double var(--ink)',
          }}>
            &mdash; Hot loaves &amp; honest words, baked daily since the spring of &rsquo;19 &mdash;
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--ink-wash)',
            padding: '8px 0', borderBottom: '1px solid var(--ink)',
          }}>
            <span>The bread · The almanac · The cart · From the baker</span>
            <span>Subscribe · Reserve a loaf</span>
          </div>
        </header>

        {/* ==================== LEAD STORY ==================== */}
        <section style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--ink)' }}>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--rust)', marginBottom: 12,
          }}>
            Today&rsquo;s bake · Front page
          </div>
          <h2 style={{
            fontFamily: 'var(--f-display)', fontSize: 'clamp(48px, 6.5vw, 96px)',
            fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.025em',
            margin: '0 0 16px',
            fontVariationSettings: '"opsz" 96',
          }}>
            Country Loaf, <em style={{ fontStyle: 'italic', fontWeight: 500 }}>a quiet triumph</em>
          </h2>
          <div style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
            fontSize: 20, color: 'var(--ink-wash)', lineHeight: 1.35,
            maxWidth: 880, marginBottom: 28,
          }}>
            A twenty-four-hour cold rise, a hot stone hearth, and a crust that crackles like
            kindling. Margaret Hennessey&rsquo;s wheat-rye comes home this Saturday at nine.
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr',
            gap: 32, alignItems: 'start',
          }}>
            <div>
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
                alt=""
                className="print-photo"
                style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'var(--ink-wash)',
                paddingTop: 8, borderTop: '1px solid var(--ink-wash)', marginTop: 8,
              }}>
                Figure 1 &mdash; The loaf, midmorning, before the line forms
              </div>
            </div>

            <p className="dropcap" style={{ margin: 0, columnGap: 24, color: 'var(--ink)' }}>
              Wheat from the next valley over, rye from a farm three miles up the road, salt from a
              barrel by the door, and water that has not failed in a century. That is the whole
              recipe, and it is also the whole argument. Twenty-four hours of cold fermentation
              renders a crumb that holds, a crust that resists, and an aroma that ambles down Salt
              Hill Road by half past seven each morning.
            </p>

            <p style={{ margin: 0, color: 'var(--ink)' }}>
              The hearth is a single stone oven set into the back wall of a converted dairy barn.
              No proofers, no schedules beyond the season, no shortcuts when the room runs cool.
              The loaves are scored by hand at the last minute and slid in on a peel that has worn
              a smooth groove into the bench.
              <br /><br />
              <em style={{ color: 'var(--ink-wash)' }}>
                Reservations open at six in the morning. Sells out by ten on a fair Saturday and
                by eleven when it rains.
              </em>
            </p>
          </div>

          <div style={{
            marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--ink-wash)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700 }}>
              Nine dollars even <span style={{ fontFamily: 'var(--f-mono)', fontSize: 14, color: 'var(--ink-wash)', letterSpacing: '0.1em' }}>($9)</span>
            </div>
            <a href="#" style={{
              fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.2em',
              textTransform: 'uppercase', borderBottom: '1px solid var(--rust)', paddingBottom: 3,
            }}>
              Reserve a loaf &rarr;
            </a>
          </div>
        </section>

        {/* ==================== ALMANAC ==================== */}
        <section style={{ padding: '40px 0 24px', borderBottom: '4px double var(--ink)' }}>
          <div className="ornament">
            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 26 }}>
              The Bakers&rsquo; Almanac
            </span>
          </div>
          <p style={{
            fontFamily: 'var(--f-display)', fontStyle: 'italic',
            color: 'var(--ink-wash)', textAlign: 'center', marginTop: 0,
            fontSize: 15,
          }}>
            What comes out of the hearth, day by day, this week
          </p>

          <table style={{
            width: '100%', borderCollapse: 'collapse', marginTop: 16,
            fontFamily: 'var(--f-body)', fontSize: 16,
          }}>
            <thead>
              <tr style={{ borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
                <th style={thStyle}>Day</th>
                <th style={thStyle}>The bake</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Notes</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Tuesday', 'Seeded rye', 'Caraway, fennel, long sour', '$11', 'Open'],
                ['Wednesday', 'Spelt boule', 'Heritage grain, hearth-baked', '$10', 'Open'],
                ['Thursday', 'Walnut levain', 'Toasted walnut, dark honey', '$11', 'Open'],
                ['Friday', 'Brown butter brioche', 'Enriched, butter folded cold', '$12', 'Reserve'],
                ['Saturday', 'Country loaf', 'Wheat, rye, 24-hr cold rise', '$9', 'Today'],
                ['Sunday', 'Olive sourdough', 'Castelvetrano, rosemary', '$10', 'Open'],
              ].map((r, i) => {
                const isToday = r[4] === 'Today';
                return (
                  <tr key={r[0]} style={{ borderBottom: i === 5 ? 'none' : '1px solid var(--ink-wash)' }}>
                    <td style={{ ...tdStyle, fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, color: isToday ? 'var(--rust)' : 'var(--ink)' }}>{r[0]}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--f-display)', fontWeight: 600 }}>{r[1]}</td>
                    <td style={{ ...tdStyle, color: 'var(--ink-wash)', textAlign: 'left' }}>{r[2]}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--f-mono)', textAlign: 'right' }}>{r[3]}</td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'right', color: isToday ? 'var(--rust)' : 'var(--ink-wash)' }}>{r[4]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ==================== AROUND THE OVEN ==================== */}
        <section style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--ink)' }}>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--rust)', marginBottom: 6,
          }}>
            Page two
          </div>
          <h3 style={{
            fontFamily: 'var(--f-display)', fontSize: 44, fontWeight: 700, fontStyle: 'italic',
            letterSpacing: '-0.02em', margin: '0 0 28px',
            fontVariationSettings: '"opsz" 44',
          }}>
            Around the oven
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {[
              {
                kicker: 'Returning Friday',
                head: 'Brioche, again',
                body: 'The brown-butter brioche is back this Friday after a six-week pause. Twenty-four loaves, no more — the cold-folding step is fussy and the oven only fits so many at a time.',
              },
              {
                kicker: 'A note on the line',
                head: 'Saturdays run long',
                body: 'The Saturday line for the country loaf has been wrapping around the dairy barn lately. A reservation skips the line; walk-ups welcome but bring a thermos.',
              },
              {
                kicker: 'Coming in May',
                head: 'A new wheat',
                body: 'A trial batch with Glenn Roberts&rsquo; landrace red wheat is in the test rotation for the first weekend in May. Will run as a Saturday loaf at first; news to come.',
              },
            ].map((s, i) => (
              <article
                key={s.head}
                style={{
                  padding: '0 24px',
                  borderLeft: i === 0 ? 'none' : '1px solid var(--ink)',
                }}
              >
                <div style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'var(--rust)', marginBottom: 8,
                }}>
                  {s.kicker}
                </div>
                <h4 style={{
                  fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700,
                  letterSpacing: '-0.015em', lineHeight: 1.05, margin: '0 0 12px',
                  fontVariationSettings: '"opsz" 28',
                }}>
                  {s.head}
                </h4>
                <p style={{ margin: 0, fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.55 }}>
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ==================== CLASSIFIEDS ==================== */}
        <section style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--ink)' }}>
          <div className="ornament">
            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 24 }}>
              Classifieds &mdash; available this week
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 16 }}>
            {[
              { head: 'COUNTRY LOAF', body: 'Wheat, rye, salt, water. 24-hr cold rise. Tear open warm with butter or sliced thick the next morning under an egg.', price: '$9', tag: 'Sat only · reserve' },
              { head: 'SEEDED RYE', body: 'Caraway and fennel, long sour, tight crumb. Cuts thin for hard cheese and cold weather. Tuesdays.', price: '$11', tag: 'Tue · open' },
              { head: 'SPELT BOULE', body: 'Heritage grain, hearth-baked. A nutty, gentle loaf for hands new to whole grain.', price: '$10', tag: 'Wed · open' },
              { head: 'WALNUT LEVAIN', body: 'Toasted walnuts folded through a dark honey crumb. Thick-cut for toast and good butter.', price: '$11', tag: 'Thu · open' },
              { head: 'BROWN BUTTER BRIOCHE', body: 'Enriched dough, butter folded in cold. Pulls in golden ribbons. Fridays only, 24 loaves.', price: '$12', tag: 'Fri · reserve' },
              { head: 'OLIVE SOURDOUGH', body: 'Castelvetrano olives and rosemary in a rustic round. Sundays, while they last.', price: '$10', tag: 'Sun · open' },
            ].map((c, i) => (
              <article
                key={c.head}
                style={{
                  padding: '20px 24px',
                  borderTop: i < 2 ? 'none' : '1px solid var(--ink-wash)',
                  borderLeft: i % 2 === 1 ? '1px solid var(--ink)' : 'none',
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: 6,
                }}>
                  <h5 style={{
                    fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 700,
                    letterSpacing: '0.04em', margin: 0,
                  }}>
                    {c.head}
                  </h5>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 18 }}>{c.price}</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--ink)', lineHeight: 1.5 }}>
                  {c.body}
                </p>
                <div style={{
                  fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'var(--ink-wash)',
                }}>
                  {c.tag}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ==================== FROM THE CART (markets) ==================== */}
        <section style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--ink)' }}>
          <div style={{
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: 'var(--rust)', marginBottom: 6,
          }}>
            Page three · Society
          </div>
          <h3 style={{
            fontFamily: 'var(--f-display)', fontSize: 44, fontWeight: 700, fontStyle: 'italic',
            letterSpacing: '-0.02em', margin: '0 0 8px',
            fontVariationSettings: '"opsz" 44',
          }}>
            From the cart
          </h3>
          <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--ink-wash)', marginTop: 0, marginBottom: 28 }}>
            The Salt Hill loaves will appear at the following gatherings this week.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', columnGap: 48, rowGap: 0 }}>
            {[
              ['Thursday, April 18', 'Hartland Farmers Market — village green', '3 to 6 in the afternoon'],
              ['Saturday, April 20', 'Norwich Farmers Market — old fairgrounds', '9 in the morning to 1'],
              ['Sunday, April 21', 'White River Junction Co-op — back patio', '10 in the morning to 2'],
            ].map((e) => (
              <React.Fragment key={e[0]}>
                <div style={{
                  padding: '18px 0', borderTop: '1px solid var(--ink-wash)',
                  fontFamily: 'var(--f-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18,
                }}>{e[0]}</div>
                <div style={{
                  padding: '18px 0', borderTop: '1px solid var(--ink-wash)',
                  fontSize: 17,
                }}>{e[1]}</div>
                <div style={{
                  padding: '18px 0', borderTop: '1px solid var(--ink-wash)',
                  fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-wash)', textAlign: 'right',
                }}>{e[2]}</div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ==================== FROM THE BAKER ==================== */}
        <section style={{ padding: '48px 0 32px', borderBottom: '4px double var(--ink)' }}>
          <div className="ornament">
            <span style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 22 }}>
              From the baker
            </span>
          </div>
          <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 16 }}>
            <p className="dropcap" style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink)', margin: 0 }}>
              I started Salt Hill in a corner of my mother&rsquo;s dairy barn the spring my grandfather&rsquo;s
              farm sold. The oven was salvaged from a closed bakery in Springfield and rebuilt over
              three weekends with a friend who knows brick. I wanted a hearth, a few loaves a week,
              and to be the kind of place where the bread is the whole reason you walk in.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--ink)', marginTop: 18 }}>
              The loaves are not perfect every time. The hearth cools when the door opens and the
              flour shifts with the season. What is constant is the care, and the time. If you
              ever want to know what is in a loaf or why it tastes the way it does, write back
              &mdash; I&rsquo;ll tell you.
            </p>
            <p style={{
              fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 20,
              marginTop: 28, color: 'var(--ink)',
            }}>
              &mdash; Margaret Hennessey,
              <br />
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-wash)' }}>
                baker · proprietor · Hartland
              </span>
            </p>
          </div>
        </section>

        {/* ==================== COLOPHON ==================== */}
        <footer style={{ padding: '32px 0 0' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
            gap: 48, fontSize: 13, color: 'var(--ink-wash)',
            fontFamily: 'var(--f-body)',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--f-mast)', fontSize: 28, color: 'var(--ink)',
                lineHeight: 1, marginBottom: 8,
              }}>
                Salt Hill
              </div>
              <p style={{ margin: 0, lineHeight: 1.55 }}>
                A one-oven bakery in Hartland, Vermont. Published weekly from the dairy barn at
                the corner of Salt Hill Road and Route 12.
              </p>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--ink)', marginBottom: 8,
              }}>
                Correspond
              </div>
              <div style={{ lineHeight: 1.7 }}>
                margaret@salthill.bread<br />
                802 · 555 · 0148<br />
                P.O. Box 14, Hartland VT
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--ink)', marginBottom: 8,
              }}>
                Subscribe to the Herald
              </div>
              <div style={{ lineHeight: 1.55 }}>
                A weekly note on what&rsquo;s coming out of the oven. No advertising, ever.
              </div>
              <a href="#" style={{
                display: 'inline-block', marginTop: 8,
                fontFamily: 'var(--f-mono)', fontSize: 12, letterSpacing: '0.18em',
                textTransform: 'uppercase', borderBottom: '1px solid var(--rust)', paddingBottom: 2,
              }}>
                Add my name &rarr;
              </a>
            </div>
          </div>
          <div style={{
            marginTop: 32, paddingTop: 14, borderTop: '1px solid var(--ink)',
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--ink-wash)',
          }}>
            <span>Vol. III · No. 24 · Apr 20 2026</span>
            <span>Printed with care in Hartland</span>
            <span>&copy; The Salt Hill Herald</span>
          </div>
        </footer>
      </main>
    </>
  );
}

const thStyle: React.CSSProperties = {
  fontFamily: 'var(--f-mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--ink)',
  fontWeight: 500,
  textAlign: 'left',
  padding: '12px 16px 12px 0',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  verticalAlign: 'baseline',
};
