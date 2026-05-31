'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full cycle. Larger = slower. */
  duration?: number;
  /** Direction the row drifts. */
  direction?: 'left' | 'right';
  className?: string;
}

/**
 * Auto-scrolling horizontal row. Children render twice back-to-back so the
 * marquee loops seamlessly. Pauses when prefers-reduced-motion is set.
 */
export default function Marquee({
  children,
  duration = 30,
  direction = 'left',
  className,
}: MarqueeProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={['overflow-hidden whitespace-nowrap', className ?? ''].join(' ')}>
        <div className="inline-flex">{children}</div>
      </div>
    );
  }

  const distance = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div className={['overflow-hidden whitespace-nowrap', className ?? ''].join(' ')}>
      <motion.div
        className="inline-flex"
        animate={{ x: distance }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        <div className="inline-flex shrink-0">{children}</div>
        <div className="inline-flex shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
