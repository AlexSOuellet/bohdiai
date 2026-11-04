'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/founder', label: 'Sites' },
  { href: '/founder/messages', label: 'Messages' },
] as const;

export function FounderTabs(): React.ReactElement {
  const path = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="bk-screen-tabs">
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} className="bk-screen-tab" aria-current={path === tab.href ? 'page' : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
