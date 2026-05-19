const T1 = '/storefronts/tattoo-1.webp';
const T2 = '/storefronts/tattoo-2.webp';
const T3 = '/storefronts/tattoo-3.webp';
const T4 = '/storefronts/tattoo-4.webp';
const T5 = '/storefronts/tattoo-5.webp';
const T6 = '/storefronts/tattoo-6.webp';
const T7 = '/storefronts/tattoo-7.webp';

/**
 * Iron & Ash tattoo studio demo storefront. Near-black background with
 * dotted noise texture, UnifrakturCook gothic brand, Bebas Neue all-caps
 * hero overlay, 6-grid portfolio with monospaced labels.
 */
export function TattooStore(): React.ReactElement {
  return (
    <div className="store-frame store-tattoo">
      <div className="bar">
        <div className="brand">Iron &amp; Ash</div>
        <div className="nav">
          <span>Portfolio</span>
          <span>Artists</span>
          <span>FAQ</span>
        </div>
        <div className="cta">Book consult</div>
      </div>

      <div className="hero build build-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={T1} alt="" />
        <div className="title">
          <h1>
            Custom blackwork.
            <br />
            By appointment <span className="blk">only</span>.
          </h1>
          <div className="sub">Providence, RI · est. 2014</div>
        </div>
      </div>

      <div className="artist build build-3">
        <b>Gemma Wilde</b> · 11 yrs · Providence
        <span className="quote">— &ldquo;small, slow, intentional.&rdquo;</span>
      </div>

      <div className="section build build-3">
        <div className="label">— Recent work / 06 of 47</div>
        <div className="grid">
          <Pic src={T2} label="In progress" delay="5" />
          <Pic src={T5} label="Fine line · floral" delay="5" />
          <Pic src={T6} label="Geometric · sleeve" delay="6" />
          <Pic src={T4} label="Traditional · healed" delay="6" />
          <Pic src={T7} label="Dotwork · moth" delay="7" />
          <Pic src={T3} label="The studio" delay="7" />
        </div>
      </div>

      <div className="foot">
        <span>
          <span className="open-dot" />
          Booking <span className="booking">Aug 3 onwards</span>
        </span>
        <span>Deposit 2 / 6 today</span>
      </div>
    </div>
  );
}

function Pic({ src, label, delay }: { src: string; label: string; delay: '5' | '6' | '7' }): React.ReactElement {
  return (
    <div className={`pic build build-${delay}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
      <span className="lbl">{label}</span>
    </div>
  );
}
