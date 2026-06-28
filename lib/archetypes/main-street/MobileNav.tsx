'use client';

import { useEffect, useRef, useState } from 'react';

export interface MobileNavItem {
  href: string;
  label: string;
}

/**
 * The Main Street menu trigger + full-screen overlay. By default it's the phone
 * nav — a burger shown only under the header's mobile breakpoint (`.ms-nav-toggle`
 * CSS) — opening a full-screen overlay with the links large in the skin's display
 * voice, fading in one after another. The overlay reads the skin's own --ms-* vars
 * (it renders inside .arch-main-street), so it matches the store with no per-skin
 * wiring. Esc closes; scroll is locked while open; focus moves to the close button
 * and back to the trigger on close.
 *
 * Two options let the menu-reveal nav reuse it at all widths: `label` renders the
 * trigger as that word (e.g. "Menu") instead of a burger, and `always` keeps the
 * trigger visible on desktop too (the gallery move — links live behind the click).
 */
export function MainStreetMobileNav({
  items,
  label,
  always = false,
}: {
  items: MobileNavItem[];
  label?: string;
  always?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className={always ? 'ms-nav-toggle ms-nav-toggle--always' : 'ms-nav-toggle'}>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={label ? 'ms-menu-trigger' : 'ms-burger'}
      >
        {label ? (
          <span data-type="navLabel" className="ms-menu-label">
            {label}
          </span>
        ) : (
          <>
            <span className="ms-burger-line" />
            <span className="ms-burger-line" />
            <span className="ms-burger-line" />
          </>
        )}
      </button>

      {open && (
        <div className="ms-mobile-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            className="ms-burger-close"
          >
            <span className="ms-burger-x" />
            <span className="ms-burger-x" />
          </button>
          <nav className="ms-mobile-links" aria-label="Site">
            {items.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${(i * 0.06 + 0.12).toFixed(2)}s` }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
