'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ParallaxImageProps {
  /** Children should be the image element(s) and any overlays. */
  children: ReactNode;
  /** How aggressive the parallax is in pixels. Negative = upward drift. */
  amount?: number;
  className?: string;
}

/**
 * Wraps content (typically a positioned image) and parallaxes its vertical
 * offset as the section scrolls through the viewport. Inner content should
 * fill its container and be slightly oversized so the parallax never reveals
 * empty space at the edges.
 */
export default function ParallaxImage({ children, amount = 80, className }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [amount, -amount]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="absolute inset-[-10%]">
        {children}
      </motion.div>
    </div>
  );
}
