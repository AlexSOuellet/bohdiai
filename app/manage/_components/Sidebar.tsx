import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { NavSection } from '@/lib/backend/modules';
import type { ShopSummary } from '@/lib/auth/membership';
import { signOut } from '@/lib/backend/auth-actions';

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/manage' && pathname.startsWith(`${href}/`));
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
          <div key={section.section} className="bk-nav-section">
            <p className="bk-nav-label">{section.section}</p>
            <ul className="bk-nav-list">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    className="bk-nav-link"
                    aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
                    onClick={props.onNavigate}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
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
