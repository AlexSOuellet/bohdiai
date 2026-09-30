'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';

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
  return (
    <div className="bk-frame">
      <aside className="bk-side" data-open={open}>
        <Sidebar
          siteName={props.siteName}
          email={props.email}
          nav={props.nav}
          sites={props.sites}
          currentTenantId={props.currentTenantId}
          onNavigate={() => setOpen(false)}
        />
      </aside>
      {open && <button type="button" aria-label="Close menu" className="bk-backdrop" onClick={() => setOpen(false)} />}
      <div className="bk-main">
        <header className="bk-top">
          <button type="button" className="bk-menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>
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
