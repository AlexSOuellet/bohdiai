'use client';

/**
 * Bulletin board — the tear-off tabs along the bottom of the flyer. Each tab
 * carries the owner's phone (tap calls) or leads to the contact form. A tap
 * tears the tab away first, then follows it; under reduced motion it follows
 * straight away. One tab is already gone, like a flyer people have used.
 */
import { useState, type MouseEvent, type ReactElement } from 'react';
import type { TabTarget } from './bulletin';
import { CARD_STRINGS as S } from './strings';

export const TAB_COUNT = 9;
/** The tab someone already took. */
export const TAKEN_TAB = 6;
const TEAR_MS = 650;

export function BulletinTabs({ target }: { target: TabTarget }): ReactElement {
  const [torn, setTorn] = useState<ReadonlySet<number>>(() => new Set());

  function onTear(e: MouseEvent<HTMLAnchorElement>, i: number): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    setTorn((t) => new Set(t).add(i));
    window.setTimeout(() => {
      window.location.href = target.href;
    }, TEAR_MS);
  }

  return (
    <nav className="bb-tabs" aria-label={S.bulletin.tabs}>
      {Array.from({ length: TAB_COUNT }, (_, i) => {
        if (i === TAKEN_TAB) return <span key={i} className="bb-tab bb-tab--gone" aria-hidden="true" />;
        return (
          <a key={i} className={torn.has(i) ? 'bb-tab bb-tab--tear' : 'bb-tab'} href={target.href} data-kind={target.kind} onClick={(e) => onTear(e, i)}>
            <b>{target.label}</b>
          </a>
        );
      })}
    </nav>
  );
}
