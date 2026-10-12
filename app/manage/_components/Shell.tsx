'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';

/** Screens that fill the phone with no backend menu (the market day at the table). */
export const BARE_PATH = /^\/manage\/markets\/[^/]+\/day$/;

export function Shell(props: {
  siteName: string;
  siteUrl: string;
  email: string;
  nav: NavSection[];
  sites: ShopSummary[];
  currentTenantId: string;
  children: React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (BARE_PATH.test(usePathname())) return <>{props.children}</>;
  return (
    <div className="bk-frame">
      <aside id="bk-side" className="bk-side" data-open={open}>
        <Sidebar
          siteName={props.siteName}
          email={props.email}
          nav={props.nav}
          sites={props.sites}
          currentTenantId={props.currentTenantId}
          onNavigate={() => setOpen(false)}
        />
      </aside>
      {open && <button type="button" aria-label="Close menu" className="bk-backdrop" tabIndex={-1} onClick={() => setOpen(false)} />}
      <div className="bk-main">
        <header className="bk-top">
          <button type="button" className="bk-menu-btn" aria-label="Open menu" aria-expanded={open} aria-controls="bk-side" onClick={() => setOpen(true)}>
            ☰
          </button>
          <a className="bk-top-link" href={props.siteUrl} target="_blank" rel="noopener noreferrer">
            View my site ↗
          </a>
        </header>
        {props.children}
      </div>
    </div>
  );
}
