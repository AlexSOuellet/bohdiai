'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NewCounts, SeenTab } from '@/lib/founder/seen';

const TABS = [
  { href: '/founder', label: 'Dashboard' },
  { href: '/founder/invite', label: 'Invite a maker' },
  { href: '/founder/act', label: 'Act as a maker' },
  { href: '/founder/promotions', label: 'Promotions' },
  { href: '/founder/messages', label: 'Messages', seen: 'messages' },
  // "Report this site" from every site's footer (go-live step 3, Alex 2026-11-16).
  { href: '/founder/reports', label: 'Reports', seen: 'reports' },
  // What people sent from the try-the-tools page (Alex, 2026-11-15).
  { href: '/founder/feedback', label: 'Feedback', seen: 'feedback' },
  { href: '/founder/emails', label: 'Emails' },
] as const satisfies readonly { href: string; label: string; seen?: SeenTab }[];

/** The admin's tabs. Messages, Reports and Feedback show how many came in since Alex
 *  last opened them (Alex, 2026-11-16); a tab opened on this visit stops showing its
 *  count, since the counts were read when the admin first loaded. */
export function FounderTabs({ counts }: { counts: NewCounts | null }): React.ReactElement {
  const path = usePathname();
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set([path]));
  useEffect(() => setOpened((o) => (o.has(path) ? o : new Set([...o, path]))), [path]);
  return (
    <nav aria-label="Admin">
      <ul className="bk-screen-tabs">
        {TABS.map((tab) => {
          const current =
            path === tab.href || (tab.href !== '/founder' && path.startsWith(`${tab.href}/`));
          const fresh =
            'seen' in tab && counts !== null && !opened.has(tab.href) ? counts[tab.seen] : 0;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className="bk-screen-tab"
                aria-current={current ? 'page' : undefined}
              >
                {tab.label}
                {fresh > 0 && (
                  <span className="fd-new" aria-label={`${fresh} new`}>
                    {fresh}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
