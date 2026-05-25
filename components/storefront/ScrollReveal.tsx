'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  yOffset = 28,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{
        duration,
        delay,
        ease: [0.2, 0.7, 0.2, 1], // premium physics-backed cubic-bezier ease out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
