'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { entryFor, sectionFor, type NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';
import { signOut } from '@/lib/backend/auth-actions';
import { NavIcon } from './NavIcon';

/** The backend's menu (the redesign, 2026-10-27): one entry per group, in her
 *  words, never folded. The group holding the screen you're on is marked. */
export function Sidebar(props: {
  siteName: string;
  siteUrl: string;
  email: string;
  nav: NavSection[];
  sites: ShopSummary[];
  currentTenantId: string;
  onNavigate: () => void;
}): React.ReactElement {
  const pathname = usePathname();
  const here = sectionFor(props.nav, pathname);
  return (
    <>
      <div className="bk-brand">
        <Link href="/manage" className="bk-brand-name" onClick={props.onNavigate}>
          <span className="bk-ember" aria-hidden="true" />
          {props.siteName}
        </Link>
        <button type="button" className="bk-side-close" aria-label="Close menu" onClick={props.onNavigate}>
          ✕
        </button>
      </div>
      <a className="bk-brand-visit" href={props.siteUrl} target="_blank" rel="noopener noreferrer">
        Open my site
      </a>

      <nav className="bk-nav" aria-label="Backend">
        <ul className="bk-nav-list">
          {props.nav.map((section) => {
            const entry = entryFor(section);
            return (
              <li key={entry.href}>
                <Link href={entry.href as Route} className="bk-nav-link" aria-current={section === here ? 'page' : undefined} onClick={props.onNavigate}>
                  <NavIcon name={section.section === '' ? entry.label : section.section} />
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="bk-user">
        {props.sites.length > 1 && (
          <form action="/manage/switch-site" method="post" className="bk-switch">
            <label className="bk-user-label" htmlFor="bk-site">
              Switch site
            </label>
            <div className="bk-row">
              <select id="bk-site" name="tenantId" defaultValue={props.currentTenantId} className="bk-input">
                {props.sites.map((s) => (
                  <option key={s.tenantId} value={s.tenantId}>
                    {s.businessName}
                  </option>
                ))}
              </select>
              <button type="submit" className="bk-user-btn">
                Go
              </button>
            </div>
          </form>
        )}
        <p className="bk-user-email">{props.email}</p>
        <form action={signOut}>
          <button type="submit" className="bk-user-btn">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
