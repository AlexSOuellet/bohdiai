'use client';

/**
 * Boutique, nursery design — the top bar's links. Wide screens show them in a
 * row; phones get a Menu button that drops them down and closes on a pick, on
 * Escape, or on a second tap.
 */
import { useEffect, useId, useState, type ReactElement } from 'react';
import { CartLink } from '@/lib/storefront/CartControls';
import type { NurseryWords } from './words';

export type MenuLink = { href: string; label: string; cta?: boolean };

/** `cart` puts the cart link in the bar itself, outside the phone menu, so it
 *  is always one tap away. */
export function NurseryMenu({
  links,
  w,
  cartWords,
  cart = false,
}: {
  links: MenuLink[];
  w: NurseryWords['nav'];
  cartWords: NurseryWords['cart'];
  cart?: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav className="nn-nav" aria-label={w.label} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="nn-menu-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nn-menu-btn__icon" aria-hidden="true" />
        {open ? w.close : w.menu}
      </button>
      <div className="nn-nav__links" id={panelId}>
        {links.map((l) => (
          <a
            key={l.href}
            className={l.cta === true ? CTA_CLASS : undefined}
            href={l.href}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
      </div>
      {cart && <CartLink className="nn-cartlink" label={cartWords.link} labelEmpty={cartWords.linkEmpty} />}
    </nav>
  );
}

const CTA_CLASS = 'nn-nav__cta';
