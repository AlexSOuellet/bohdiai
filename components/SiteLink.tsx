'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { siteOrigin, type SiteTarget } from '@/lib/site/arms';

/** The page's own address never changes under a link, so there is nothing to subscribe to. */
function noChanges(): () => void {
  return () => undefined;
}

/**
 * A link to the parent or one of the arms. It renders the live address, then,
 * once in the browser, follows the visitor's own host, so on this computer
 * (localhost) the parent and arms link to each other locally.
 */
export function SiteLink({
  to,
  path = '',
  className,
  children,
}: {
  to: SiteTarget;
  path?: string;
  className?: string;
  children: ReactNode;
}): React.ReactElement {
  const origin = useSyncExternalStore(
    noChanges,
    () => siteOrigin(to, window.location),
    () => siteOrigin(to),
  );
  return (
    <a href={`${origin}${path}`} className={className}>
      {children}
    </a>
  );
}
