'use client';

/**
 * Business site — the marquee band. Both rows pause while the pointer is over the
 * band (CSS), and a click or tap holds them paused until the next click or tap, so
 * a visitor can stop the dates long enough to read them. The band is decoration
 * for screen readers (the dates are listed for them separately), so it takes no
 * focus.
 */
import { useState, type ReactElement, type ReactNode } from 'react';

export function CardMarquee({ children }: { children: ReactNode }): ReactElement {
  const [held, setHeld] = useState(false);
  return (
    <div className={held ? 'bc-marquee is-held' : 'bc-marquee'} aria-hidden="true" onClick={() => setHeld((h) => !h)}>
      {children}
    </div>
  );
}
