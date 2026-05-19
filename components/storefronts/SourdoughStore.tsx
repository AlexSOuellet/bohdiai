const IMG_COUNTRY = '/storefronts/country.webp';
const IMG_SEEDED = '/storefronts/seeded.webp';
const IMG_CINNAMON = '/storefronts/cinnamon.webp';

/**
 * June's Sourdough demo storefront. Cream paper background, Inter sans,
 * product grid with three items, farmers-market footer with email
 * subscribe pill. Hotlinked images from the design-tool CDN — should
 * migrate to /public/storefronts/ before launch.
 */
export function SourdoughStore(): React.ReactElement {
  return (
    <div className="store-frame store-sourdough">
      <div className="head build build-1">
        <div className="brand">
          <span className="mark">J</span>
          June&apos;s Sourdough
        </div>
        <div className="nav">
          <span>This week</span>
          <span>Pickup</span>
          <span>About</span>
          <span className="cart">Cart · 3</span>
        </div>
      </div>

      <div className="hero">
        <div className="build build-2">
          <h2>
            This week&apos;s <em>loaves</em>, baked Friday night.
          </h2>
          <p>
            Country, seeded, and a special cinnamon-raisin. Pickup Saturday at the farmer&apos;s
            market — 9 to 11am.
          </p>
        </div>
        <div
          className="imgbox build build-3"
          style={{ backgroundImage: `url(${IMG_COUNTRY})` }}
        >
          <span className="label">Country loaf · $9</span>
        </div>
      </div>

      <div className="items">
        <div className="item build build-5">
          <div className="sw">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_COUNTRY} alt="" />
          </div>
          <div className="n">Country</div>
          <div className="m">Naturally leavened</div>
          <div className="p">$9</div>
        </div>
        <div className="item build build-6">
          <div className="sw">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_SEEDED} alt="" />
          </div>
          <div className="n">Seeded</div>
          <div className="m">Sunflower + flax</div>
          <div className="p">$10</div>
        </div>
        <div className="item build build-7">
          <div className="sw">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG_CINNAMON} alt="" />
          </div>
          <div className="n">Cinnamon</div>
          <div className="m">Saturday only</div>
          <div className="p">$11</div>
        </div>
      </div>

      <div className="foot build build-7">
        <div className="market">
          <span className="dot" />
          Saturdays <b>9–11am</b> · Hope Street Farmers Market
        </div>
        <div className="subscribe">
          <span className="em">you@email.com</span>
          <span className="btn">Get next week&apos;s bake list →</span>
        </div>
      </div>
    </div>
  );
}
