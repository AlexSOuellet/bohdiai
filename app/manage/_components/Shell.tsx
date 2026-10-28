'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { POS_PATH } from '@/lib/backend/session-limits';
import { Sidebar } from './Sidebar';
import { ScreenTabs } from './ScreenTabs';
import { BottomBar } from './BottomBar';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';

/** Screens that fill the phone with no backend menu: the Market POS. */
export const BARE_PATH = POS_PATH;

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
          siteUrl={props.siteUrl}
          email={props.email}
          nav={props.nav}
          sites={props.sites}
          currentTenantId={props.currentTenantId}
          onNavigate={() => setOpen(false)}
        />
      </aside>
      {open && <button type="button" aria-label="Close menu" className="bk-backdrop" tabIndex={-1} onClick={() => setOpen(false)} />}
      <div className="bk-main">
        <ScreenTabs nav={props.nav} />
        {props.children}
      </div>
      <BottomBar nav={props.nav} menuOpen={open} onMenu={() => setOpen(true)} />
    </div>
  );
}
