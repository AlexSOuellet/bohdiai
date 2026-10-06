'use client';

/**
 * Boutique, nursery design — the top bar's links. Wide screens show them in a
 * row; phones get a Menu button that drops them down and closes on a pick, on
 * Escape, or on a second tap.
 */
import { useEffect, useId, useState, type ReactElement } from 'react';
import { NURSERY_STRINGS as S } from './strings';

export type MenuLink = { href: string; label: string; cta?: boolean };

export function NurseryMenu({ links }: { links: MenuLink[] }): ReactElement {
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
    <nav className="nn-nav" aria-label={S.nav.label} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className="nn-menu-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nn-menu-btn__icon" aria-hidden="true" />
        {open ? S.nav.close : S.nav.menu}
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
    </nav>
  );
}

const CTA_CLASS = 'nn-nav__cta';
