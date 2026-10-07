'use client';

/**
 * The cart's browser-side controls, shared by every design that sells through
 * the cart: add a piece, take one out, and the count in the nav. Each writes the
 * one cart cookie (lib/storefront/cart.ts) and tells the page it changed. The
 * words and classes come from the design that places them.
 */
import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { CART_EVENT, addToCart, cartCookieString, cartFromCookieHeader, removeFromCart } from './cart';
import { PROMO_COOKIE, normalizeCode } from './promotions';

function readCart(): string[] {
  return cartFromCookieHeader(document.cookie);
}

function writeCart(ids: readonly string[]): boolean {
  document.cookie = cartCookieString(ids, window.location.protocol === 'https:');
  window.dispatchEvent(new Event(CART_EVENT));
  return true;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener('focus', onChange);
  };
}

/** The cart as a stable string so React can compare snapshots. */
function useCartKey(): string {
  return useSyncExternalStore(
    subscribe,
    () => readCart().join('.'),
    () => '',
  );
}

export function useCartIds(): string[] {
  const key = useCartKey();
  return key === '' ? [] : key.split('.');
}

/** "Add to cart" for one piece; once added it turns into a link to the cart. */
export function AddToCartButton({
  listingId,
  addLabel,
  inCartLabel,
  fullLabel,
  className,
}: {
  listingId: string;
  addLabel: string;
  inCartLabel: string;
  /** Shown when the cart already holds as many pieces as it can. */
  fullLabel: string;
  className: string;
}): ReactElement {
  const ids = useCartIds();
  const [refused, setRefused] = useState(false);
  if (ids.includes(listingId)) {
    return (
      <a className={className} href="/cart">
        {inCartLabel}
      </a>
    );
  }
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          const next = addToCart(readCart(), listingId);
          if (!next.includes(listingId)) {
            setRefused(true);
            return;
          }
          writeCart(next);
        }}
      >
        {addLabel}
      </button>
      {refused && <p role="alert">{fullLabel}</p>}
    </>
  );
}

/** Take one piece out, then re-read the cart page. */
export function RemoveFromCartButton({
  listingId,
  label,
  ariaLabel,
  className,
}: {
  listingId: string;
  label: string;
  ariaLabel?: string | undefined;
  className: string;
}): ReactElement {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        writeCart(removeFromCart(readCart(), listingId));
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}

/** Empty the cart (after an order is sent). Renders nothing. */
export function ClearCart(): null {
  useEffect(() => {
    writeCart([]);
  }, []);
  return null;
}

/** Drop from the cookie any piece the cart page no longer lists (taken down
 *  since it was added), so the nav count matches the page. Renders nothing. */
export function SyncCart({ ids }: { ids: string[] }): null {
  useEffect(() => {
    const now = readCart();
    const kept = now.filter((id) => ids.includes(id));
    if (kept.length !== now.length) writeCart(kept);
  }, [ids]);
  return null;
}

/** The nav's cart link with its count; `label(n)` words it. */
export function CartLink({
  label,
  className,
}: {
  label: (count: number) => string;
  className?: string | undefined;
}): ReactElement {
  const count = useCartIds().length;
  return (
    <a className={className} href="/cart">
      {label(count)}
    </a>
  );
}

function writeCode(code: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const value = normalizeCode(code);
  document.cookie = `${PROMO_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${value === '' ? 0 : 60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
}

/** The cart's discount-code box: apply a code (kept a week in its own cookie, then
 *  the page re-prices) or take it off. The words come from the design. */
export function PromoCodeForm({
  current,
  labels,
  className,
}: {
  /** The code the cart is holding, if any. */
  current: string | null;
  labels: { field: string; apply: string; remove: string; applying: string };
  className: string;
}): ReactElement {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  if (current !== null) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            writeCode('');
            router.refresh();
          }}
        >
          {labels.remove}
        </button>
      </div>
    );
  }
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (normalizeCode(value) === '') return;
        setBusy(true);
        writeCode(value);
        router.refresh();
      }}
    >
      <label>
        {labels.field}
        <input name="code" value={value} maxLength={40} autoComplete="off" autoCapitalize="characters" onChange={(e) => setValue(e.target.value)} />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? labels.applying : labels.apply}
      </button>
    </form>
  );
}
