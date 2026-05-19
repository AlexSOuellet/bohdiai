const T1 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_154607_182dd597-4fd9-4297-900b-2c4a7ccb0d3a.png';
const T2 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_154610_d3ba53b4-7c1b-46bb-86bf-0b43be17bac6.png';
const T3 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_154636_3b5f4d07-38cb-480a-bb02-a79ca9a551e2.png';
const T4 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_154639_dc540b99-a649-4c74-be2a-5049f0fe17d1.png';
const T5 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_155801_741e6582-a3e3-4113-9d50-17f72396987e.png';
const T6 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_155804_c9973468-a3e5-467c-a606-2a7d308697df.png';
const T7 =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38zE6IRCqEvAbRQc2Z00szuFsL9/hf_20260518_155808_4c059476-49dd-440b-afb2-a9cef035894a.png';

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
