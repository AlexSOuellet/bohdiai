'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface SplitRevealProps {
  text: string;
  /** Split granularity: 'char' for character-by-character, 'word' for word-by-word. */
  by?: 'char' | 'word';
  /** Stagger between elements in seconds. */
  stagger?: number;
  /** Optional delay before the reveal starts. */
  delay?: number;
  className?: string;
}

const charItem = {
  hidden: { opacity: 0, y: '0.5em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const },
  },
};

/**
 * Renders text where each character or word fades in and slides up with a
 * stagger when it enters the viewport. In char mode, characters are grouped
 * inside word wrappers with white-space: nowrap so words remain unbreakable
 * across lines (the browser can only line-break between words, never inside
 * one).
 */
export default function SplitReveal({
  text,
  by = 'word',
  stagger = 0.04,
  delay = 0,
  className,
}: SplitRevealProps) {
  const reduced = useReducedMotion();

  if (reduced === true) {
    return <span className={className}>{text}</span>;
  }

  // Tokenize at whitespace either way — preserves word integrity for line breaks.
  const tokens = text.split(/(\s+)/);

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {tokens.map((token, i) => {
        // Whitespace tokens are rendered as-is — they create the breakable
        // boundaries between words.
        if (/^\s+$/.test(token)) {
          return (
            <span key={i} aria-hidden="true">
              {token}
            </span>
          );
        }

        if (by === 'word') {
          return (
            <motion.span
              key={i}
              className="inline-block"
              style={{ whiteSpace: 'nowrap' }}
              variants={charItem}
            >
              {token}
            </motion.span>
          );
        }

        // by === 'char': render each char as its own inline-block, but wrap
        // the whole word in a nowrap span so the line-break can only happen
        // BETWEEN words, never inside one.
        const chars = Array.from(token);
        return (
          <span key={i} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
            {chars.map((ch, j) => (
              <motion.span key={j} className="inline-block" variants={charItem}>
                {ch}
              </motion.span>
            ))}
          </span>
        );
      })}
    </motion.span>
  );
}
