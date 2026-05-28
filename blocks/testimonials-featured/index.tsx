'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import meta from './meta';

export { meta };

interface TestimonialsFeaturedContent {
  eyebrow?: string;
  // New numbered schema
  quote_1?: string; author_1?: string; context_1?: string;
  quote_2?: string; author_2?: string; context_2?: string;
  quote_3?: string; author_3?: string; context_3?: string;
  quote_4?: string; author_4?: string; context_4?: string;
  quote_5?: string; author_5?: string; context_5?: string;
  // Legacy single-quote shape (pre-rotation rewrite)
  quote?: string;
  authorName?: string;
  authorContext?: string;
}

interface TestimonialsFeaturedProps {
  content: TestimonialsFeaturedContent;
}

interface Card {
  quote: string;
  author: string;
  context: string | undefined;
}

const ROTATE_MS = 4000;

export default function TestimonialsFeatured({ content }: TestimonialsFeaturedProps) {
  const { eyebrow } = content;

  const raw: Array<{ q: string | undefined; a: string | undefined; c: string | undefined }> = [
    // Numbered schema (current)
    { q: content.quote_1, a: content.author_1, c: content.context_1 },
    { q: content.quote_2, a: content.author_2, c: content.context_2 },
    { q: content.quote_3, a: content.author_3, c: content.context_3 },
    { q: content.quote_4, a: content.author_4, c: content.context_4 },
    { q: content.quote_5, a: content.author_5, c: content.context_5 },
    // Legacy single-quote shape — treated as testimonial #1 when no numbered entries exist
    { q: content.quote, a: content.authorName, c: content.authorContext },
  ];

  const cards: Card[] = raw
    .filter(
      (r): r is { q: string; a: string; c: string | undefined } =>
        r.q !== undefined && r.q !== '' && r.a !== undefined && r.a !== '',
    )
    .map((r) => ({ quote: r.q, author: r.a, context: r.c }));

  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (cards.length <= 1) return;
    if (reduced === true) return;
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % cards.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [cards.length, paused, reduced]);

  if (cards.length === 0) return null;

  const current = cards[index];
  if (!current) return null;

  return (
    <section
      className="relative w-full bg-s-background py-s-section sf-noise-grain overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient accent glow */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-s-accent/8 blur-[120px] pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-content mx-auto max-w-5xl px-6 text-center">
        {eyebrow !== undefined && eyebrow !== '' && (
          <p className="mb-8 font-s-body text-[0.7rem] uppercase tracking-[0.28em] text-s-accent font-bold">
            {eyebrow}
          </p>
        )}

        {/* Fixed-height frame so the section doesn't jump as quotes change. */}
        <div className="relative min-h-[280px] md:min-h-[320px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduced === true ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced === true ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
              className="w-full"
            >
              <blockquote className="font-s-heading font-light text-s-text text-xl md:text-2xl lg:text-3xl leading-[1.3] tracking-tight mb-8 max-w-3xl mx-auto">
                <span className="text-s-accent text-5xl leading-none align-top mr-2" aria-hidden="true">
                  &ldquo;
                </span>
                {current.quote}
                <span className="text-s-accent text-5xl leading-none align-bottom ml-1" aria-hidden="true">
                  &rdquo;
                </span>
              </blockquote>

              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-px bg-s-accent" aria-hidden="true" />
                <p className="font-s-body text-s-text font-medium">{current.author}</p>
                {current.context !== undefined && current.context !== '' && (
                  <>
                    <span className="text-s-muted" aria-hidden="true">·</span>
                    <p className="font-s-body text-s-muted text-sm">{current.context}</p>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicator dots — show progress through the rotation */}
        {cards.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2" aria-hidden="true">
            {cards.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show testimonial ${i + 1}`}
                className={[
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-8 bg-s-accent' : 'w-1.5 bg-s-muted/40 hover:bg-s-muted/70',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
