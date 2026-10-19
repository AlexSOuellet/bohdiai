import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';
import { signOut } from '@/lib/backend/auth-actions';

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/manage' && pathname.startsWith(`${href}/`));
}

/** A menu group with more than one item starts folded (Alex, 2026-10-19); its
 *  name opens and closes it. The group holding the screen you're on opens by
 *  itself, so you can see where you are. A one-item group shows its item. */
function NavGroup({ section, pathname, onNavigate }: { section: NavSection; pathname: string; onNavigate: () => void }): React.ReactElement {
  const here = section.items.some((item) => isCurrent(pathname, item.href));
  const [opened, setOpened] = useState<boolean | null>(null);
  // The group with no name (Home) is never folded and shows no heading.
  const folds = section.section !== '' && section.items.length > 1;
  const open = !folds || (opened ?? here);
  const listId = `bk-nav-${(section.section || (section.items[0]?.href ?? 'item')).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="bk-nav-section">
      {folds ? (
        <button type="button" className="bk-nav-label bk-nav-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpened(!open)}>
          {section.section}
        </button>
      ) : section.section === '' ? null : (
        <p className="bk-nav-label">{section.section}</p>
      )}
      <ul id={listId} className="bk-nav-list" hidden={!open}>
        {section.items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href as Route}
              className="bk-nav-link"
              aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar(props: {
  siteName: string;
  email: string;
  nav: NavSection[];
  sites: ShopSummary[];
  currentTenantId: string;
  onNavigate: () => void;
}): React.ReactElement {
  const pathname = usePathname();
  return (
    <>
      <div className="bk-brand">
        <Link href="/manage" className="bk-brand-name" onClick={props.onNavigate}>
          {props.siteName}
          <br />
          <span className="bk-brand-sub">Backend</span>
        </Link>
        <button type="button" className="bk-side-close" aria-label="Close menu" onClick={props.onNavigate}>
          ✕
        </button>
      </div>

      {props.sites.length > 1 && (
        <form action="/manage/switch-site" method="post" className="bk-switch">
          <label className="bk-nav-label" htmlFor="bk-site">
            Switch site
          </label>
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
        </form>
      )}

      <nav className="bk-nav" aria-label="Backend">
        {props.nav.map((section) => (
          <NavGroup key={section.section || section.items[0]?.href} section={section} pathname={pathname} onNavigate={props.onNavigate} />
        ))}
      </nav>

      <div className="bk-user">
        <div className="bk-user-row">
          <span className="bk-avatar" aria-hidden="true">
            {props.email.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="bk-user-email">{props.email}</p>
            <p className="bk-user-role">Owner</p>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="bk-user-btn">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
