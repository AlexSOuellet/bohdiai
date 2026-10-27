'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { entryFor, sectionFor, type NavSection } from '@/lib/backend/modules';
import { NavIcon } from './NavIcon';

/** On a phone, the places she goes most sit along the bottom, in thumb reach:
 *  Home and the next three groups, then Menu for everything else. */
export function BottomBar({ nav, menuOpen, onMenu }: { nav: NavSection[]; menuOpen: boolean; onMenu: () => void }): React.ReactElement {
  const pathname = usePathname();
  const here = sectionFor(nav, pathname);
  const shown = nav.filter((s) => s.section !== 'Account' && s.section !== 'Help').slice(0, 4);
  return (
    <nav className="bk-bottom" aria-label="Shortcuts">
      {shown.map((section) => {
        const entry = entryFor(section);
        return (
          <Link key={entry.href} href={entry.href as Route} className="bk-bottom-link" aria-current={section === here ? 'page' : undefined}>
            <NavIcon name={section.section === '' ? entry.label : section.section} />
            {entry.label}
          </Link>
        );
      })}
      <button type="button" className="bk-bottom-link" aria-expanded={menuOpen} aria-controls="bk-side" onClick={onMenu}>
        <NavIcon name="Menu" />
        Menu
      </button>
    </nav>
  );
}
