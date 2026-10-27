'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { HUBS, currentItem, sectionFor, type NavSection } from '@/lib/backend/modules';

/** Above each screen: its group's other screens as tabs (Products and Collections;
 *  Schedule, Sales and Results), or, inside My site, the way back to it. A group
 *  of one shows nothing. */
export function ScreenTabs({ nav }: { nav: NavSection[] }): React.ReactElement | null {
  const pathname = usePathname();
  const section = sectionFor(nav, pathname);
  if (section === null) return null;
  const hub = HUBS[section.section];
  if (hub !== undefined) {
    if (pathname === hub) return null;
    return (
      <div className="bk-tabs-bar">
        <Link href={hub as Route} className="bk-back">
          Back to {section.section}
        </Link>
      </div>
    );
  }
  if (section.items.length < 2) return null;
  const current = currentItem(section, pathname);
  return (
    <nav className="bk-tabs-bar" aria-label={section.section}>
      <ul className="bk-screen-tabs">
        {section.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href as Route} className="bk-screen-tab" aria-current={item === current ? 'page' : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
