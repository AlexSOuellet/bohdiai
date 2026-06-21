'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

interface NavItem {
  label: string;
  href: string;
  /** Sections we haven't built yet show as honest "Soon" placeholders, not fakes. */
  soon?: boolean;
}

const ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard' },
  { label: 'My Website', href: '/dashboard/website' },
  { label: 'Listings', href: '/dashboard/listings', soon: true },
  { label: 'Orders', href: '/dashboard/orders', soon: true },
  { label: 'Settings', href: '/dashboard/settings', soon: true },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard">
      {ITEMS.map((item) => {
        const active =
          item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

        if (item.soon) {
          return (
            <span
              key={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted/60"
              aria-disabled="true"
            >
              {item.label}
              <span className="rounded-full border border-white/10 px-2 py-[2px] text-[10px] uppercase tracking-wider text-muted/70">
                Soon
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? 'page' : undefined}
            className={[
              'rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-honey/12 font-medium text-honey-warm'
                : 'text-text-soft hover:bg-white/5 hover:text-text',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
