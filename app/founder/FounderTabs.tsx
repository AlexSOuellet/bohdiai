'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/founder', label: 'Dashboard' },
  { href: '/founder/invite', label: 'Invite a maker' },
  { href: '/founder/act', label: 'Act as a maker' },
  { href: '/founder/promotions', label: 'Promotions' },
  { href: '/founder/messages', label: 'Messages' },
] as const;

export function FounderTabs(): React.ReactElement {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="bk-screen-tabs">
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} className="bk-screen-tab" aria-current={path === tab.href || (tab.href !== '/founder' && path.startsWith(`${tab.href}/`)) ? 'page' : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
