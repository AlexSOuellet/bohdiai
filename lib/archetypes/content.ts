/**
 * Shared catalog content — the maker's data, archetype-agnostic.
 *
 * A product lives ONCE (projected from the listings + variations tables) and
 * the renderer reads this same shape. Prices are pre-formatted here (from
 * base_price_cents + currency) so renderers stay presentation-only.
 *
 * Mirrors the real model: supabase `listings` (+ media_ids) and
 * `variation_attributes` / `variation_options`.
 */

/** A resolved media item (media_ids → image or video). */
export interface CatalogMedia {
  kind: 'image' | 'video';
  /** Resolved URL — an image src, or a video src. */
  url?: string;
  /** Alt text for an image, or an accessible label for a video. */
  alt: string;
  /** Poster still for a video. */
  poster?: string;
}

/** One collection as a renderer sees it — projected from the `collections` table
 *  (+ its featured image and item count), archetype-agnostic like ProductView. A
 *  collection is a GROUP the shopper enters; the home shows a sampling and links
 *  each to `/collections/<slug>`. */
export interface CollectionView {
  slug: string;
  name: string;
  /** How many listings the collection holds (shown as a small count). */
  count: number;
  /** Featured image; absent until one is set. */
  cover?: CatalogMedia | undefined;
}

/** A seller-defined variation axis with its options ("Size" → S / M / L). Per D4. */
export interface CatalogVariation {
  /** Attribute name as the seller wrote it: "Size", "Metal", "Scent". */
  name: string;
  options: string[];
}

export type CatalogStatus = 'active' | 'sold_out' | 'unavailable';

/** One buyable combination of a product's options, as the shop shows it. */
export interface ProductOffer {
  /** The combination's own id (what the cart and the market app sell), from the catalog. */
  id?: string;
  /** Option name → chosen value, e.g. { Size: 'Large', Scent: 'Fig' }. */
  choices: Record<string, string>;
  /** Formatted price for this combination. */
  price: string;
  /** The price in cents behind `price`, from the catalog. */
  priceCents?: number;
  soldOut: boolean;
}

/** One product, projected from a listing (+ its media and variations). */
export interface ProductView {
  /** The listing id, when projected from the catalog (the cart keys on it). */
  id?: string;
  /** The owner ticked it for the gallery section. */
  inGallery?: boolean;
  slug: string;
  name: string;
  /** Formatted from base_price_cents + currency, e.g. "$148" or "from $40". */
  price: string;
  shortDescription?: string;
  description: string;
  status: CatalogStatus;
  /** There is just this one (Alex, 2026-10-22): once it sells it reads "Sold", not "Sold out". */
  oneOfAKind?: true;
  /** Made to order with none ready: it can still be ordered, so it isn't sold out; it reads "Order only". */
  orderOnly?: true;
  /** Ordered media resolved from media_ids — images and/or video. First is primary. */
  media: CatalogMedia[];
  /** Seller-defined variations. Empty if the product has none. */
  variations: CatalogVariation[];
  /** Buyable combinations, present when the product has options. */
  offers?: ProductOffer[];
  /** True when combinations differ in price; `price` is then the lowest. */
  priceFrom?: boolean;
  /** The owner chose this product for the home page. When any product has it, the
   *  home shows only those; absent means not chosen. */
  onHome?: boolean;
  /** The owner marked it a new arrival; absent means not new. */
  isNew?: boolean;
  /** No price yet: `price` is empty, the design shows "Ask for price", and it can't be bought. */
  askForPrice?: true;
  /** The price in cents behind `price` (the lowest buyable one), when projected from the catalog. */
  priceCents?: number;
  /** The price during a running sale, formatted; `price` stays the full price. */
  salePrice?: string;
}

/** One piece in the shopper's cart, as the cart page shows it. */
export interface CartLineView {
  /** The listing id (what the cart cookie holds). */
  id: string;
  slug: string;
  name: string;
  /** Formatted price, e.g. "$120". */
  price: string;
  photo?: CatalogMedia | undefined;
  /** False once the piece is sold out, taken down, or has options the cart can't pick. */
  available: boolean;
  /** The piece's price during a running sale; `price` is then the full price. */
  salePrice?: string | undefined;
}

/** The shopper's cart, priced from the catalog. Totals count only available pieces. */
export interface CartView {
  lines: CartLineView[];
  /** Full prices added up. */
  subtotal: string;
  /** Money off from the sale or the shopper's code (whichever saves more). */
  discount?: { label: string; amount: string } | undefined;
  /** What the order comes to. */
  total: string;
  /** Promotions are on: the cart offers a box for a discount code. */
  codes: boolean;
  /** The code the shopper entered: whether it's the one taking money off, or why not. */
  code?: { value: string; applied: boolean; message?: string | undefined } | undefined;
  /** The shop takes payment online through its own PayPal: what the PayPal button needs (nothing secret). */
  pay?: OnlinePay | undefined;
}

/** What the cart's PayPal button needs: BohdiAI's public PayPal app ID, the shop's PayPal account, the shop's currency. */
export interface OnlinePay {
  clientId: string;
  merchantId: string;
  currency: string;
}

/** A market's own shop page (Market POS piece 2): the pieces she brought, and
 *  whether the market is taking orders today. */
/** What's left of one piece at a market (Alex, 2026-10-20). `left` null: not counted.
 *  A piece with options lists each option, with its own price and what's left. */
export interface MarketPieceCount {
  left: number | null;
  options: { id: string; label: string; price: string; left: number | null }[];
}

export interface MarketShopView {
  marketId: string;
  name: string;
  /** First day and last day ('' for one day), as stored, for the design to word. */
  date: string;
  endDate: string;
  town: string;
  booth: string;
  state: 'before' | 'open' | 'after' | 'canceled';
  /** The pieces she brought, sale prices on, in her order. A piece with nothing left
   *  at this market shows as sold out. */
  pieces: ProductView[];
  /** What's left of each piece at this market, by piece id (absent: not counted). */
  stock?: Record<string, MarketPieceCount>;
  /** The ways to pay she has switched on. */
  methods: ('venmo' | 'cashapp' | 'zelle' | 'cash')[];
}

/** A market's information page on the site (Alex, 2026-10-22): its details and what
 *  she's bringing, reached by clicking the market on the site. Never takes payment;
 *  the till is the QR page (MarketShopView). */
export interface MarketInfoView {
  marketId: string;
  name: string;
  /** First day and last day ('' for one day), as stored, for the design to word. */
  date: string;
  endDate: string;
  town: string;
  hours: string;
  address: string;
  booth: string;
  /** The market's own website ('' for none). */
  url: string;
  state: 'before' | 'open' | 'after' | 'canceled';
  /** The pieces she ticked for this market, sale prices on, in her order; a piece
   *  with nothing left at this market shows as sold out. */
  pieces: ProductView[];
}
