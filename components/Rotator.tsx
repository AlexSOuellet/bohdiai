'use client';

import { useEffect, useState } from 'react';

const ROTATIONS = [
  'a sourdough baker',
  'a vintage seller',
  'a candle maker',
  'an estate sale organizer',
  'a farm stand',
  'a dog walker',
  'a ceramic studio',
  'a jewelry artist',
  'a piano teacher',
  'a soap maker',
];

/**
 * Cycles a phrase every 2.4s in sync with the rot-swap keyframe (which
 * fades the text out at the 0%/100% mark — that's when we swap content).
 */
export function Rotator(): React.ReactElement {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATIONS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block text-left">
      <span className="inline-block animate-rot-swap font-semibold text-text">
        {ROTATIONS[index]}
      </span>
    </span>
  );
}
