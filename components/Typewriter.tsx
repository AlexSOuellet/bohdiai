'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cycles through `phrases`, typing each in then erasing it before moving
 * to the next. Mirrors the mock's howTick() recursion: type one char
 * every 40ms, pause 2500ms at full length, erase one char every 22ms,
 * pause 350ms between phrases.
 */
export function Typewriter({ phrases }: { phrases: readonly string[] }): React.ReactElement {
  const [text, setText] = useState('');
  const stateRef = useRef({ phraseIdx: 0, charIdx: 0, dir: 1 as 1 | -1 });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function tick(): void {
      const s = stateRef.current;
      const target = phrases[s.phraseIdx] ?? '';
      setText(target.slice(0, s.charIdx));

      if (s.dir === 1) {
        if (s.charIdx < target.length) {
          s.charIdx += 1;
          timer = setTimeout(tick, 40);
        } else {
          timer = setTimeout(() => {
            s.dir = -1;
            tick();
          }, 2500);
        }
      } else {
        if (s.charIdx > 0) {
          s.charIdx -= 1;
          timer = setTimeout(tick, 22);
        } else {
          s.phraseIdx = (s.phraseIdx + 1) % phrases.length;
          timer = setTimeout(() => {
            s.dir = 1;
            tick();
          }, 350);
        }
      }
    }

    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phrases]);

  return (
    <>
      <span aria-live="polite">{text}</span>
      <span className="ml-0.5 inline-block h-3 w-0.5 animate-blink bg-honey-warm align-middle" />
    </>
  );
}
