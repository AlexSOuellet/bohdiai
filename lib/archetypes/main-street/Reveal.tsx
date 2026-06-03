'use client';

/**
 * Scroll-in reveal wrapper. Motion is an EVENT, not a state: each section
 * arrives once and resolves to stillness (a resolved section is shoppable).
 * The transition itself lives in the skin CSS (`.ms-reveal`); this only flips
 * the `in` class when the section scrolls into view. Reduced-motion is handled
 * in the CSS.
 */
import React, { useEffect, useRef, useState } from 'react';

export function Reveal({ children, delay }: { children: React.ReactNode; delay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`ms-reveal${delay ? ' d1' : ''}${shown ? ' in' : ''}`}>
      {children}
    </div>
  );
}
