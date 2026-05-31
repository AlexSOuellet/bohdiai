const COVER = '/storefronts/fox-cover.webp';

/**
 * Posy Lane Books demo storefront. Sky-blue background with painterly
 * cloud halos. Caveat handwritten brand wordmark, Fredoka chunky h1 with
 * a Caveat-italic accent on 'Lantern', massive book cover rotated 4°
 * with stacked drop shadows, round 'New! Aug 4' stamp, dashed-border
 * footer strip of also-from-Posy chips.
 */
export function KidsStore(): React.ReactElement {
  return (
    <div className="store-frame store-kids">
      <div className="chrome">
        <div className="brand">Posy Lane Books</div>
        <div className="nav">
          <span>Books</span>
          <span>Visits</span>
          <span>Prints</span>
          <span className="cart">Cart · 1</span>
        </div>
      </div>

      <div className="poster">
        <div className="copy build build-2">
          <div className="lockup">★ New picture book ★</div>
          <h2>
            The Fox
            <br />
            and the <em>Lantern</em>
          </h2>
          <div className="author">
            A bedtime story by <b>Posy Hartwell</b>
          </div>
          <div className="buy">
            <span className="price-tag">
              Hardcover · <b>$18</b>
            </span>
            <span className="btn">Pre-order →</span>
          </div>
        </div>
        <div className="cover build build-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COVER} alt="" />
        </div>
        <div className="stamp">
          New!
          <br />
          Aug 4
        </div>
      </div>

      <div className="quote build build-6">
        <div className="stars">★ ★ ★ ★ ★</div>
        <div className="q">
          &ldquo;A new bedtime favorite. Posy&apos;s foxes look like the ones in our
          backyard.&rdquo;
        </div>
        <div className="src">School Library Journal</div>
      </div>

      <div className="thumbs build build-5">
        <span className="label">Also from Posy →</span>
        <span className="chip red">Character prints · $24</span>
        <span className="chip yel">Signed copies · $24</span>
        <span className="chip grn">School visit · book</span>
        <span className="chip">Read-along audio · free</span>
      </div>
    </div>
  );
}
